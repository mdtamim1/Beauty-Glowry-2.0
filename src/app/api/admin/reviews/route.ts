import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { logAdminAction } from '../../../../lib/audit';

export async function GET() {
  try {
    let dbReviews = await prisma.productReview.findMany({
      include: {
        product: true,
        user: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Auto-seed default reviews if empty to make the experience complete
    if (dbReviews.length === 0) {
      const defaultProduct = await prisma.product.findFirst();
      const defaultUser = await prisma.user.findFirst({
        where: { role: { notIn: ['admin', 'moderator'] } },
      });

      if (defaultProduct && defaultUser) {
        await prisma.productReview.createMany({
          data: [
            {
              product_id: defaultProduct.id,
              user_id: defaultUser.id,
              rating: 5,
              comment: 'Absolutely loved the results! My skin feels incredibly smooth and hydrated.',
              status: 'Pending',
            },
            {
              product_id: defaultProduct.id,
              user_id: defaultUser.id,
              rating: 4,
              comment: 'Great texture, absorbs quickly. Healed my flakiness within a week.',
              status: 'Approved',
              reply: 'Thank you for your wonderful feedback! We are thrilled it helped restore your skin.',
            }
          ]
        });
        dbReviews = await prisma.productReview.findMany({
          include: {
            product: true,
            user: true,
          },
          orderBy: { created_at: 'desc' },
        });
      }
    }

    const formattedReviews = dbReviews.map((r) => ({
      id: r.id,
      productName: r.product?.name || 'Skincare Product',
      userName: r.user?.name || 'Glowry Customer',
      email: r.user?.email || 'customer@beautyglowry.com',
      rating: r.rating,
      comment: r.comment || '',
      status: r.status,
      date: new Date(r.created_at).toISOString().slice(0, 10),
      reply: r.reply || undefined,
    }));

    return NextResponse.json(formattedReviews);
  } catch (error: any) {
    console.error('[API Admin Reviews GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, status, reply } = data;

    if (!id) {
      return NextResponse.json({ error: 'Missing review id' }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
    }
    if (reply !== undefined) {
      updateData.reply = reply;
      // Auto-approve if replying
      updateData.status = 'Approved';
    }

    const updated = await prisma.productReview.update({
      where: { id },
      data: updateData,
      include: {
        product: true,
        user: true,
      },
    });

    if (reply !== undefined) {
      await logAdminAction(
        'REPLY_REVIEW',
        `Replied to review by "${updated.user?.name || 'Customer'}" on product "${updated.product?.name || 'Product'}".`
      );
    } else if (status !== undefined) {
      await logAdminAction(
        'MODERATE_REVIEW',
        `Set review by "${updated.user?.name || 'Customer'}" on product "${updated.product?.name || 'Product'}" to "${status}".`
      );
    }

    return NextResponse.json({ success: true, review: updated });
  } catch (error: any) {
    console.error('[API Admin Reviews PUT Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing review id' }, { status: 400 });
    }

    const deleted = await prisma.productReview.delete({
      where: { id },
      include: {
        product: true,
        user: true,
      },
    });

    await logAdminAction(
      'DELETE_REVIEW',
      `Deleted review by "${deleted.user?.name || 'Customer'}" on product "${deleted.product?.name || 'Product'}".`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Admin Reviews DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
