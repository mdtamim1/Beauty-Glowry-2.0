import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { logAdminAction } from '../../../../lib/audit';
import { verifyAdminOrModerator, verifyAdminOrModeratorV2 } from '../../../../lib/auth';

const DEFAULT_CONFIG = {
  storeName: 'Beauty Glowry',
  storeTagline: 'Clinical Skincare for Every Skin Type',
  storeEmail: 'hello@beautyglowry.com',
  storePhone: '+880 1700 000000',
  storeAddress: 'House 12, Road 4, Dhanmondi, Dhaka 1205',
  currency: 'BDT (৳)',
  language: 'English',
  metaTitle: 'Beauty Glowry — Clinical Skincare Bangladesh',
  metaDesc: 'Science-backed skincare with clinically proven active ingredients. Shop serums, moisturizers, and more.',
  googleSiteVerification: '',
  bingSiteVerification: '',
  freeShippingThreshold: '1500',
  defaultShippingFee: '120',
  estimatedDaysInside: '2-3',
  estimatedDaysOutside: '4-6',
  acceptCOD: true,
  acceptBkash: true,
  acceptNagad: true,
  acceptCard: false,
  bkashNumber: '01700000000',
  nagadNumber: '01800000000',
  codLimit: '5000',
  notifyNewOrder: true,
  notifyLowStock: true,
  notifyNewReview: true,
  notifyNewCustomer: false,
  lowStockThreshold: '10',
  adminNotifEmail: 'admin@beautyglowry.com',
  orderConfirmEmail: true,
  orderShippedSMS: true,
  zones: [
    { id: 1, name: 'Dhaka City', districts: 'Dhaka Sadar, Gulshan, Dhanmondi, Uttara', fee: 80, freeAbove: 1500 },
    { id: 2, name: 'Outside Dhaka', districts: 'Chittagong, Sylhet, Rajshahi, Khulna...', fee: 120, freeAbove: 2000 }
  ]
};

export async function GET() {
  try {
    let section = await prisma.homepageSection.findFirst({
      where: { section_type: 'store_settings' },
    });

    if (!section) {
      section = await prisma.homepageSection.create({
        data: {
          section_type: 'store_settings',
          title: 'Store Settings Config',
          config_json: JSON.stringify(DEFAULT_CONFIG),
          position: 99,
          is_active: true,
        },
      });
    }

    const config = JSON.parse(section.config_json || '{}');
    return NextResponse.json(config);
  } catch (error: any) {
    console.error('[API Admin Store Config GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await verifyAdminOrModeratorV2(request, 'Settings');
    if (auth.status !== 200) {
      return NextResponse.json({ error: auth.status === 401 ? 'Unauthorized' : 'Forbidden' }, { status: auth.status });
    }
    const admin = auth.payload;

    const data = await request.json();

    let section = await prisma.homepageSection.findFirst({
      where: { section_type: 'store_settings' },
    });

    if (!section) {
      section = await prisma.homepageSection.create({
        data: {
          section_type: 'store_settings',
          title: 'Store Settings Config',
          config_json: JSON.stringify(DEFAULT_CONFIG),
          position: 99,
          is_active: true,
        },
      });
    }

    // Merge existing configurations
    const currentConfig = JSON.parse(section.config_json || '{}');
    const updatedConfig = { ...currentConfig, ...data };

    const updated = await prisma.homepageSection.update({
      where: { id: section.id },
      data: {
        config_json: JSON.stringify(updatedConfig),
      },
    });

    await logAdminAction(
      'UPDATE_STORE_SETTINGS',
      `General store and shipping configurations were updated.`
    );

    return NextResponse.json(JSON.parse(updated.config_json));
  } catch (error: any) {
    console.error('[API Admin Store Config PUT Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
