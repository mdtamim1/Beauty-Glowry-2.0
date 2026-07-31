import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';

export async function GET() {
  try {
    let logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
    });

    // Auto-seed default audit logs if empty
    if (logs.length === 0) {
      const seeded = [
        {
          moderator_email: 'sarah@beautyglowry.com',
          moderator_name: 'Sarah Ahmed',
          action: 'Order status changed',
          details: 'Changed status of order #BG-1082 to "Shipped"',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        },
        {
          moderator_email: 'sarah@beautyglowry.com',
          moderator_name: 'Sarah Ahmed',
          action: 'Order status changed',
          details: 'Changed status of order #BG-1085 to "Processing"',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        },
        {
          moderator_email: 'rashed@beautyglowry.com',
          moderator_name: 'Rashed Khan',
          action: 'Product variant updated',
          details: 'Updated variants on product "Niacinamide 10% Clarifying Serum"',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        },
        {
          moderator_email: 'rashed@beautyglowry.com',
          moderator_name: 'Rashed Khan',
          action: 'Product created',
          details: 'Added new product "Salicylic Acid 2% Clarifying Gel"',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        },
        {
          moderator_email: 'sarah@beautyglowry.com',
          moderator_name: 'Sarah Ahmed',
          action: 'Review replied',
          details: 'Replied to product review on "Hyaluronic Acid Hydration Gel"',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        }
      ];

      for (const log of seeded) {
        await prisma.auditLog.create({ data: log });
      }

      logs = await prisma.auditLog.findMany({
        orderBy: { timestamp: 'desc' },
      });
    }

    // Format logs to camelCase to match client code interfaces (moderatorEmail, moderatorName)
    const formatted = logs.map((l) => ({
      id: l.id,
      moderatorEmail: l.moderator_email,
      moderatorName: l.moderator_name,
      action: l.action,
      details: l.details,
      timestamp: l.timestamp.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error('[API Team Logs GET Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { moderatorEmail, moderatorName, action, details } = data;

    if (!moderatorEmail || !moderatorName || !action || !details) {
      return NextResponse.json({ error: 'Missing log params' }, { status: 400 });
    }

    const created = await prisma.auditLog.create({
      data: {
        moderator_email: moderatorEmail,
        moderator_name: moderatorName,
        action,
        details,
      },
    });

    return NextResponse.json(created);
  } catch (error: any) {
    console.error('[API Team Logs POST Error]:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
