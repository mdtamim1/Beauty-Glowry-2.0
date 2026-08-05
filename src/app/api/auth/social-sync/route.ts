import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../[...nextauth]/route';
import { prisma } from '../../../../lib/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  storeRefreshTokenInRedis
} from '../../../../lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'No active session found' }, { status: 401 });
    }

    const { email, name, image } = session.user;

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Create user if they don't exist
      user = await prisma.user.create({
        data: {
          name: name || email.split('@')[0],
          email,
          avatar: image || undefined,
          password_hash: 'social-auth-placeholder', // placeholder for social users
          role: 'customer',
        },
      });
    } else if (image && !user.avatar) {
      // Update avatar if not present
      user = await prisma.user.update({
        where: { email },
        data: { avatar: image },
      });
    }

    // Generate custom tokens
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await storeRefreshTokenInRedis(user.id, refreshToken);
    await setRefreshTokenCookie(refreshToken);

    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || undefined,
      role: user.role,
      avatar: user.avatar || undefined,
      skin_type: user.skin_type || undefined,
      allergies: user.allergies || undefined,
      current_routine: user.current_routine || undefined,
      created_at: user.created_at.toISOString(),
    };

    return NextResponse.json({
      success: true,
      user: userProfile,
      token,
    });
  } catch (error: any) {
    console.error('Social Sync Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
