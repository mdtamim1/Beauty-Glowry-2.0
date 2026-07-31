import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { logAdminAction } from '../../../../lib/audit';

export async function GET() {
  try {
    // Ensure default homepage sections exist (auto-seed if empty)
    const count = await prisma.homepageSection.count({
      where: { section_type: { not: 'store_settings' } }
    });
    
    if (count === 0) {
      await prisma.homepageSection.createMany({
        data: [
          { section_type: 'hero_slider', title: 'Main Banner', position: 1, config_json: '{}', is_active: true },
          { section_type: 'categories', title: 'Shop By Concern', position: 2, config_json: '{}', is_active: true },
          { section_type: 'countdown', title: 'Exclusive Flash Sale', position: 3, config_json: '{}', is_active: true },
          { section_type: 'bestsellers', title: 'Bestselling Formulations', position: 4, config_json: '{}', is_active: true },
          { section_type: 'quiz_cta', title: 'Dermatological Assessment', position: 5, config_json: '{}', is_active: true },
          { section_type: 'new_arrivals', title: 'New Arrivals', position: 6, config_json: '{}', is_active: true },
          { section_type: 'testimonials', title: 'Clinical Proof & Reviews', position: 7, config_json: '{}', is_active: true },
        ],
      });
    }

    const sections = await prisma.homepageSection.findMany({
      where: { section_type: { not: 'store_settings' } },
      orderBy: { position: 'asc' },
    });

    const formattedSections = sections.map((s) => ({
      key: s.section_type,
      label: s.title || '',
      isVisible: s.is_active,
    }));

    return NextResponse.json(formattedSections);
  } catch (error: any) {
    console.error('[API Admin Homepage Sections GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { key, isVisible } = data;

    if (!key) {
      return NextResponse.json({ error: 'Missing section key' }, { status: 400 });
    }

    const section = await prisma.homepageSection.findFirst({
      where: { section_type: key },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    const updated = await prisma.homepageSection.update({
      where: { id: section.id },
      data: {
        is_active: isVisible !== undefined ? isVisible : !section.is_active,
      },
    });

    await logAdminAction(
      'TOGGLE_HOMEPAGE_SECTION',
      `Homepage section "${updated.title || updated.section_type}" visibility set to ${updated.is_active ? 'Visible' : 'Hidden'}.`
    );

    return NextResponse.json({
      key: updated.section_type,
      label: updated.title || '',
      isVisible: updated.is_active,
    });
  } catch (error: any) {
    console.error('[API Admin Homepage Sections PUT Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
