import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { verifyAdminOrModerator } from '../../../../../lib/auth';

const STEADFAST_API_KEY = process.env.STEADFAST_API_KEY!;
const STEADFAST_SECRET_KEY = process.env.STEADFAST_SECRET_KEY!;
const STEADFAST_BASE_URL = process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1';

const sfHeaders = {
  'Api-Key': STEADFAST_API_KEY,
  'Secret-Key': STEADFAST_SECRET_KEY,
  'Content-Type': 'application/json',
};

// ── POST /api/courier/steadfast/create ── Create a consignment
export async function POST(request: NextRequest) {
  const admin = await verifyAdminOrModerator(request as any);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const {
      order_number, // BG-XXXX — used as invoice
      recipient_name,
      recipient_phone,
      recipient_address,
      cod_amount,
      note,
      item_description,
    } = body;

    if (!order_number || !recipient_name || !recipient_phone || !recipient_address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create consignment on Steadfast
    const sfRes = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
      method: 'POST',
      headers: sfHeaders,
      body: JSON.stringify({
        invoice: order_number,
        recipient_name,
        recipient_phone,
        recipient_address,
        cod_amount: Number(cod_amount) || 0,
        note: note || '',
        item_description: item_description || '',
      }),
    });

    const sfData = await sfRes.json();

    if (!sfRes.ok || sfData.status !== 200) {
      return NextResponse.json({
        error: sfData.message || 'Steadfast API error',
        details: sfData,
      }, { status: 400 });
    }

    const consignment_id = sfData.consignment?.consignment_id || sfData.consignment_id || '';
    const tracking_url = consignment_id
      ? `https://steadfast.com.bd/t/${consignment_id}`
      : '';

    // Save to database
    await prisma.order.update({
      where: { order_number },
      data: {
        consignment_id,
        tracking_url,
        courier: 'Steadfast',
        status: 'shipped',
      },
    });

    // Add status history entry
    const order = await prisma.order.findUnique({ where: { order_number } });
    if (order) {
      await prisma.orderStatusHistory.create({
        data: {
          order_id: order.id,
          status: 'Shipped',
          note: `Sent to Steadfast. Consignment ID: ${consignment_id}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      consignment_id,
      tracking_url,
      message: `Parcel sent to Steadfast. Consignment: ${consignment_id}`,
    });
  } catch (error: any) {
    console.error('[Steadfast Create Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
