import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { logAdminAction } from '../../../../lib/audit';

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
    if (data.assigned_to !== undefined) updateData.assigned_to = data.assigned_to;

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

      // Stock adjustment logic
      const isOldStockRestored = currentStatus === 'cancelled' || currentStatus === 'returned';
      const isNewStockRestored = newStatus === 'cancelled' || newStatus === 'returned';

      if (isOldStockRestored !== isNewStockRestored) {
        // Fetch order items to adjust stocks
        const orderItems = await prisma.orderItem.findMany({
          where: { order_id: order.id },
          include: {
            product_variant: true,
          },
        });

        for (const item of orderItems) {
          const changeValue = item.quantity;
          if (isNewStockRestored) {
            // Increment stock (restore cancelled/returned items)
            await prisma.productVariant.update({
              where: { id: item.product_variant_id },
              data: { stock_qty: { increment: changeValue } },
            });
            await prisma.product.update({
              where: { id: item.product_variant.product_id },
              data: { stock_qty: { increment: changeValue } },
            });
          } else {
            // Decrement stock (re-commit order items)
            await prisma.productVariant.update({
              where: { id: item.product_variant_id },
              data: { stock_qty: { decrement: changeValue } },
            });
            await prisma.product.update({
              where: { id: item.product_variant.product_id },
              data: { stock_qty: { decrement: changeValue } },
            });
          }
        }
      }
    }

    // Log admin audit action
    if (isStatusChanged) {
      await logAdminAction(
        'UPDATE_ORDER_STATUS',
        `Changed status of order #${updatedOrder.order_number} to "${newStatus.toUpperCase()}"`
      );
    } else {
      await logAdminAction(
        'UPDATE_ORDER',
        `Modified details for order #${updatedOrder.order_number}`
      );
    }

    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    console.error('[API Order PUT Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
