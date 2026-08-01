import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { verifyAdminOrModerator } from '../../../../lib/auth';

export async function GET(request: Request) {
  try {
    const admin = await verifyAdminOrModerator(request);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    let moderators = await prisma.moderator.findMany({
      orderBy: { created_at: 'asc' },
    });

    // Auto-seed default moderators if database table is empty
    if (moderators.length === 0) {
      const seeded = [
        {
          name: 'Sarah Ahmed',
          email: 'sarah@beautyglowry.com',
          password: 'moderator123',
          status: 'Active',
          permissions: ['Dashboard', 'Orders', 'Reviews'],
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        {
          name: 'Rashed Khan',
          email: 'rashed@beautyglowry.com',
          password: 'password123',
          status: 'Active',
          permissions: ['Dashboard', 'Products', 'Marketing'],
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        },
        {
          name: 'Tania Sultana',
          email: 'tania@beautyglowry.com',
          password: 'tania1234',
          status: 'Inactive',
          permissions: ['Dashboard', 'Orders', 'Customers'],
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        }
      ];

      for (const mod of seeded) {
        await prisma.moderator.create({ data: mod });
      }

      moderators = await prisma.moderator.findMany({
        orderBy: { created_at: 'asc' },
      });
    }

    const sanitized = moderators.map((m) => {
      const { password, ...rest } = m;
      return rest;
    });

    return NextResponse.json(sanitized);
  } catch (error: any) {
    console.error('[API Team Moderators GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await verifyAdminOrModerator(request);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const { name, email, password, permissions } = data;

    if (!name || !email || !password || !permissions) {
      return NextResponse.json({ error: 'Missing registration details' }, { status: 400 });
    }

    const exists = await prisma.moderator.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (exists) {
      return NextResponse.json({ error: 'Email is already registered' }, { status: 400 });
    }

    const created = await prisma.moderator.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password,
        status: 'Active',
        permissions,
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error('[API Team Moderators POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await verifyAdminOrModerator(request);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = await request.json();
    const { id, status, permissions } = data;

    if (!id) {
      return NextResponse.json({ error: 'Missing moderator id' }, { status: 400 });
    }

    const updateData: any = {};
    if (status !== undefined) updateData.status = status;
    if (permissions !== undefined) updateData.permissions = permissions;

    const updated = await prisma.moderator.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[API Team Moderators PUT Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await verifyAdminOrModerator(request);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing moderator id' }, { status: 400 });
    }

    await prisma.moderator.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Team Moderators DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
