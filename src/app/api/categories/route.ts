import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifyAdminOrModerator } from '../../../lib/auth';

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
    const auth = await verifyAdminOrModerator(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
