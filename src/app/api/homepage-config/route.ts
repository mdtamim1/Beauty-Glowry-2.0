import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    // Auto-seed default homepage sections config if empty
    const count = await prisma.homepageSection.count();
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
      where: { is_active: true },
      orderBy: { position: 'asc' },
    });

    const formattedSections = sections.map((s) => ({
      id: s.id,
      type: s.section_type,
      title: s.title || '',
      is_active: s.is_active,
      position: s.position,
      config: JSON.parse(s.config_json || '{}'),
    }));

    return NextResponse.json(formattedSections);
  } catch (error: any) {
    console.error('API Homepage Config GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
