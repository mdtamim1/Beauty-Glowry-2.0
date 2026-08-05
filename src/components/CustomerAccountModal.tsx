'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle, Shield, ArrowLeft, RefreshCw } from 'lucide-react';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { useAuthStore } from '../store/useAuthStore';


interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomerAccountModal({ isOpen, onClose }: CustomerAccountModalProps) {
  const { user, login, logout } = useAuthStore();
  const [isSignUp, setIsSignUp] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [agree, setAgree] = useState(false);

  // OTP Verification States
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [generatedCode, setGeneratedCode] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // States for feedback
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Count down timer for Resend Code
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showOtp && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [showOtp, timer]);

  // Check for NextAuth redirect error params
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err) {
        setError(`Authentication failed: ${err}. Please verify that your Google/Facebook API credentials and NEXTAUTH_SECRET/NEXTAUTH_URL are correctly configured in your hosting environment variables.`);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'transparent', width: '0%' };
    if (pass.length < 6) return { score: 1, label: 'Weak', color: '#E05A5A', width: '33%' };
    const hasLetters = /[a-zA-Z]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pass);
    const complexCount = [hasLetters, hasNumbers, hasSpecial].filter(Boolean).length;

    if (pass.length >= 10 && complexCount >= 2) {
      return { score: 3, label: 'Secure', color: '#4CAF82', width: '100%' };
    }
    return { score: 2, label: 'Medium', color: '#F0A54B', width: '66%' };
  };

  const strength = getPasswordStrength(password);

  // Submit the sign up / sign in form -> API call
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp && !name) { setError('Please enter your name'); return; }
    if (!email) { setError('Email address is required'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email address'); return; }
    if (isSignUp && !phone) { setError('Phone number is required'); return; }
    if (!password) { setError('Password is required'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (isSignUp && !agree) { setError('Please agree to terms'); return; }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, isSignUp }),
      });
      const data = await response.json();

      setLoading(false);

      if (!response.ok) {
        setError(data.error || 'Failed to send verification code.');
        return;
      }

      setGeneratedCode(data.simulatedCode || 'REAL_EMAIL');
      setShowOtp(true);
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);

      if (data.simulatedCode) {
        alert(`[Simulated Gmail Verification Code sent to ${email}]: ${data.simulatedCode}\n\n(Please enter this code to complete verification)`);
      } else {
        alert(`A real verification code has been sent to ${email}. Please check your inbox/spam folder.`);
      }
    } catch (err) {
      setLoading(false);
      setError('Connection failed. Please check your network connection.');
    }
  };

  // Handle key change in OTP fields
  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, '');
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Focus next input
    if (index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace key in OTP fields
  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);

      // Focus previous input
      if (index > 0 && otpRefs.current[index - 1]) {
        otpRefs.current[index - 1]?.focus();
      }
    }
  };

  // Verify code -> API call
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const enteredCode = otp.join('');

    if (enteredCode.length < 6) {
      setError('Please enter the full 6-digit verification code');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: enteredCode,
          isSignUp,
          name,
          phone,
          password
        }),
      });
      const data = await response.json();

      setLoading(false);

      if (!response.ok) {
        setError(data.error || 'Invalid verification code.');
        return;
      }

      login(data.user, data.token);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowOtp(false);
        setName('');
        setEmail('');
        setPhone('');
        setPassword('');
        setAgree(false);
        onClose();
      }, 2000);
    } catch (err) {
      setLoading(false);
      setError('Connection failed. Please try again.');
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      setLoading(false);

      if (!response.ok) {
        setError(data.error || 'Failed to resend code.');
        return;
      }

      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setGeneratedCode(data.simulatedCode || 'REAL_EMAIL');

      if (data.simulatedCode) {
        alert(`[New Simulated Verification Code sent to ${email}]: ${data.simulatedCode}`);
      } else {
        alert(`A new verification code has been sent to ${email}.`);
      }
    } catch (err) {
      setLoading(false);
      setError('Connection failed. Please check your network connection.');
    }
  };

  const c = {
    bg: '#FFFFFF',
    elevated: '#FAF7F2',
    border: '#E2DAD0',
    text: '#1A1A18',
    textSec: '#5A5550',
    muted: '#9A9088',
    accent: '#C9956D', // Brand rose gold
    accentHover: '#B5814A',
    success: '#4CAF82',
    danger: '#E05A5A',
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="modal-backdrop-blur"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(26, 26, 24, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 999,
        }}
      />

      {/* Modal Container */}
      <div
        className="modal-window-premium"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: 400,
          background: c.bg,
          border: `1px solid ${c.border}`,
          borderRadius: 14,
          boxShadow: '0 24px 64px rgba(26,26,24,0.15), 0 2px 8px rgba(26,26,24,0.05)',
          zIndex: 1000,
          overflow: 'hidden',
          color: c.text,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Subtle accent top border line */}
        <div style={{ height: 3, width: '100%', background: c.accent }} />

        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'none',
            border: 'none',
            color: c.muted,
            cursor: 'pointer',
            padding: 4,
            borderRadius: '50%',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = c.text;
            e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = c.muted;
            e.currentTarget.style.background = 'none';
          }}
        >
          <X size={16} />
        </button>

        {user ? (
          /* Profile Card Screen */
          <div style={{ padding: '32px 28px 28px' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: `${c.accent}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px',
                border: `1px solid ${c.border}`,
                fontSize: 24,
                fontWeight: 700,
                color: c.accent,
                textTransform: 'uppercase',
              }}>
                {user.name.charAt(0)}
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 500, color: c.text, marginBottom: 4 }}>
                {user.name}
              </h2>
              <p style={{ fontSize: 11, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
                {user.role === 'admin' ? '⚜️ Admin Account' : 'Skincare Profile'}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, background: c.elevated, padding: 18, borderRadius: 10, border: `1px solid ${c.border}`, marginBottom: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Email Address</span>
                <span style={{ fontSize: 13, color: c.text, fontWeight: 500 }}>{user.email}</span>
              </div>
              
              {user.phone && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phone Number</span>
                  <span style={{ fontSize: 13, color: c.text, fontWeight: 500 }}>{user.phone}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: c.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Skin Profile</span>
                <span style={{ fontSize: 13, color: c.accent, fontWeight: 600 }}>
                  {user.skin_type ? `${user.skin_type.toUpperCase()} Skin` : 'Quiz not completed yet'}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: c.accent,
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    textAlign: 'center',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: `0 4px 12px ${c.accent}30`,
                    display: 'block',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = c.accentHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = c.accent)}
                >
                  ⚜️ Access Admin Console
                </Link>
              )}

              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'transparent',
                  color: c.danger,
                  border: `1px solid ${c.danger}40`,
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${c.danger}06`;
                  e.currentTarget.style.borderColor = c.danger;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = `${c.danger}40`;
                }}
              >
                Sign Out / Exit Dashboard
              </button>
            </div>
          </div>
        ) : success ? (
          /* Success Screen */
          <div style={{ padding: '48px 30px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: `${c.success}10`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: `1px solid ${c.success}30`,
            }}>
              <CheckCircle size={28} style={{ color: c.success }} />
            </div>
            <div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600, color: c.text, marginBottom: 6 }}>
                Verification Complete
              </h3>
              <p style={{ fontSize: 12.5, color: c.textSec, lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
                Your email has been verified. Welcome to your premium skincare dashboard.
              </p>
            </div>
          </div>
        ) : showOtp ? (
          /* OTP Screen */
          <div style={{ padding: '32px 28px 28px' }}>
            <button
              onClick={() => { setShowOtp(false); setError(''); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'none', border: 'none', fontSize: 11, fontWeight: 700,
                color: c.muted, cursor: 'pointer', padding: 0, textTransform: 'uppercase',
                letterSpacing: '0.05em', marginBottom: 16
              }}
              onMouseEnter={e => (e.currentTarget.style.color = c.text)}
              onMouseLeave={e => (e.currentTarget.style.color = c.muted)}
            >
              <ArrowLeft size={13} /> Back to Sign Up
            </button>

            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <Mail size={12} style={{ color: c.accent }} />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.accent }}>
                  Verification Code
                </span>
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 500, color: c.text, marginBottom: 4 }}>
                Verify Your Email
              </h2>
              <p style={{ fontSize: 12, color: c.textSec, lineHeight: 1.4 }}>
                We sent a 6-digit verification code to <strong style={{ color: c.text }}>{email}</strong>. Please enter it below.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '9px 12px',
                background: `${c.danger}08`,
                borderLeft: `3px solid ${c.danger}`,
                borderRadius: 4,
                fontSize: 11.5,
                color: c.danger,
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            {/* OTP Input Fields */}
            <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { otpRefs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target, index)}
                    onKeyDown={(e) => handleOtpKeyDown(e, index)}
                    style={{
                      width: 46,
                      height: 46,
                      background: c.elevated,
                      border: `1px solid ${c.border}`,
                      borderRadius: 8,
                      textAlign: 'center',
                      fontSize: 18,
                      fontWeight: 700,
                      color: c.text,
                      outline: 'none',
                      transition: 'all 0.2s ease',
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = c.accent;
                      e.target.style.background = '#FFFFFF';
                      e.target.style.boxShadow = '0 0 0 2px rgba(201, 149, 109, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = c.border;
                      e.target.style.background = c.elevated;
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                ))}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="premium-submit-btn"
                style={{
                  width: '100%',
                  padding: '11px',
                  background: c.accent,
                  border: 'none',
                  borderRadius: 6,
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {loading ? 'Verifying Code...' : 'Verify & Continue'}
              </button>
            </form>

            {/* Resend Code Section */}
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 12 }}>
              {canResend ? (
                <button
                  onClick={handleResendCode}
                  style={{
                    background: 'none', border: 'none', color: c.accent,
                    fontWeight: 700, cursor: 'pointer', padding: 0,
                    display: 'inline-flex', alignItems: 'center', gap: 4
                  }}
                >
                  <RefreshCw size={11} /> Resend Verification Code
                </button>
              ) : (
                <span style={{ color: c.muted }}>
                  Resend code in <strong style={{ color: c.text }}>{timer}s</strong>
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Form Screen */
          <div style={{ padding: '32px 28px 28px' }}>
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <Shield size={11} style={{ color: c.accent }} />
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.accent }}>
                  Skincare Profile
                </span>
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 500, color: c.text, marginBottom: 4 }}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </h2>
              <p style={{ fontSize: 12, color: c.textSec }}>
                {isSignUp
                  ? 'Sign up to track and save your formulation routines.'
                  : 'Sign in to access your personal dashboard.'
                }
              </p>
            </div>

            {/* Toggle Tabs */}
            <div style={{
              display: 'flex',
              background: c.elevated,
              border: `1px solid ${c.border}`,
              borderRadius: 99,
              padding: 3,
              marginBottom: 20,
            }}>
              <button
                type="button"
                onClick={() => { setIsSignUp(true); setError(''); }}
                style={{
                  flex: 1, padding: '7px 0', background: isSignUp ? '#FFFFFF' : 'none',
                  border: isSignUp ? `1px solid ${c.border}` : 'none',
                  fontSize: 11.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  color: isSignUp ? c.text : c.muted,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  borderRadius: 99,
                  boxShadow: isSignUp ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                Sign Up
              </button>
              <button
                type="button"
                onClick={() => { setIsSignUp(false); setError(''); }}
                style={{
                  flex: 1, padding: '7px 0', background: !isSignUp ? '#FFFFFF' : 'none',
                  border: !isSignUp ? `1px solid ${c.border}` : 'none',
                  fontSize: 11.5, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase',
                  color: !isSignUp ? c.text : c.muted,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  borderRadius: 99,
                  boxShadow: !isSignUp ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                Sign In
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div style={{
                padding: '9px 12px',
                background: `${c.danger}08`,
                borderLeft: `3px solid ${c.danger}`,
                borderRadius: 4,
                fontSize: 11.5,
                color: c.danger,
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {isSignUp && (
                /* Name field */
                <div>
                  <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.textSec, marginBottom: 5 }}>
                    Full Name
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.muted }} />
                    <input
                      type="text"
                      placeholder="e.g. Sumaiya Rahman"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="premium-input-field"
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 34px',
                        background: '#FFFFFF',
                        border: `1px solid ${c.border}`,
                        borderRadius: 6,
                        fontSize: 12.5,
                        color: c.text,
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div>
                <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.textSec, marginBottom: 5 }}>
                  Email Address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.muted }} />
                  <input
                    type="email"
                    placeholder="e.g. customer@gmail.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="premium-input-field"
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 34px',
                      background: '#FFFFFF',
                      border: `1px solid ${c.border}`,
                      borderRadius: 6,
                      fontSize: 12.5,
                      color: c.text,
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {isSignUp && (
                /* Phone field */
                <div>
                  <label style={{ display: 'block', fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.textSec, marginBottom: 5 }}>
                    Phone Number
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.muted }} />
                    <input
                      type="tel"
                      placeholder="e.g. 017XXXXXXXX"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="premium-input-field"
                      style={{
                        width: '100%',
                        padding: '8px 12px 8px 34px',
                        background: '#FFFFFF',
                        border: `1px solid ${c.border}`,
                        borderRadius: 6,
                        fontSize: 12.5,
                        color: c.text,
                        outline: 'none',
                        transition: 'all 0.2s ease',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Password field */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <label style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: c.textSec }}>
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      style={{
                        background: 'none', border: 'none', color: c.accent,
                        fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0,
                        fontFamily: "'DM Sans', sans-serif"
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = c.accentHover)}
                      onMouseLeave={e => (e.currentTarget.style.color = c.accent)}
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Lock size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.muted }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="premium-input-field"
                    style={{
                      width: '100%',
                      padding: '8px 32px 8px 32px',
                      background: '#FFFFFF',
                      border: `1px solid ${c.border}`,
                      borderRadius: 6,
                      fontSize: 12.5,
                      color: c.text,
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: c.muted, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>

                {/* Password Strength */}
                {isSignUp && password && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                      <span style={{ fontSize: 9, color: c.muted, textTransform: 'uppercase' }}>
                        Password Strength:
                      </span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: strength.color, textTransform: 'uppercase' }}>
                        {strength.label}
                      </span>
                    </div>
                    <div style={{ height: 2, width: '100%', background: 'rgba(0,0,0,0.05)', borderRadius: 1, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: strength.width,
                        background: strength.color,
                        transition: 'all 0.3s ease',
                      }} />
                    </div>
                  </div>
                )}
              </div>

              {isSignUp ? (
                /* Terms checkbox */
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', marginTop: 2 }}>
                  <input
                    type="checkbox"
                    checked={agree}
                    onChange={e => setAgree(e.target.checked)}
                    style={{
                      marginTop: 2, cursor: 'pointer', accentColor: c.accent,
                      width: 13, height: 13,
                    }}
                  />
                  <span style={{ fontSize: 11, color: c.textSec, lineHeight: 1.4 }}>
                    I agree to the <span style={{ color: c.accent, textDecoration: 'underline' }}>Terms</span> and <span style={{ color: c.accent, textDecoration: 'underline' }}>Privacy Policy</span>.
                  </span>
                </label>
              ) : (
                /* Remember checkbox */
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginTop: 2, width: 'fit-content' }}>
                  <input
                    type="checkbox"
                    style={{
                      cursor: 'pointer', accentColor: c.accent,
                      width: 13, height: 13,
                    }}
                  />
                  <span style={{ fontSize: 11.5, color: c.textSec }}>Remember me</span>
                </label>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="premium-submit-btn"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: c.accent,
                  border: 'none',
                  borderRadius: 6,
                  color: '#FFFFFF',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'all 0.25s ease',
                  marginTop: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {loading ? 'Synchronizing...' : (isSignUp ? 'Create Skincare Profile' : 'Access Account')}
              </button>
            </form>

            {/* Social Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0' }}>
              <div style={{ height: 1, flex: 1, background: c.border }} />
              <span style={{ fontSize: 8.5, color: c.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                OR CONTINUE WITH
              </span>
              <div style={{ height: 1, flex: 1, background: c.border }} />
            </div>

            {/* Social Logins */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                className="social-btn-premium"
                onClick={() => signIn('google', { callbackUrl: '/account' })}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 12px', background: '#FFFFFF',
                  border: `1px solid ${c.border}`, borderRadius: 6,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  fontSize: 11.5, fontWeight: 600, color: c.textSec,
                  fontFamily: "'DM Sans', sans-serif"
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.187 4.114-3.413 0-6.19-2.777-6.19-6.19 0-3.413 2.777-6.19 6.19-6.19 1.573 0 2.977.587 4.07 1.547l3.053-3.053C18.995 1.77 15.823 1 12.24 1 5.86 1 1 5.86 1 12.24s4.86 11.24 11.24 11.24c6.305 0 10.518-4.43 10.518-10.707 0-.742-.066-1.3-.2-1.896H12.24v.408z"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                className="social-btn-premium"
                onClick={() => signIn('facebook', { callbackUrl: '/account' })}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '8px 12px', background: '#FFFFFF',
                  border: `1px solid ${c.border}`, borderRadius: 6,
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  fontSize: 11.5, fontWeight: 600, color: c.textSec,
                  fontFamily: "'DM Sans', sans-serif"
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/>
                </svg>
                Facebook
              </button>


            </div>

            {/* Alternating Footnote */}
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11.5, color: c.muted }}>
              {isSignUp ? (
                <>
                  Already registered?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(false); setError(''); }}
                    style={{ background: 'none', border: 'none', color: c.accent, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    Authenticate here
                  </button>
                </>
              ) : (
                <>
                  New to our clinic?{' '}
                  <button
                    type="button"
                    onClick={() => { setIsSignUp(true); setError(''); }}
                    style={{ background: 'none', border: 'none', color: c.accent, fontWeight: 700, cursor: 'pointer', padding: 0 }}
                  >
                    Establish an account
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .modal-backdrop-blur {
          animation: modalFadeIn 0.25s ease-out forwards;
        }

        .modal-window-premium {
          animation: modalScaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .premium-input-field:focus {
          border-color: #C9956D !important;
          background: #FAF7F2 !important;
          box-shadow: 0 0 0 2px rgba(201, 149, 109, 0.15);
        }

        .social-btn-premium:hover {
          background: #FAF7F2 !important;
          border-color: #C9956D !important;
          color: #1A1A18 !important;
        }

        .premium-submit-btn:hover {
          background: #B5814A !important;
          box-shadow: 0 4px 12px rgba(201, 149, 109, 0.2) !important;
        }
      `}</style>
    </>
  );
}
