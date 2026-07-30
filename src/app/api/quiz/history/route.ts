import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';

// Helper to authenticate user from token
async function getAuthenticatedUser() {
  const authHeader = (await headers()).get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.NEXTAUTH_SECRET || 'beautyglowry-auth-secret-key-123456'
    ) as any;
    return decoded.userId;
  } catch (e) {
    return null;
  }
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const history = await prisma.userSkinProfile.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ success: true, history });
  } catch (error: any) {
    console.error('Quiz History GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { skin_type, concern, routine_type, budget, answers_json } = data;

    if (!skin_type || !concern) {
      return NextResponse.json({ error: 'Skin type and concern are required' }, { status: 400 });
    }

    // Save history and update user skin_type in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      const profile = await tx.userSkinProfile.create({
        data: {
          user_id: userId,
          skin_type,
          concern,
          routine_type: routine_type || 'minimal',
          budget: budget || 'mid',
          answers_json: answers_json || '{}',
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { skin_type },
      });

      return profile;
    });

    return NextResponse.json({ success: true, profile: result });
  } catch (error: any) {
    console.error('Quiz History POST Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
