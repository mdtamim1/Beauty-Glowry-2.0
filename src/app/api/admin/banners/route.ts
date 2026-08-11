import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { logAdminAction } from '../../../../lib/audit';

export async function GET() {
  try {
    let banners = await prisma.banner.findMany();

    // Auto-seed default banners if empty
    if (banners.length === 0) {
      await prisma.banner.createMany({
        data: [
          {
            title: 'Clinical Skincare Solutions',
            image: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?q=80&w=800',
            link: 'Science-backed formulas for every skin condition',
            position: 'Shop Now',
            is_active: true,
          },
          {
            title: 'Hydration Shield Therapy',
            image: 'https://images.unsplash.com/photo-1608248597481-496100c8c836?q=80&w=800',
            link: 'Instantly plump & lock in moisture for 48 hours',
            position: 'Explore Collection',
            is_active: true,
          }
        ],
      });
      banners = await prisma.banner.findMany();
    }

    const formattedBanners = banners.map((b) => ({
      id: b.id,
      title: b.title || '',
      subtitle: b.link || '',
      cta: b.position || 'Shop Now',
      image: b.image,
      isActive: b.is_active,
    }));

    const response = NextResponse.json(formattedBanners);
    response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return response;
  } catch (error: any) {
    console.error('[API Admin Banners GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { title, subtitle, cta, image, isActive } = data;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const created = await prisma.banner.create({
      data: {
        title: title || '',
        link: subtitle || '',
        position: cta || 'Shop Now',
        image,
        is_active: isActive !== false,
      },
    });

    await logAdminAction(
      'CREATE_BANNER',
      `Banner slide "${created.title || 'Untitled'}" was created.`
    );

    return NextResponse.json({
      id: created.id,
      title: created.title || '',
      subtitle: created.link || '',
      cta: created.position || 'Shop Now',
      image: created.image,
      isActive: created.is_active,
    });
  } catch (error: any) {
    console.error('[API Admin Banners POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, title, subtitle, cta, image, isActive } = data;

    if (!id) {
      return NextResponse.json({ error: 'Missing banner id' }, { status: 400 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (subtitle !== undefined) updateData.link = subtitle;
    if (cta !== undefined) updateData.position = cta;
    if (image !== undefined) updateData.image = image;
    if (isActive !== undefined) updateData.is_active = isActive;

    const updated = await prisma.banner.update({
      where: { id },
      data: updateData,
    });

    await logAdminAction(
      'UPDATE_BANNER',
      `Banner slide "${updated.title || 'Untitled'}" was updated.`
    );

    return NextResponse.json({
      id: updated.id,
      title: updated.title || '',
      subtitle: updated.link || '',
      cta: updated.position || 'Shop Now',
      image: updated.image,
      isActive: updated.is_active,
    });
  } catch (error: any) {
    console.error('[API Admin Banners PUT Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing banner id' }, { status: 400 });
    }

    const deleted = await prisma.banner.delete({
      where: { id },
    });

    await logAdminAction(
      'DELETE_BANNER',
      `Banner slide "${deleted.title || 'Untitled'}" was deleted.`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Admin Banners DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
