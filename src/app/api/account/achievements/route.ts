import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';

const ACCESS_TOKEN_SECRET = process.env.NEXTAUTH_SECRET || 'beautyglowry-auth-secret-key-123456';

function getUserFromRequest(request: NextRequest): { id: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const decoded: any = jwt.verify(authHeader.substring(7), ACCESS_TOKEN_SECRET);
    return { id: decoded.id };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const auth = getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const [orders, reviews, skinProfiles] = await Promise.all([
      prisma.order.findMany({ where: { user_id: auth.id } }),
      prisma.productReview.findMany({ where: { user_id: auth.id } }),
      prisma.userSkinProfile.findMany({ where: { user_id: auth.id } }),
    ]);

    const orderCount = orders.length;
    const totalSpent = orders.reduce((sum: number, o: any) => sum + Number(o.total), 0);
    const reviewCount = reviews.length;
    const hasQuiz = skinProfiles.length > 0;

    const badges = [];

    if (orderCount >= 1) {
      badges.push({
        id: 'first_purchase',
        title: 'First Purchase',
        description: 'You placed your first order!',
        icon: '🥇',
        color: '#F59E0B',
        unlocked: true,
        date: orders[orders.length - 1]?.created_at?.toISOString() || '',
      });
    } else {
      badges.push({
        id: 'first_purchase',
        title: 'First Purchase',
        description: 'Place your first order to unlock.',
        icon: '🥇',
        color: '#9CA3AF',
        unlocked: false,
        date: '',
      });
    }

    if (orderCount >= 3) {
      badges.push({
        id: 'loyal_glowist',
        title: 'Loyal Glowist',
        description: '3+ orders placed. You\'re a true Glowist!',
        icon: '🔥',
        color: '#EF4444',
        unlocked: true,
        date: '',
      });
    } else {
      badges.push({
        id: 'loyal_glowist',
        title: 'Loyal Glowist',
        description: `Place ${3 - orderCount} more order${3 - orderCount !== 1 ? 's' : ''} to unlock.`,
        icon: '🔥',
        color: '#9CA3AF',
        unlocked: false,
        date: '',
      });
    }

    if (orderCount >= 5 || totalSpent >= 5000) {
      badges.push({
        id: 'vip_member',
        title: 'VIP Member',
        description: '5+ orders or ৳5,000+ spent. Welcome to VIP!',
        icon: '💎',
        color: '#8B5CF6',
        unlocked: true,
        date: '',
      });
    } else {
      const ordersNeeded = Math.max(0, 5 - orderCount);
      const spentNeeded = Math.max(0, 5000 - totalSpent);
      badges.push({
        id: 'vip_member',
        title: 'VIP Member',
        description: `${ordersNeeded > 0 ? `${ordersNeeded} more orders` : `৳${Math.round(spentNeeded)} more spent`} to unlock.`,
        icon: '💎',
        color: '#9CA3AF',
        unlocked: false,
        date: '',
      });
    }

    if (hasQuiz) {
      badges.push({
        id: 'skin_expert',
        title: 'Skin Expert',
        description: 'Skin quiz completed. We know your skin!',
        icon: '🌿',
        color: '#10B981',
        unlocked: true,
        date: skinProfiles[0]?.created_at?.toISOString() || '',
      });
    } else {
      badges.push({
        id: 'skin_expert',
        title: 'Skin Expert',
        description: 'Complete the Skin Quiz to unlock.',
        icon: '🌿',
        color: '#9CA3AF',
        unlocked: false,
        date: '',
      });
    }

    if (reviewCount >= 2) {
      badges.push({
        id: 'review_champion',
        title: 'Review Champion',
        description: '2+ reviews written. The community thanks you!',
        icon: '⭐',
        color: '#F59E0B',
        unlocked: true,
        date: '',
      });
    } else {
      badges.push({
        id: 'review_champion',
        title: 'Review Champion',
        description: `Write ${2 - reviewCount} more review${2 - reviewCount !== 1 ? 's' : ''} to unlock.`,
        icon: '⭐',
        color: '#9CA3AF',
        unlocked: false,
        date: '',
      });
    }

    return NextResponse.json({
      stats: { orderCount, totalSpent, reviewCount, hasQuiz },
      badges,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
