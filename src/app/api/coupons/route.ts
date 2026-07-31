import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    let dbCoupons = await prisma.coupon.findMany();

    // Auto-seed default coupons if none exist in the database
    if (dbCoupons.length === 0) {
      await prisma.coupon.createMany({
        data: [
          { code: 'GLOWRY10', type: 'percentage', value: 10.00, min_order_amount: 1000.00, expiry_date: new Date('2030-12-31') },
          { code: 'BARRIER300', type: 'flat', value: 300.00, min_order_amount: 2500.00, expiry_date: new Date('2030-12-31') },
          { code: 'WELCOME5', type: 'percentage', value: 5.00, min_order_amount: 500.00, expiry_date: new Date('1970-01-01') }, // inactive coupon
          { code: 'FLASH20', type: 'percentage', value: 20.00, min_order_amount: 1500.00, expiry_date: new Date('2030-12-31') },
        ],
      });
      dbCoupons = await prisma.coupon.findMany();
    }

    const formatted = dbCoupons.map((c) => {
      const isExpired = new Date() > new Date(c.expiry_date);
      return {
        id: c.id,
        code: c.code,
        type: c.type,
        value: Number(c.value),
        minOrder: Number(c.min_order_amount),
        isActive: !isExpired,
        usedCount: 0, // mock count or query orders count using this coupon
        expires: c.expiry_date.toISOString().slice(0, 10),
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('[API Coupons GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { code, type, value, minOrder, isActive, expires } = data;

    if (!code || !type || value === undefined) {
      return NextResponse.json({ error: 'Missing coupon fields' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    const exists = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (exists) {
      return NextResponse.json({ error: 'Coupon code already exists' }, { status: 400 });
    }

    // Set expiry date based on isActive and expires parameters
    let expiryDate = new Date('2030-12-31');
    if (!isActive) {
      expiryDate = new Date('1970-01-01');
    } else if (expires) {
      expiryDate = new Date(expires);
    }

    const created = await prisma.coupon.create({
      data: {
        code: cleanCode,
        type,
        value: Number(value),
        min_order_amount: Number(minOrder) || 0,
        expiry_date: expiryDate,
      },
    });

    return NextResponse.json({
      id: created.id,
      code: created.code,
      type: created.type,
      value: Number(created.value),
      minOrder: Number(created.min_order_amount),
      isActive: isActive !== false,
      usedCount: 0,
      expires: created.expiry_date.toISOString().slice(0, 10),
    });
  } catch (error: any) {
    console.error('[API Coupons POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
