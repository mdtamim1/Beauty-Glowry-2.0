import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    let invitations = await prisma.invitation.findMany({
      orderBy: { created_at: 'desc' },
    });

    // Auto-seed default invitation if none exist
    if (invitations.length === 0) {
      const email = 'nabil@beautyglowry.com';
      const permissions = ['Dashboard', 'Orders'];
      const token = btoa(JSON.stringify({ email, permissions }));
      
      const seeded = await prisma.invitation.create({
        data: {
          email,
          token,
          permissions,
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      });
      invitations = [seeded];
    }

    return NextResponse.json(invitations);
  } catch (error: any) {
    console.error('[API Team Invitations GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { email, token, permissions } = data;

    if (!email || !token || !permissions) {
      return NextResponse.json({ error: 'Missing invitation parameters' }, { status: 400 });
    }

    // Upsert or check uniqueness
    const exists = await prisma.invitation.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (exists) {
      // Re-create / overwrite invitation
      await prisma.invitation.delete({ where: { id: exists.id } });
    }

    const created = await prisma.invitation.create({
      data: {
        email: email.toLowerCase().trim(),
        token,
        permissions,
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error('[API Team Invitations POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const email = searchParams.get('email');

    if (id) {
      await prisma.invitation.delete({
        where: { id },
      });
    } else if (email) {
      await prisma.invitation.delete({
        where: { email: email.toLowerCase().trim() },
      });
    } else {
      return NextResponse.json({ error: 'Missing invitation id or email' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[API Team Invitations DELETE Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
