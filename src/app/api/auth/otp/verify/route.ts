import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Temporary server-side storage for OTPs
if (!(global as any).otpStore) {
  (global as any).otpStore = new Map<string, { code: string; expires: number }>();
}
const otpStore = (global as any).otpStore;

export async function POST(request: Request) {
  try {
    const { email, code, isSignUp, name, phone, password } = await request.json();

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

    let user;

    if (isSignUp) {
      // 1. Sign Up Flow:
      // Double check if account exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
      }

      // Hash password using bcryptjs
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create new user in database
      user = await prisma.user.create({
        data: {
          name,
          email,
          phone,
          password_hash: passwordHash,
          role: 'customer', // default role
        },
      });
    } else {
      // 2. Sign In Flow:
      // Retrieve user from database
      user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json({ error: 'No account found with this email. Please sign up.' }, { status: 400 });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        // Fallback for guest accounts where password might be stored in plain text
        const isPlainMatch = password === user.password_hash;
        if (!isPlainMatch) {
          return NextResponse.json({ error: 'Incorrect password. Please try again.' }, { status: 400 });
        }
      }
    }

    // 3. Generate JWT Token
    const tokenSecret = process.env.NEXTAUTH_SECRET || 'beautyglowry-auth-secret-key-123456';
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tokenSecret,
      { expiresIn: '7d' }
    );

    // 4. Return user profile and token
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || undefined,
      role: user.role,
      avatar: user.avatar || undefined,
      skin_type: user.skin_type || undefined,
      created_at: user.created_at.toISOString(),
    };

    return NextResponse.json({
      success: true,
      user: userProfile,
      token,
    });
  } catch (error: any) {
    console.error('OTP Verify Route Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
