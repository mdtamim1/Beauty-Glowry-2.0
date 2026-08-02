import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminOrModerator } from '@/lib/auth';

const STEADFAST_API_KEY = process.env.STEADFAST_API_KEY!;
const STEADFAST_SECRET_KEY = process.env.STEADFAST_SECRET_KEY!;
const STEADFAST_BASE_URL = process.env.STEADFAST_BASE_URL || 'https://portal.steadfast.com.bd/api/v1';

const sfHeaders = {
  'Api-Key': STEADFAST_API_KEY,
  'Secret-Key': STEADFAST_SECRET_KEY,
  'Content-Type': 'application/json',
};

// GET /api/courier/steadfast/status?cid=CONSIGNMENT_ID
export async function GET(request: NextRequest) {
  const admin = await verifyAdminOrModerator(request as any);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cid = searchParams.get('cid');

  if (!cid) return NextResponse.json({ error: 'cid is required' }, { status: 400 });

  try {
    const res = await fetch(`${STEADFAST_BASE_URL}/status_by_cid/${cid}`, {
      method: 'GET',
      headers: sfHeaders,
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/courier/steadfast/balance
export async function POST(request: NextRequest) {
  const admin = await verifyAdminOrModerator(request as any);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const res = await fetch(`${STEADFAST_BASE_URL}/get_balance`, {
      method: 'GET',
      headers: sfHeaders,
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
