import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    let notifications = await prisma.notification.findMany({
      where: { user_id: null },
      orderBy: { created_at: 'desc' },
    });

    // Auto-seed default notification alerts if empty
    if (notifications.length === 0) {
      await prisma.notification.createMany({
        data: [
          {
            user_id: null,
            title: 'Welcome to Console Centre',
            message: 'Live database synchronization is now active for notifications, team members, and coupons.',
            is_read: false,
          },
          {
            user_id: null,
            title: 'System Alert: Connected',
            message: 'Successfully established link to local PostgreSQL database beautyglowry_db.',
            is_read: true,
          }
        ],
      });
      notifications = await prisma.notification.findMany({
        where: { user_id: null },
        orderBy: { created_at: 'desc' },
      });
    }

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error('[API Admin Notifications GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const { id, is_read } = data;

    if (!id) {
      return NextResponse.json({ error: 'Missing notification id' }, { status: 400 });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        is_read: is_read !== undefined ? is_read : true,
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[API Admin Notifications PUT Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll) {
      await prisma.notification.deleteMany({
        where: { user_id: null },
      });
    } else if (id) {
      await prisma.notification.delete({
        where: { id },
      });
    } else {
      return NextResponse.json({ error: 'Missing notification id or clearAll flag' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Admin Notifications DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
