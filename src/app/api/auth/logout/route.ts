import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { clearRefreshTokenCookie, revokeRefreshTokenInRedis } from '../../../../lib/auth';

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'beautyglowry-refresh-secret-key-abcdef';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('bg_refresh_token')?.value;

    if (refreshToken) {
      try {
        const decoded: any = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);
        await revokeRefreshTokenInRedis(decoded.id, refreshToken);
      } catch (e) {
        // Token might already be expired or invalid, proceed to clear cookie anyway
      }
    }

    await clearRefreshTokenCookie();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Logout API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
