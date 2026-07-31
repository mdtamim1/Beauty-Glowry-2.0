import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../../lib/prisma';
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  storeRefreshTokenInRedis,
  verifyRefreshTokenInRedis,
  revokeRefreshTokenInRedis
} from '../../../../../lib/auth';

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'beautyglowry-refresh-secret-key-abcdef';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const oldRefreshToken = cookieStore.get('bg_refresh_token')?.value;

    if (!oldRefreshToken) {
      return NextResponse.json({ error: 'Refresh token missing' }, { status: 401 });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(oldRefreshToken, REFRESH_TOKEN_SECRET);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid or expired refresh token' }, { status: 401 });
    }

    const userId = decoded.id;

    // Verify token exists in Redis
    const isValid = await verifyRefreshTokenInRedis(userId, oldRefreshToken);
    if (!isValid) {
      return NextResponse.json({ error: 'Revoked refresh token' }, { status: 401 });
    }

    // Fetch user from DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Generate new Access and Refresh tokens (Rotation)
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    // Revoke old refresh token, store new one in Redis
    await revokeRefreshTokenInRedis(userId, oldRefreshToken);
    await storeRefreshTokenInRedis(userId, newRefreshToken);

    // Update Cookie
    await setRefreshTokenCookie(newRefreshToken);

    return NextResponse.json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error: any) {
    console.error('Refresh Token API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
