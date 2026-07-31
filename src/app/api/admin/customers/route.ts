import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    const dbCustomers = await prisma.user.findMany({
      where: {
        role: { notIn: ['admin', 'moderator'] },
      },
      include: {
        addresses: true,
        orders: {
          where: { status: { not: 'pending_sync' } },
          include: {
            items: {
              include: {
                product_variant: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
          orderBy: { created_at: 'desc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    const formattedCustomers = dbCustomers.map((c) => {
      const orders = c.orders || [];
      const totalOrders = orders.length;
      
      const totalSpent = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      
      const lastOrderDate = orders[0]
        ? new Date(orders[0].created_at).toISOString().slice(0, 10)
        : 'N/A';
      
      const joinDate = c.created_at
        ? new Date(c.created_at).toISOString().slice(0, 10)
        : 'N/A';

      const location = c.addresses[0]
        ? `${c.addresses[0].city || c.addresses[0].address_line || 'Dhaka'}`
        : 'Bangladesh';

      const orderHistory = orders.map((o) => {
        const itemSummaries = o.items.map((item) => {
          const prodName = item.product_variant?.product?.name || 'Skincare Product';
          return item.quantity > 1 ? `${prodName} ×${item.quantity}` : prodName;
        });
        const itemsText = itemSummaries.join(', ');

        return {
          id: o.order_number,
          date: new Date(o.created_at).toISOString().slice(0, 10),
          items: itemsText || 'No items listed',
          amount: Number(o.total),
          status: o.status.charAt(0).toUpperCase() + o.status.slice(1).toLowerCase(),
        };
      });

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone || 'N/A',
        location,
        totalOrders,
        totalSpent,
        lastOrder: lastOrderDate,
        joinDate,
        skinType: c.skin_type || 'Combination',
        orderHistory,
      };
    });

    return NextResponse.json(formattedCustomers);
  } catch (error: any) {
    console.error('[API Admin Customers GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
