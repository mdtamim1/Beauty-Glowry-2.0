import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { redis } from '../../../../../lib/redis';
import { handleSendOtpJob } from '../../../../../lib/jobs';

export async function POST(request: Request) {
  try {
    const { email, isSignUp } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get client IP address
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
               request.headers.get('x-real-ip') || 
               'unknown-ip';

    const normalizedEmail = email.toLowerCase().trim();
    const emailLimitKey = `ratelimit:otp:email:${normalizedEmail}`;
    const ipLimitKey = `ratelimit:otp:ip:${ip}`;

    // 1. Rate Limit by Email: Max 1 request per 60 seconds
    const isEmailLimited = await redis.get(emailLimitKey);
    if (isEmailLimited) {
      return NextResponse.json(
        { error: 'Please wait 60 seconds before requesting another OTP.' },
        { status: 429 }
      );
    }

    // 2. Rate Limit by IP: Max 3 requests per 60 seconds to prevent distributed bot spamming
    if (ip !== 'unknown-ip') {
      const ipRequestCount = await redis.get(ipLimitKey);
      if (ipRequestCount && parseInt(ipRequestCount, 10) >= 3) {
        return NextResponse.json(
          { error: 'Too many requests from this IP. Please try again in 60 seconds.' },
          { status: 429 }
        );
      }
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

    // Store OTP code with 5 minutes expiration in Redis
    await redis.set(`otp:${email}`, otpCode, 'EX', 300);

    // Set rate limit state in Redis for email (60s)
    await redis.set(emailLimitKey, '1', 'EX', 60);

    // Increment and set expiry for IP rate limit state (60s)
    if (ip !== 'unknown-ip') {
      const ipCountStr = await redis.get(ipLimitKey);
      const ipCount = ipCountStr ? parseInt(ipCountStr, 10) : 0;
      await redis.set(ipLimitKey, (ipCount + 1).toString(), 'EX', 60);
    }

    // Send the OTP email directly (synchronously) to ensure reliability on serverless platforms
    await handleSendOtpJob(email, otpCode);

    const apiKey = (process.env.RESEND_API_KEY || '').trim();
    const hasRealApiKey = apiKey && apiKey !== 'your_resend_api_key_here';

    return NextResponse.json({
      success: true,
      emailSent: hasRealApiKey,
      simulatedCode: hasRealApiKey ? undefined : otpCode, // Send back for UI to display instantly in dev mode
    });
  } catch (error: any) {
    console.error('OTP Send Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
