import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { isActive, expires } = data;

    // Find coupon by ID or by Code
    const coupon = await prisma.coupon.findFirst({
      where: {
        OR: [
          { id: id },
          { code: id.toUpperCase() },
        ],
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    const updateData: any = {};
    
    if (isActive !== undefined) {
      updateData.expiry_date = isActive ? new Date('2030-12-31') : new Date('1970-01-01');
    }
    
    if (expires !== undefined && isActive !== false) {
      updateData.expiry_date = new Date(expires);
    }

    const updated = await prisma.coupon.update({
      where: { id: coupon.id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      code: updated.code,
      type: updated.type,
      value: Number(updated.value),
      minOrder: Number(updated.min_order_amount),
      isActive: isActive !== false,
      usedCount: 0,
      expires: updated.expiry_date.toISOString().slice(0, 10),
    });
  } catch (error: any) {
    console.error('[API Coupons PUT Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Find coupon by ID or by Code
    const coupon = await prisma.coupon.findFirst({
      where: {
        OR: [
          { id: id },
          { code: id.toUpperCase() },
        ],
      },
    });

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }

    await prisma.coupon.delete({
      where: { id: coupon.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Coupons DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
