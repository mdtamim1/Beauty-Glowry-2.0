'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Leaf, Lock, User, Eye, EyeOff, CheckCircle2, ShieldAlert } from 'lucide-react';

const C = {
  bg: '#0F0F0D',
  surface: '#1A1A17',
  elevated: '#222220',
  border: 'rgba(255,255,255,0.08)',
  text: '#F0EBE3',
  muted: '#7A7470',
  accent: '#C9956D',
  success: '#4CAF82',
  danger: '#E05A5A',
};

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Validate Token on mount
  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      return;
    }

    const validateToken = async () => {
      try {
        // Decode base64 token
        const decodedData = JSON.parse(atob(token));
        if (!decodedData.email || !decodedData.permissions) {
          setIsValidToken(false);
          return;
        }

        // 1. Check if user is already registered in DB
        const modRes = await fetch('/api/team/moderators');
        if (!modRes.ok) throw new Error('Database connection failed');
        const moderators = await modRes.json();
        const isRegistered = moderators.some((m: any) => m.email.toLowerCase() === decodedData.email.toLowerCase());
        
        if (isRegistered) {
          setError('This invitation email has already been registered. Please log in.');
          setIsValidToken(false);
          return;
        }

        // 2. Check if invitation exists in database
        const invRes = await fetch('/api/team/invitations');
        if (!invRes.ok) throw new Error('Database connection failed');
        const invitations = await invRes.json();
        const match = invitations.find((i: any) => i.email.toLowerCase() === decodedData.email.toLowerCase());

        if (match) {
          setEmail(decodedData.email);
          setPermissions(decodedData.permissions);
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
        }
      } catch (e) {
        setIsValidToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    const registerUser = async () => {
      try {
        // Add new moderator to database
        const regRes = await fetch('/api/team/moderators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            email,
            password,
            permissions,
          }),
        });

        const data = await regRes.json();
        if (!regRes.ok) {
          setError(data.error || 'Registration failed.');
          setLoading(false);
          return;
        }

        // Delete processed invitation in database
        await fetch(`/api/team/invitations?email=${encodeURIComponent(email)}`, {
          method: 'DELETE',
        });

        // Add action to Audit Logs via database POST
        await fetch('/api/team/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            moderatorEmail: email,
            moderatorName: name,
            action: 'Account registered',
            details: 'Registered moderator account via invitation link',
          }),
        });

        // Log moderator session in LocalStorage
        const session = {
          role: 'moderator' as const,
          email: email,
          name: name,
          permissions: permissions,
        };
        localStorage.setItem('bg_admin_session', JSON.stringify(session));

        setSuccess(true);
        setLoading(false);

        // Redirect to dashboard/first tab
        const allowedPage = permissions.includes('Dashboard')
          ? 'dashboard'
          : permissions[0]?.toLowerCase() || '';

        setTimeout(() => {
          router.push(`/admin/${allowedPage}`);
        }, 1500);
      } catch (err) {
        setError('An error occurred during registration. Please try again.');
        setLoading(false);
      }
    };

    registerUser();
  };

  if (isValidToken === null) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <p style={{ color: C.muted, fontSize: 14 }}>Validating security token...</p>
      </div>
    );
  }

  if (isValidToken === false) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(224,90,90,0.1)',
            border: `1.5px solid ${C.danger}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <ShieldAlert size={24} color={C.danger} />
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 10 }}>
          Invalid or Expired Link
        </h2>
        <p style={{ fontSize: 12, color: C.muted, lineHeight: 1.6, marginBottom: 24, maxWidth: 320, marginInline: 'auto' }}>
          {error || 'This invitation link is invalid, expired, or has already been used to register. Please request a new invite from your administrator.'}
        </p>
        <button
          onClick={() => router.push('/admin')}
          style={{
            padding: '9px 18px',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            fontSize: 12,
            fontWeight: 600,
            color: C.text,
            cursor: 'pointer',
          }}
        >
          Return to Login
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(76,175,130,0.1)',
            border: `1.5px solid ${C.success}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <CheckCircle2 size={24} color={C.success} />
        </div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 10 }}>
          Registration Complete!
        </h2>
        <p style={{ fontSize: 12, color: C.muted, marginBottom: 0 }}>
          Setting up moderator session and launching panel...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${C.accent}, #A07050)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: `0 12px 32px rgba(201,149,109,0.3)`,
          }}
        >
          <Leaf size={22} color="#fff" />
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
          Join Team
        </h1>
        <p style={{ fontSize: 12, color: C.muted }}>Create password for <strong style={{ color: C.text }}>{email}</strong></p>
      </div>

      <form onSubmit={handleRegister}>
        {/* Full Name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
            Full Name
          </label>
          <div style={{ position: 'relative' }}>
            <User size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input
              type="text"
              required
              placeholder="e.g. Sarah Ahmed"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 16px 11px 40px',
                background: C.elevated,
                border: `1px solid ${error ? '#E05A5A' : C.border}`,
                borderRadius: 8,
                fontSize: 13,
                color: C.text,
                fontFamily: "'DM Sans', sans-serif",
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Password */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
            Create Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input
              type={showPass ? 'text' : 'password'}
              required
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 44px 11px 40px',
                background: C.elevated,
                border: `1px solid ${error ? '#E05A5A' : C.border}`,
                borderRadius: 8,
                fontSize: 13,
                color: C.text,
                fontFamily: "'DM Mono', monospace",
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
            Confirm Password
          </label>
          <div style={{ position: 'relative' }}>
            <Lock size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
            <input
              type={showPass ? 'text' : 'password'}
              required
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '11px 44px 11px 40px',
                background: C.elevated,
                border: `1px solid ${error ? '#E05A5A' : C.border}`,
                borderRadius: 8,
                fontSize: 13,
                color: C.text,
                fontFamily: "'DM Mono', monospace",
                outline: 'none',
              }}
            />
          </div>
          {error && (
            <p style={{ fontSize: 11, color: '#E05A5A', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={12} /> {error}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            background: loading ? C.muted : `linear-gradient(135deg, ${C.accent}, #B5814A)`,
            border: 'none',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#fff',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: loading ? 'none' : `0 8px 24px rgba(201,149,109,0.3)`,
          }}
        >
          {loading ? 'Registering...' : 'Register & Join Console →'}
        </button>
      </form>
    </div>
  );
}

export default function ModeratorRegisterPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        padding: 20,
      }}
    >
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `linear-gradient(rgba(201,149,109,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,149,109,0.03) 1px, transparent 1px)`, backgroundSize: '40px 40px', pointerEvents: 'none' }} />
      <div style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: '40px 36px', boxShadow: '0 40px 100px rgba(0,0,0,0.5)' }}>
          <Suspense fallback={<p style={{ color: C.muted, fontSize: 13, textAlign: 'center' }}>Loading invitation...</p>}>
            <RegisterForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
