import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redis } from './redis';

const ACCESS_TOKEN_SECRET = process.env.NEXTAUTH_SECRET || 'beautyglowry-auth-secret-key-123456';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'beautyglowry-refresh-secret-key-abcdef';

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ id: payload.id }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
}

export async function setRefreshTokenCookie(refreshToken: string) {
  const cookieStore = await cookies();
  cookieStore.set('bg_refresh_token', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    path: '/',
  });
}

export async function clearRefreshTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('bg_refresh_token');
}

export async function storeRefreshTokenInRedis(userId: string, token: string) {
  // Store in Redis with 7-day TTL
  await redis.set(`refreshToken:${userId}:${token}`, '1', 'EX', 7 * 24 * 60 * 60);
}

export async function verifyRefreshTokenInRedis(userId: string, token: string): Promise<boolean> {
  const exists = await redis.get(`refreshToken:${userId}:${token}`);
  return exists === '1';
}

export async function revokeRefreshTokenInRedis(userId: string, token: string) {
  await redis.del(`refreshToken:${userId}:${token}`);
}

export async function verifyAdminOrModerator(request: Request, requiredPermission?: string): Promise<TokenPayload | null> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  try {
    const decoded: any = jwt.verify(token, ACCESS_TOKEN_SECRET);
    
    // If the role is super admin, they have all permissions
    if (decoded.role === 'admin') {
      return decoded as TokenPayload;
    }
    
    // If it's a moderator, verify permissions
    if (decoded.role === 'moderator') {
      if (requiredPermission) {
        const { prisma } = require('./prisma');
        const mod = await prisma.moderator.findUnique({
          where: { email: decoded.email },
        });
        if (!mod || mod.status !== 'Active' || !mod.permissions.includes(requiredPermission)) {
          return null;
        }
      }
      return decoded as TokenPayload;
    }

    return null;
  } catch (e) {
    return null;
  }
}

export async function verifyAdminOrModeratorV2(request: Request, requiredPermission?: string): Promise<{ payload?: TokenPayload; status: 200 | 401 | 403 }> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { status: 401 };
  }
  const token = authHeader.substring(7);
  try {
    const decoded: any = jwt.verify(token, ACCESS_TOKEN_SECRET);
    
    // If the role is super admin, they have all permissions
    if (decoded.role === 'admin') {
      return { payload: decoded as TokenPayload, status: 200 };
    }
    
    // If it's a moderator, verify permissions
    if (decoded.role === 'moderator') {
      if (requiredPermission) {
        const { prisma } = require('./prisma');
        const mod = await prisma.moderator.findUnique({
          where: { email: decoded.email },
        });
        if (!mod || mod.status !== 'Active') {
          return { status: 403 };
        }
        if (!mod.permissions.includes(requiredPermission)) {
          return { status: 403 };
        }
      }
      return { payload: decoded as TokenPayload, status: 200 };
    }

    return { status: 403 };
  } catch (e) {
    return { status: 401 };
  }
}
