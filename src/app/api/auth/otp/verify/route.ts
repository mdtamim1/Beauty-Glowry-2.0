import { NextResponse } from 'next/server';

// Temporary server-side storage for OTPs
if (!(global as any).otpStore) {
  (global as any).otpStore = new Map<string, { code: string; expires: number }>();
}
const otpStore = (global as any).otpStore;

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 });
    }

    const record = otpStore.get(email);

    if (!record) {
      return NextResponse.json({ error: 'No verification request found for this email' }, { status: 400 });
    }

    if (Date.now() > record.expires) {
      otpStore.delete(email);
      return NextResponse.json({ error: 'Verification code has expired. Please request a new one.' }, { status: 400 });
    }

    if (record.code !== code) {
      return NextResponse.json({ error: 'Invalid verification code. Please check and try again.' }, { status: 400 });
    }

    // Success - delete OTP after use
    otpStore.delete(email);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('OTP Verify Route Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
