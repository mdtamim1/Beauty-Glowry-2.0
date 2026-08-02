import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';

const ACCESS_TOKEN_SECRET = process.env.NEXTAUTH_SECRET || 'beautyglowry-auth-secret-key-123456';

function getUserFromRequest(request: NextRequest): { id: string; email: string } | null {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  try {
    const decoded: any = jwt.verify(authHeader.substring(7), ACCESS_TOKEN_SECRET);
    return { id: decoded.id, email: decoded.email };
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const auth = getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      select: { id: true, name: true, email: true, phone: true, avatar: true, skin_type: true, created_at: true, role: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = getUserFromRequest(request);
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    // Only allow safe fields — email and phone are immutable
    const allowed: Record<string, any> = {};
    if (body.name !== undefined) allowed.name = String(body.name).trim();
    if (body.avatar !== undefined) allowed.avatar = body.avatar ? String(body.avatar).trim() : null;
    if (body.skin_type !== undefined) allowed.skin_type = body.skin_type;

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: auth.id },
      data: allowed,
      select: { id: true, name: true, email: true, phone: true, avatar: true, skin_type: true, created_at: true, role: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
