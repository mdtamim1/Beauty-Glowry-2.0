import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifyAdminOrModerator, verifyAdminOrModeratorV2 } from '../../../lib/auth';

// Force rebuild comment

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('[API Categories GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Basic admin/moderator role check to secure POST
    const auth = await verifyAdminOrModeratorV2(request);
    if (auth.status !== 200) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status });
    }

    const data = await request.json();
    if (!data.name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newCategory = await prisma.category.upsert({
      where: { slug },
      update: { name: data.name, description: data.description || null },
      create: { id: slug, name: data.name, slug, description: data.description || null },
    });

    return NextResponse.json(newCategory);
  } catch (error: any) {
    console.error('[API Categories POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await verifyAdminOrModeratorV2(request);
    if (auth.status !== 200) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    // Unlink child categories referencing this category
    await prisma.category.updateMany({
      where: { parent_id: id },
      data: { parent_id: null }
    });

    // Unlink products associated with this category
    await prisma.product.updateMany({
      where: { category_id: id },
      data: { category_id: null }
    });

    // Delete category
    await prisma.category.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Categories DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
