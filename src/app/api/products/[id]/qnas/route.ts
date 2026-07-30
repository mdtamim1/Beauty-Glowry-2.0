import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import jwt from 'jsonwebtoken';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { question, userId } = data;

    if (!question || !question.trim()) {
      return NextResponse.json({ error: 'Question content is required' }, { status: 400 });
    }

    // Try to resolve userId from headers
    let finalUserId = userId;
    if (!finalUserId) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const tokenSecret = process.env.NEXTAUTH_SECRET || 'beautyglowry-auth-secret-key-123456';
        try {
          const decoded: any = jwt.verify(token, tokenSecret);
          finalUserId = decoded.id;
        } catch (e) {
          // Token expired or invalid
        }
      }
    }

    if (!finalUserId) {
      return NextResponse.json({ error: 'You must be logged in to ask a question' }, { status: 401 });
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({ where: { id: finalUserId } });
    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 400 });
    }

    // Create QnA in database
    const qna = await prisma.productQnA.create({
      data: {
        product_id: id,
        user_id: finalUserId,
        question: question.trim(),
      },
      include: {
        user: true,
      },
    });

    const formattedQna = {
      id: qna.id,
      question: qna.question,
      answer: qna.answer || null,
      askedBy: qna.user.name,
      date: qna.created_at.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
    };

    return NextResponse.json({ success: true, qna: formattedQna });
  } catch (error: any) {
    console.error('API Product QnA POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
