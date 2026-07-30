import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '../../../../../lib/prisma';

// Temporary server-side storage for OTPs
if (!(global as any).otpStore) {
  (global as any).otpStore = new Map<string, { code: string; expires: number }>();
}
const otpStore = (global as any).otpStore;

export async function POST(request: Request) {
  try {
    const { email, isSignUp } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Check if account already exists on Sign Up, or doesn't exist on Sign In
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (isSignUp && existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in instead.' },
        { status: 400 }
      );
    }

    if (!isSignUp && !existingUser) {
      return NextResponse.json(
        { error: 'No account found with this email. Please sign up first.' },
        { status: 400 }
      );
    }

    // Generate random 6-digit OTP code
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP code with 5 minutes expiration
    otpStore.set(email, {
      code: otpCode,
      expires: Date.now() + 5 * 60 * 1000,
    });

    const apiKey = (process.env.RESEND_API_KEY || '').trim();

    if (apiKey && apiKey !== 'your_resend_api_key_here') {
      const emailFrom = (process.env.EMAIL_FROM || 'onboarding@resend.dev').trim();
      console.log(`\x1b[35m[Beauty Glowry Auth] Sending real email to ${email} with OTP: ${otpCode} (From: ${emailFrom})\x1b[0m`);
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
        console.error('Resend API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, emailSent: true });
    } else {
      // Print in server console for easy debugging/testing
      console.log(`\x1b[36m[Beauty Glowry Dev Auth] Simulated OTP sent to ${email}: ${otpCode}\x1b[0m`);
      return NextResponse.json({
        success: true,
        emailSent: false,
        simulatedCode: otpCode, // Send back for UI to display and test instantly
      });
    }
  } catch (error: any) {
    console.error('OTP Send Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
