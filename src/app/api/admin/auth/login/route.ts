import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { generateAccessToken, generateRefreshToken, storeRefreshTokenInRedis, setRefreshTokenCookie } from '../../../../../lib/auth';
import { redis } from '../../../../../lib/redis';
import { handleSendOtpJob } from '../../../../../lib/jobs';

const ADMIN_USERNAME = 'beautyglowry@tamim.com';
const ADMIN_PASSWORD = 'TAMIM01905276822';
const ADMIN_2FA_RECIPIENT = 'rjtamim154@gmail.com';

export async function POST(request: Request) {
  try {
    const { email, password, loginType, twoFactorCode } = await request.json();

    if (loginType === 'admin') {
      if (email !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
        return NextResponse.json({ error: 'Incorrect administrator username or password' }, { status: 401 });
      }

      // If credentials are correct, check for 2FA code
      if (!twoFactorCode) {
        // Generate random 6-digit 2FA code
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        // Store in Redis with 5 minutes expiry
        await redis.set(`admin-2fa:${ADMIN_USERNAME}`, code, 'EX', 300);

        // Send code to the real email rjtamim154@gmail.com
        await handleSendOtpJob(ADMIN_2FA_RECIPIENT, code);

        return NextResponse.json({
          success: true,
          twoFactorRequired: true,
          recipient: ADMIN_2FA_RECIPIENT,
        });
      }

      // Validate the 2FA code
      const savedCode = await redis.get(`admin-2fa:${ADMIN_USERNAME}`);
      if (!savedCode || savedCode !== twoFactorCode) {
        return NextResponse.json({ error: 'Invalid or expired 2FA verification code' }, { status: 401 });
      }

      // 2FA Success! Clear the stored code
      await redis.del(`admin-2fa:${ADMIN_USERNAME}`);

      const session = {
        role: 'admin',
        email: ADMIN_USERNAME,
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
