import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { verifyAdminOrModerator } from '../../../lib/auth';

export async function GET() {
  try {
    const brands = await prisma.brand.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(brands);
  } catch (error: any) {
    console.error('[API Brands GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = await verifyAdminOrModerator(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    if (!data.name) {
      return NextResponse.json({ error: 'Brand name is required' }, { status: 400 });
    }

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newBrand = await prisma.brand.upsert({
      where: { slug },
      update: {
        name: data.name,
        logo: data.logo || null,
        description: data.description || null,
      },
      create: {
        id: slug,
        name: data.name,
        slug,
        logo: data.logo || null,
        description: data.description || null,
      },
    });

    return NextResponse.json(newBrand);
  } catch (error: any) {
    console.error('[API Brands POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await verifyAdminOrModerator(request);
    if (!auth) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
    }

    // Unlink products associated with this brand
    await prisma.product.updateMany({
      where: { brand_id: id },
      data: { brand_id: null }
    });

    // Delete brand
    await prisma.brand.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Brands DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
