import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { redis } from '../../../../../lib/redis';
import {
  generateAccessToken,
  generateRefreshToken,
  setRefreshTokenCookie,
  storeRefreshTokenInRedis
} from '../../../../../lib/auth';

export async function POST(request: Request) {
  try {
    const { email, code, isSignUp, name, phone, password } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: 'Email and verification code are required' }, { status: 400 });
    }

    const savedCode = await redis.get(`otp:${email}`);

    if (!savedCode) {
      return NextResponse.json({ error: 'No verification request found for this email, or the code has expired. Please request a new one.' }, { status: 400 });
    }

    if (savedCode !== code) {
      return NextResponse.json({ error: 'Invalid verification code. Please check and try again.' }, { status: 400 });
    }

    // Success - delete OTP after use
    await redis.del(`otp:${email}`);

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

    // 3. Generate Access Token & Refresh Token pair
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store Refresh Token in Redis and set as cookie
    await storeRefreshTokenInRedis(user.id, refreshToken);
    await setRefreshTokenCookie(refreshToken);

    // 4. Return user profile and token
    const userProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || undefined,
      role: user.role,
      avatar: user.avatar || undefined,
      skin_type: user.skin_type || undefined,
      allergies: user.allergies || undefined,
      current_routine: user.current_routine || undefined,
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
