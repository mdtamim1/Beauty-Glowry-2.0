import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();

    const order = await prisma.order.findUnique({
      where: { order_number: id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const currentStatus = order.status.toLowerCase();
    const newStatus = data.status ? data.status.toLowerCase() : currentStatus;
    const isStatusChanged = newStatus !== currentStatus;

    // Build DB update structure
    const updateData: any = {};
    if (data.status) updateData.status = newStatus;
    if (data.payment_status) updateData.payment_status = data.payment_status.toLowerCase();
    if (data.payment_method) updateData.payment_method = data.payment_method;
    if (data.customerNote !== undefined) updateData.customer_notes = data.customerNote;
    if (data.shopNote !== undefined) updateData.admin_notes = data.shopNote;
    if (data.courier !== undefined) updateData.courier = data.courier;
    if (data.thana !== undefined) updateData.thana = data.thana;
    if (data.area !== undefined) updateData.area = data.area;

    const updatedOrder = await prisma.order.update({
      where: { order_number: id },
      data: updateData,
    });

    // Log the status transition if status changed
    if (isStatusChanged) {
      const formatStatus = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
      await prisma.orderStatusHistory.create({
        data: {
          order_id: order.id,
          status: formatStatus(newStatus),
          note: data.statusNote || `Advanced status from ${formatStatus(currentStatus)} to ${formatStatus(newStatus)}`,
        },
      });
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('[API Order PUT Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
