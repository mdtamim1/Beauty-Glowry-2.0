import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrModerator } from '@/lib/auth';

const COURIERCHECK_API_KEY = process.env.COURIERCHECK_API_KEY!;
const COURIERCHECK_BASE_URL = process.env.COURIERCHECK_BASE_URL || 'https://api.bdcourier.com';

// POST /api/courier/fraud-check
// Body: { phone: "01XXXXXXXXX" }
export async function POST(request: NextRequest) {
  const admin = await verifyAdminOrModerator(request as any);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });

    // Clean the phone — ensure 11 digits
    const cleanPhone = String(phone).replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
    }

    const res = await fetch(`${COURIERCHECK_BASE_URL}/courier-check`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COURIERCHECK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone: cleanPhone }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({
        error: data.message || 'BD Courier API error',
        details: data,
      }, { status: res.status });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Fraud Check Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
