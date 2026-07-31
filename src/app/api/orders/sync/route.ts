import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const activeModerators: string[] = data.activeModerators || [];

    // Find all unsynced orders
    const unsyncedOrders = await prisma.order.findMany({
      where: { status: 'pending_sync' },
      orderBy: { created_at: 'asc' },
    });

    if (unsyncedOrders.length === 0) {
      return NextResponse.json({ success: true, count: 0, message: 'No unsynced orders found.' });
    }

    let modIndex = 0;
    const updatedOrders = [];

    for (const order of unsyncedOrders) {
      let assignee = 'admin';
      
      if (activeModerators && activeModerators.length > 0) {
        assignee = activeModerators[modIndex];
        modIndex = (modIndex + 1) % activeModerators.length;
      }

      // Update order status to processing and set the assignee
      const updated = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'processing',
          assigned_to: assignee,
        },
      });

      // Add order status history timeline log
      await prisma.orderStatusHistory.create({
        data: {
          order_id: order.id,
          status: 'Processing',
          note: `Synchronized from storefront and assigned to ${assignee === 'admin' ? 'Super Admin' : assignee}`,
        },
      });

      updatedOrders.push(updated);
    }

    return NextResponse.json({
      success: true,
      count: updatedOrders.length,
      message: `Successfully synchronized ${updatedOrders.length} order(s).`,
    });
  } catch (error: any) {
    console.error('[API Orders Sync POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
