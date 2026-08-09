import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { handleSendOrderConfirmationJob } from '../../../lib/jobs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeUnsynced = searchParams.get('includeUnsynced') === 'true';
    const moderatorEmail = searchParams.get('moderatorEmail');

    const whereClause: any = {};
    
    if (!includeUnsynced) {
      whereClause.status = { not: 'pending_sync' };
    }
    
    if (moderatorEmail) {
      whereClause.assigned_to = moderatorEmail;
    }

    const dbOrders = await prisma.order.findMany({
      where: whereClause,
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
        status_history: {
          orderBy: { created_at: 'desc' },
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
        createdAt: o.created_at.toISOString(),
        notes: o.customer_notes || '',
        customerNote: o.customer_notes || '',
        shopNote: o.admin_notes || '',
        thana: o.thana || '',
        area: o.area || '',
        courier: o.courier || '',
        orderHistory: o.status_history.map((h: any) => ({
          status: h.status,
          date: h.created_at.toISOString(),
          note: h.note || '',
        })),
        district: o.address?.city || '',
        assigned_to: o.assigned_to || '',
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
      email: rawEmail,
      division,
      district,
      address,
      notes,
      paymentMethod,
      items,
      subtotal,
      shipping,
      total,
      discount = 0,
    } = data;

    // email is optional — generate a phone-based placeholder for guests without email
    const email: string = rawEmail?.trim()
      ? rawEmail.trim()
      : `guest_${phone?.replace(/\D/g, '')}@beautyglowry.com`;

    if (!name || !phone || !address || !items || items.length === 0) {
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

    // 2. Address Resolution: Find or create default address for the user
    let addressRecord = await prisma.address.findFirst({
      where: {
        user_id: user.id,
        address_line: address,
      },
    });

    if (!addressRecord) {
      addressRecord = await prisma.address.create({
        data: {
          user_id: user.id,
          label: 'Default Shipping Address',
          address_line: address,
          city: district || 'Dhaka',
          zip: '1000',
        },
      });
    }

    // 3. Generate unique order number (format: BG-XXXX)
    const orderNumber = `BG-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Create the Order in a Transaction
    const order = await prisma.$transaction(async (tx: any) => {
      const createdOrder = await tx.order.create({
        data: {
          user_id: user.id,
          order_number: orderNumber,
          status: 'pending_sync',
          subtotal: subtotal,
          discount: discount,
          shipping_fee: shipping,
          total: total,
          payment_method: paymentMethod,
          payment_status: 'pending',
          address_id: addressRecord.id,
          customer_notes: notes || '',
        },
      });

      // Log the initial status in timeline history
      await tx.orderStatusHistory.create({
        data: {
          order_id: createdOrder.id,
          status: 'Pending_sync',
          note: 'Order placed via storefront, pending console synchronization',
        },
      });

      // Create order items
      for (const item of items) {
        // Find product variant ID
        let variantId = item.variant?.id || null;

        if (!variantId) {
          // Try to find variant from DB product
          const dbProduct = await tx.product.findUnique({
            where: { id: String(item.product.id) },
            include: { variants: true },
          });
          variantId = dbProduct?.variants?.[0]?.id || null;
        }

        if (!variantId) {
          // Product not in DB (static-only product).
          // Find or create a minimal product + variant so the order item can be saved.
          const productIdStr = String(item.product.id);
          let dbProduct = await tx.product.findUnique({ where: { id: productIdStr } });

          if (!dbProduct) {
            // Find the brand record (or pick the first available brand)
            const firstBrand = await tx.brand.findFirst();
            dbProduct = await tx.product.create({
              data: {
                id: productIdStr,
                name: item.product.name || 'Skincare Product',
                slug: `product-${productIdStr}`,
                sku: `SKU-PROD-${productIdStr}`,
                description: item.product.description || '',
                price: Number(item.product.price) || 0,
                stock_qty: 999,
                brand_id: firstBrand?.id || null,
                is_active: true,
              },
            });
          }

          const createdVariant = await tx.productVariant.create({
            data: {
              product_id: dbProduct.id,
              label: item.variant?.label || 'Standard',
              sku: `SKU-${productIdStr}-${Date.now()}`,
              price: Number(item.variant?.price || item.product.price) || 0,
              stock_qty: 999,
            },
          });
          variantId = createdVariant.id;
        }

        await tx.orderItem.create({
          data: {
            order_id: createdOrder.id,
            product_variant_id: variantId,
            quantity: item.quantity,
            price_at_purchase: item.variant?.price || item.product.price,
          },
        });

        // Decrement variant stock
        await tx.productVariant.update({
          where: { id: variantId },
          data: { stock_qty: { decrement: item.quantity } },
        });

        // Decrement product stock (best-effort)
        try {
          await tx.product.update({
            where: { id: String(item.product.id) },
            data: { stock_qty: { decrement: item.quantity } },
          });
        } catch {
          // ignore if product update fails
        }
      }

      // Create an Admin notification alert for the new order
      await tx.notification.create({
        data: {
          user_id: null,
          title: 'New Order Placed',
          message: `Order #${orderNumber} for ৳${total} has been received and is pending sync.`,
          is_read: false,
        },
      });

      return createdOrder;
    });

    // Send order confirmation email — wrapped in try-catch so email failure
    // never crashes the order (the order is already saved in DB above)
    if (rawEmail?.trim()) {
      try {
        await handleSendOrderConfirmationJob(email, order.order_number, String(order.total));
      } catch (emailErr: any) {
        console.warn('[Orders] Email send failed (non-fatal):', emailErr.message);
      }
    }

    return NextResponse.json({ success: true, orderId: order.order_number });
  } catch (error: any) {
    console.error('[API Orders POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

