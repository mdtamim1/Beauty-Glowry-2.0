import { headers } from 'next/headers';
import { prisma } from './prisma';

export async function logAdminAction(action: string, details: string) {
  try {
    const headersList = await headers();
    const email = headersList.get('x-moderator-email') || 'admin@beautyglowry.com';
    const name = headersList.get('x-moderator-name') || 'Super Admin';

    await prisma.auditLog.create({
      data: {
        moderator_email: email,
        moderator_name: name,
        action,
        details,
      },
    });
  } catch (error) {
    console.error('[Audit Log Creation Error]:', error);
  }
}
