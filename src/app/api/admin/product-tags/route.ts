import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminOrModeratorV2 } from '../../../../lib/auth';

const DEFAULT_SKIN_CONCERNS = [
  'Acne & Blemishes',
  'Aging & Fine Lines',
  'Dehydration & Dryness',
  'Dullness & Uneven Tone',
  'Hyperpigmentation & Dark Spots',
  'Redness & Sensitivity',
  'Enlarged Pores',
  'Excess Sebum & Oiliness',
  'Compromised Barrier',
  'Dark Circles',
];

const DEFAULT_SKIN_TYPES = [
  'Oily',
  'Dry',
  'Combination',
  'Normal',
  'Sensitive',
  'All Skin Types',
  'Acne-Prone',
  'Dehydrated',
];

const SECTION_TYPE = 'product_tags_config';

async function getOrCreateConfig() {
  let section = await prisma.homepageSection.findFirst({
    where: { section_type: SECTION_TYPE },
  });

  if (!section) {
    section = await prisma.homepageSection.create({
      data: {
        section_type: SECTION_TYPE,
        title: 'Product Tags Config',
        config_json: JSON.stringify({
          skinConcerns: DEFAULT_SKIN_CONCERNS,
          skinTypes: DEFAULT_SKIN_TYPES,
        }),
        position: 98,
        is_active: true,
      },
    });
  }

  return section;
}

export async function GET() {
  try {
    const section = await getOrCreateConfig();
    const config = JSON.parse(section.config_json || '{}');
    return NextResponse.json({
      skinConcerns: config.skinConcerns || DEFAULT_SKIN_CONCERNS,
      skinTypes: config.skinTypes || DEFAULT_SKIN_TYPES,
    });
  } catch (error: any) {
    console.error('[API Product Tags GET Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await verifyAdminOrModeratorV2(request, 'Products');
    if (auth.status !== 200) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: auth.status });
    }

    const data = await request.json();
    const section = await getOrCreateConfig();
    const current = JSON.parse(section.config_json || '{}');

    const updated = {
      skinConcerns: data.skinConcerns ?? current.skinConcerns ?? DEFAULT_SKIN_CONCERNS,
      skinTypes: data.skinTypes ?? current.skinTypes ?? DEFAULT_SKIN_TYPES,
    };

    await prisma.homepageSection.update({
      where: { id: section.id },
      data: { config_json: JSON.stringify(updated) },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[API Product Tags PUT Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
