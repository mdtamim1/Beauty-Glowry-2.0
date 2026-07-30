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
    const { rating, comment, userId } = data;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Valid rating (1-5) is required' }, { status: 400 });
    }

    // Try to get userId from token if not explicitly provided
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
      return NextResponse.json({ error: 'You must be logged in to submit a review' }, { status: 401 });
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({ where: { id: finalUserId } });
    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 400 });
    }

    // Create review in database
    const review = await prisma.productReview.create({
      data: {
        product_id: id,
        user_id: finalUserId,
        rating: Number(rating),
        comment: comment || '',
        verified_purchase: false,
      },
      include: {
        user: true,
      },
    });

    const formattedReview = {
      id: review.id,
      name: review.user.name,
      rating: review.rating,
      text: review.comment || '',
      date: review.created_at.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      verified: review.verified_purchase,
    };

    return NextResponse.json({ success: true, review: formattedReview });
  } catch (error: any) {
    console.error('API Product Review POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
