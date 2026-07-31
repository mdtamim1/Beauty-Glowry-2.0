import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { logAdminAction } from '../../../../lib/audit';

export async function GET() {
  try {
    let dbQnas = await prisma.productQnA.findMany({
      include: {
        product: true,
        user: true,
      },
      orderBy: { created_at: 'desc' },
    });

    // Auto-seed default QnAs if empty
    if (dbQnas.length === 0) {
      const defaultProduct = await prisma.product.findFirst();
      const defaultUser = await prisma.user.findFirst({
        where: { role: { notIn: ['admin', 'moderator'] } },
      });

      if (defaultProduct && defaultUser) {
        await prisma.productQnA.createMany({
          data: [
            {
              product_id: defaultProduct.id,
              user_id: defaultUser.id,
              question: 'Is this serum suitable for extremely sensitive skin?',
              answer: null,
            },
            {
              product_id: defaultProduct.id,
              user_id: defaultUser.id,
              question: 'Can I use this product in my AM and PM routine together?',
              answer: 'Yes, this product is gentle enough to be used in both morning and evening routines.',
              answered_by: 'Super Admin',
            }
          ]
        });
        dbQnas = await prisma.productQnA.findMany({
          include: {
            product: true,
            user: true,
          },
          orderBy: { created_at: 'desc' },
        });
      }
    }

    const formattedQnas = dbQnas.map((q) => ({
      id: q.id,
      productName: q.product?.name || 'Skincare Product',
      userName: q.user?.name || 'Glowry Customer',
      email: q.user?.email || 'customer@beautyglowry.com',
      question: q.question,
      answer: q.answer || undefined,
      answeredBy: q.answered_by || undefined,
      date: new Date(q.created_at).toISOString().slice(0, 10),
    }));

    return NextResponse.json(formattedQnas);
  } catch (error: any) {
    console.error('[API Admin QnAs GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, answer, answeredBy } = data;

    if (!id || !answer) {
      return NextResponse.json({ error: 'Missing QnA id or answer text' }, { status: 400 });
    }

    const updated = await prisma.productQnA.update({
      where: { id },
      data: {
        answer,
        answered_by: answeredBy || 'Store Representative',
      },
      include: {
        product: true,
        user: true,
      },
    });

    await logAdminAction(
      'ANSWER_QUESTION',
      `Answered question by "${updated.user?.name || 'Customer'}" on product "${updated.product?.name || 'Product'}".`
    );

    return NextResponse.json({ success: true, qna: updated });
  } catch (error: any) {
    console.error('[API Admin QnAs PUT Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing QnA id' }, { status: 400 });
    }

    const deleted = await prisma.productQnA.delete({
      where: { id },
      include: {
        product: true,
        user: true,
      },
    });

    await logAdminAction(
      'DELETE_QUESTION',
      `Deleted question by "${deleted.user?.name || 'Customer'}" on product "${deleted.product?.name || 'Product'}".`
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Admin QnAs DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
