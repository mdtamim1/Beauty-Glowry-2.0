import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';

export async function GET() {
  try {
    const dbOrders = await prisma.order.findMany({
      include: {
        address: {
          include: {
            user: true,
          },
        },
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
    });

    const formattedOrders = dbOrders.map((o: any) => {
      const customerName = o.address?.user?.name || 'Guest';
      const customerPhone = o.address?.user?.phone || '';
      const customerEmail = o.address?.user?.email || '';

      const items = o.items.map((item: any) => ({
        name: item.product_variant?.product?.name || 'Unknown Skincare Product',
        qty: item.quantity,
        price: Number(item.price_at_purchase),
      }));

      // Capitalize status
      const rawStatus = o.status;
      const status = rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1);

      return {
        id: o.order_number,
        customer: customerName,
        phone: customerPhone,
        email: customerEmail,
        address: o.address?.address_line || '',
        items,
        total: Number(o.total),
        shipping: Number(o.shipping_fee),
        payment: o.payment_method,
        status: status as any,
        date: o.created_at.toISOString().slice(0, 10),
        notes: '',
        district: o.address?.city || '',
      };
    });

    return NextResponse.json(formattedOrders);
  } catch (error: any) {
    console.error('[API Orders GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const {
      name,
      phone,
      email,
      division,
      district,
      address,
      notes,
      paymentMethod,
      items,
      subtotal,
      shipping,
      total,
    } = data;

    if (!name || !phone || !email || !address || !items || items.length === 0) {
      return NextResponse.json({ error: 'Missing required checkout information' }, { status: 400 });
    }

    // 1. Guest User resolution: Find or create User with this email
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password_hash: Math.random().toString(36).slice(-8), // guest password placeholder
          role: 'customer',
        },
      });
    } else {
      // update phone if it was empty
      if (!user.phone && phone) {
        await prisma.user.update({
          where: { id: user.id },
          data: { phone },
        });
      }
    }

    // 2. Create Address record linked to this user
    const addressRecord = await prisma.address.create({
      data: {
        user_id: user.id,
        label: 'Shipping Address',
        address_line: `${address}, ${district}, ${division}`,
        city: district,
        zip: '1000',
      },
    });

    // 3. Generate unique order number (format: BG-XXXX)
    const orderNumber = `BG-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Create the Order in a Transaction
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          user_id: user.id,
          order_number: orderNumber,
          status: 'pending',
          subtotal: subtotal,
          discount: 0,
          shipping_fee: shipping,
          total: total,
          payment_method: paymentMethod,
          payment_status: 'pending',
          address_id: addressRecord.id,
        },
      });

      // Create order items
      for (const item of items) {
        // Find product variant ID
        let variantId = item.variant?.id;

        if (!variantId) {
          // If no variant id is passed, find standard variant for the product
          const dbProduct = await tx.product.findUnique({
            where: { id: String(item.product.id) },
            include: { variants: true },
          });
          variantId = dbProduct?.variants[0]?.id;
        }

        if (!variantId) {
          throw new Error(`Product variant not found for product id: ${item.product.id}`);
        }

        await tx.orderItem.create({
          data: {
            order_id: createdOrder.id,
            product_variant_id: variantId,
            quantity: item.quantity,
            price_at_purchase: item.variant?.price || item.product.price,
          },
        });
      }

      return createdOrder;
    });

    return NextResponse.json({ success: true, orderId: order.order_number });
  } catch (error: any) {
    console.error('[API Orders POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
