import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';

const ACCESS_TOKEN_SECRET = process.env.NEXTAUTH_SECRET || 'beautyglowry-auth-secret-key-123456';

function getUserFromRequest(request: NextRequest): { id: string; email: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const decoded: any = jwt.verify(authHeader.substring(7), ACCESS_TOKEN_SECRET);
    return { id: decoded.id, email: decoded.email };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const user = getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const orders = await prisma.order.findMany({
      where: { user_id: user.id },
      include: {
        items: {
          include: {
            product_variant: {
              include: { product: { include: { images: { take: 1 } } } },
            },
          },
        },
        address: true,
        status_history: { orderBy: { created_at: 'asc' } },
      },
      orderBy: { created_at: 'desc' },
    });

    const formatted = orders.map((o: any) => ({
      id: o.order_number,
      status: o.status,
      payment_method: o.payment_method,
      payment_status: o.payment_status,
      subtotal: Number(o.subtotal),
      discount: Number(o.discount),
      shipping: Number(o.shipping_fee),
      total: Number(o.total),
      date: o.created_at.toISOString(),
      address: o.address ? `${o.address.address_line}, ${o.address.city}` : '',
      courier: o.courier || '',
      customer_notes: o.customer_notes || '',
      items: o.items.map((item: any) => ({
        name: item.product_variant?.product?.name || 'Product',
        image: item.product_variant?.product?.images?.[0]?.url || item.product_variant?.image || '',
        qty: item.quantity,
        price: Number(item.price_at_purchase),
        variant: item.product_variant?.size || '',
        productId: item.product_variant?.product_id || '',
      })),
      timeline: o.status_history.map((h: any) => ({
        status: h.status,
        note: h.note || '',
        date: h.created_at.toISOString(),
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('[Account Orders GET Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
