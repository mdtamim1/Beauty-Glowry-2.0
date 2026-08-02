import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';

const ACCESS_TOKEN_SECRET = process.env.NEXTAUTH_SECRET || 'beautyglowry-auth-secret-key-123456';

function getUserFromRequest(request: NextRequest): { id: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const decoded: any = jwt.verify(authHeader.substring(7), ACCESS_TOKEN_SECRET);
    return { id: decoded.id };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const auth = getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const addresses = await prisma.address.findMany({
      where: { user_id: auth.id },
      orderBy: [{ is_default: 'desc' }, { id: 'asc' }],
    });
    return NextResponse.json(addresses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { label, address_line, city, zip, is_default } = body;

    if (!label || !address_line || !city) {
      return NextResponse.json({ error: 'label, address_line and city are required' }, { status: 400 });
    }

    // If new address is default, clear others
    if (is_default) {
      await prisma.address.updateMany({
        where: { user_id: auth.id },
        data: { is_default: false },
      });
    }

    const created = await prisma.address.create({
      data: {
        user_id: auth.id,
        label: String(label).trim(),
        address_line: String(address_line).trim(),
        city: String(city).trim(),
        zip: zip ? String(zip).trim() : null,
        is_default: Boolean(is_default),
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { id, is_default } = body;

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    // Verify ownership
    const addr = await prisma.address.findFirst({ where: { id, user_id: auth.id } });
    if (!addr) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (is_default) {
      await prisma.address.updateMany({
        where: { user_id: auth.id },
        data: { is_default: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id },
      data: { is_default: Boolean(is_default) },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const addr = await prisma.address.findFirst({ where: { id, user_id: auth.id } });
    if (!addr) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.address.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
