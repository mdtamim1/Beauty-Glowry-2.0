import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { code, orderAmount } = data;

    if (!code || !code.trim()) {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const cleanCode = code.trim().toUpperCase();

    // Auto-seed default coupons if none exist in the database
    const count = await prisma.coupon.count();
    if (count === 0) {
      await prisma.coupon.createMany({
        data: [
          { code: 'GLOWRY10', type: 'percentage', value: 10.00, min_order_amount: 500.00, expiry_date: new Date('2030-12-31') },
          { code: 'FLAT100', type: 'flat', value: 100.00, min_order_amount: 1000.00, expiry_date: new Date('2030-12-31') },
        ],
      });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: cleanCode },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 400 });
    }

    // Check expiry
    if (new Date() > new Date(coupon.expiry_date)) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    // Check minimum order amount requirement
    const minAmount = Number(coupon.min_order_amount);
    if (orderAmount < minAmount) {
      return NextResponse.json({
        error: `Minimum order amount of ৳${minAmount} is required for this coupon`
      }, { status: 400 });
    }

    // Calculate discount amount
    let discountAmount = 0;
    const value = Number(coupon.value);
    if (coupon.type === 'percentage') {
      discountAmount = Math.round(orderAmount * (value / 100));
    } else {
      discountAmount = Math.round(value);
    }

    return NextResponse.json({
      success: true,
      code: coupon.code,
      type: coupon.type,
      value: value,
      discountAmount: discountAmount,
    });
  } catch (error: any) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
