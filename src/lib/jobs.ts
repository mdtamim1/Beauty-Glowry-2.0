import { Resend } from 'resend';
import { prisma } from './prisma';

export async function handleSendOtpJob(email: string, otpCode: string) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();

  if (apiKey && apiKey !== 'your_resend_api_key_here') {
    const emailFrom = (process.env.EMAIL_FROM || 'onboarding@resend.dev').trim();
    console.log(`\x1b[35m[Queue Job] Sending real email to ${email} with OTP: ${otpCode} (From: ${emailFrom})\x1b[0m`);
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: emailFrom === 'onboarding@resend.dev' ? 'onboarding@resend.dev' : `Beauty Glowry <${emailFrom}>`,
      to: email,
      subject: `${otpCode} is your Beauty Glowry verification code`,
      html: `
        <div style="font-family: 'DM Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #FAF7F2; border: 1px solid #E2DAD0; border-radius: 12px; color: #1A1A18;">
          <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: 500; margin-bottom: 16px; color: #1A1A18;">Beauty Glowry</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #5A5550; margin-bottom: 24px;">
            Thank you for verifying your skincare account. Use the verification code below to authenticate:
          </p>
          <div style="background: #FFFFFF; border: 1px solid #E2DAD0; border-radius: 8px; padding: 16px; text-align: center; font-size: 32px; font-weight: 700; letter-spacing: 0.15em; color: #C9956D; margin-bottom: 24px; font-family: monospace;">
            ${otpCode}
          </div>
          <p style="font-size: 11px; color: #9A9088; line-height: 1.4;">
            This code will expire in 5 minutes. If you did not request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      throw new Error(`Resend email send failed: ${error.message}`);
    }
  } else {
    console.log(`\x1b[36m[Queue Job Dev] Simulated OTP email to ${email}: ${otpCode}\x1b[0m`);
  }
}

export async function handleSendOrderConfirmationJob(email: string, orderNumber: string, total: string) {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();

  if (apiKey && apiKey !== 'your_resend_api_key_here') {
    const emailFrom = (process.env.EMAIL_FROM || 'onboarding@resend.dev').trim();
    console.log(`\x1b[35m[Queue Job] Sending order confirmation email to ${email} for order: ${orderNumber}\x1b[0m`);
    const resend = new Resend(apiKey);

    const { error } = await resend.emails.send({
      from: emailFrom === 'onboarding@resend.dev' ? 'onboarding@resend.dev' : `Beauty Glowry <${emailFrom}>`,
      to: email,
      subject: `Order Confirmation - #${orderNumber}`,
      html: `
        <div style="font-family: 'DM Sans', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #FAF7F2; border: 1px solid #E2DAD0; border-radius: 12px; color: #1A1A18;">
          <h2 style="font-family: Georgia, serif; font-size: 24px; font-weight: 500; margin-bottom: 16px; color: #1A1A18;">Beauty Glowry</h2>
          <h3 style="font-size: 18px; font-weight: 600; color: #C9956D; margin-bottom: 12px;">Order Confirmed!</h3>
          <p style="font-size: 14px; line-height: 1.6; color: #5A5550; margin-bottom: 16px;">
            Thank you for shopping with us! Your order <strong>#${orderNumber}</strong> has been successfully placed.
          </p>
          <div style="background: #FFFFFF; border: 1px solid #E2DAD0; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-size: 14px; color: #1A1A18;">
            <p style="margin: 0 0 8px 0;"><strong>Order Number:</strong> #${orderNumber}</p>
            <p style="margin: 0;"><strong>Total Amount:</strong> ৳${total}</p>
          </div>
          <p style="font-size: 11px; color: #9A9088; line-height: 1.4;">
            You will receive another update when your order is processed and shipped.
          </p>
        </div>
      `,
    });

    if (error) {
      throw new Error(`Resend email send failed: ${error.message}`);
    }
  } else {
    console.log(`\x1b[36m[Queue Job Dev] Simulated Order Confirmation email to ${email} for #${orderNumber} (Total: ৳${total})\x1b[0m`);
  }
}

export async function handleSyncOrdersJob() {
  console.log('⏰ Starting automated background order sync job...');
  try {
    const unsyncedOrders = await prisma.order.findMany({
      where: { status: 'pending_sync' },
      orderBy: { created_at: 'asc' },
    });

    if (unsyncedOrders.length === 0) {
      console.log('No unsynced orders found. Automated sync complete.');
      return;
    }

    const activeMods = await prisma.moderator.findMany({
      where: { status: 'Active' },
    });

    const activeModerators = activeMods.map(m => m.email);

    let modIndex = 0;
    for (const order of unsyncedOrders) {
      let assignee = 'admin';
      
      if (activeModerators && activeModerators.length > 0) {
        assignee = activeModerators[modIndex];
        modIndex = (modIndex + 1) % activeModerators.length;
      }

      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'processing',
          assigned_to: assignee,
        },
      });

      await prisma.orderStatusHistory.create({
        data: {
          order_id: order.id,
          status: 'Processing',
          note: `Automatically synchronized by system scheduler and assigned to ${assignee === 'admin' ? 'Super Admin' : assignee}`,
        },
      });

      console.log(`Synced order #${order.order_number} and assigned to ${assignee}`);
    }
    console.log(`✅ Automated background sync complete. Synced ${unsyncedOrders.length} order(s).`);
  } catch (error) {
    console.error('Error during automated background order sync:', error);
  }
}
