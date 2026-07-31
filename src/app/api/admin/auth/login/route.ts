import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { generateAccessToken, generateRefreshToken, storeRefreshTokenInRedis, setRefreshTokenCookie } from '../../../../../lib/auth';

const ADMIN_PASSWORD = 'admin123';

export async function POST(request: Request) {
  try {
    const { email, password, loginType } = await request.json();

    if (loginType === 'admin') {
      if (password === ADMIN_PASSWORD) {
        const session = {
          role: 'admin',
          email: 'admin@beautyglowry.com',
          name: 'Super Admin',
          permissions: ['Dashboard', 'Products', 'Orders', 'Customers', 'Reviews', 'Marketing', 'Settings'],
        };
        // Generate Token pair
        const payload = {
          id: 'admin',
          email: session.email,
          name: session.name,
          role: session.role,
        };
        const token = generateAccessToken(payload);
        const refreshToken = generateRefreshToken(payload);

        // Store refresh token and write cookie
        await storeRefreshTokenInRedis('admin', refreshToken);
        await setRefreshTokenCookie(refreshToken);

        return NextResponse.json({ success: true, token, session });
      } else {
        return NextResponse.json({ error: 'Incorrect administrator password' }, { status: 401 });
      }
    } else if (loginType === 'moderator') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
      }

      const moderator = await prisma.moderator.findUnique({
        where: { email: email.toLowerCase().trim() },
      });

      if (!moderator) {
        return NextResponse.json({ error: 'Moderator account not found' }, { status: 404 });
      }

      if (moderator.status === 'Inactive') {
        return NextResponse.json({ error: 'This moderator account is deactivated' }, { status: 403 });
      }

      if (moderator.password !== password) {
        return NextResponse.json({ error: 'Incorrect moderator password' }, { status: 401 });
      }

      const session = {
        role: 'moderator',
        email: moderator.email,
        name: moderator.name,
        permissions: moderator.permissions,
      };

      const payload = {
        id: moderator.id,
        email: moderator.email,
        name: moderator.name,
        role: session.role,
      };

      const token = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      // Store refresh token and write cookie
      await storeRefreshTokenInRedis(moderator.id, refreshToken);
      await setRefreshTokenCookie(refreshToken);

      return NextResponse.json({ success: true, token, session });
    } else {
      return NextResponse.json({ error: 'Invalid login type' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Admin Auth Login Route Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
