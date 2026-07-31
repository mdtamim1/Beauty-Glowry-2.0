'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Lock, Eye, EyeOff, Shield } from 'lucide-react';

const ADMIN_PASSWORD = 'admin123';

const C = {
  bg: '#0F0F0D',
  surface: '#1A1A17',
  elevated: '#222220',
  border: 'rgba(255,255,255,0.08)',
  text: '#F0EBE3',
  muted: '#7A7470',
  accent: '#C9956D',
};

export default function AdminAuthPage() {
  const [loginType, setLoginType] = useState<'admin' | 'moderator'>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, loginType }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed.');
        setLoading(false);
        return;
      }

      localStorage.setItem('bg_admin_session', JSON.stringify(data.session));
      localStorage.setItem('bg_admin_token', data.token);

      if (data.session.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        const allowedPage = data.session.permissions.includes('Dashboard')
          ? 'dashboard'
          : data.session.permissions[0]?.toLowerCase() || '';

        if (allowedPage) {
          router.push(`/admin/${allowedPage}`);
        } else {
          setError('This account has no permissions assigned. Contact Super Admin.');
          setLoading(false);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError('Connection error. Failed to log in.');
      setLoading(false);
    }
  };

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
      {/* Background Grid */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: `linear-gradient(rgba(201,149,109,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(201,149,109,0.03) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          width: '100%',
          maxWidth: 420,
          position: 'relative',
        }}
      >
        {/* Card */}
        <div
          style={{
            background: C.surface,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '40px 36px',
            boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
          }}
        >
          {/* Logo */}
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
            <h1
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 18,
                fontWeight: 700,
                color: C.text,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Beauty Glowry
            </h1>
            <p style={{ fontSize: 12, color: C.muted }}>Console Secure Entrance Portal</p>
          </div>

          {/* Tab Selector */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, background: 'rgba(255,255,255,0.02)', padding: 4, borderRadius: 8, border: `1px solid ${C.border}` }}>
            <button
              type="button"
              onClick={() => { setLoginType('admin'); setError(''); }}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: loginType === 'admin' ? `${C.accent}18` : 'transparent',
                color: loginType === 'admin' ? C.accent : C.muted,
                border: `1px solid ${loginType === 'admin' ? `${C.accent}40` : 'transparent'}`,
                transition: 'all 0.15s ease',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              👑 Super Admin
            </button>
            <button
              type="button"
              onClick={() => { setLoginType('moderator'); setError(''); }}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                background: loginType === 'moderator' ? `${C.accent}18` : 'transparent',
                color: loginType === 'moderator' ? C.accent : C.muted,
                border: `1px solid ${loginType === 'moderator' ? `${C.accent}40` : 'transparent'}`,
                transition: 'all 0.15s ease',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              👤 Moderator
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin}>
            {/* Show email only for moderator */}
            {loginType === 'moderator' && (
              <div style={{ marginBottom: 18 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: C.muted,
                    marginBottom: 8,
                  }}
                >
                  Moderator Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@beautyglowry.com"
                  autoFocus={loginType === 'moderator'}
                  style={{
                    width: '100%',
                    padding: '11px 16px',
                    background: C.elevated,
                    border: `1px solid ${error ? '#E05A5A' : C.border}`,
                    borderRadius: 8,
                    fontSize: 13,
                    color: C.text,
                    fontFamily: "'DM Sans', sans-serif",
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = error ? '#E05A5A' : C.border)}
                />
              </div>
            )}

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: C.muted,
                  marginBottom: 8,
                }}
              >
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={14}
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: C.muted }}
                />
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoFocus={loginType === 'admin'}
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
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = error ? '#E05A5A' : C.border)}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: C.muted,
                    padding: 4,
                  }}
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {error && (
                <p style={{ fontSize: 11, color: '#E05A5A', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={12} /> {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password || (loginType === 'moderator' && !email)}
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
              {loading ? 'Verifying...' : 'Access Admin Panel →'}
            </button>
          </form>

          {/* Hint */}
          <div
            style={{
              marginTop: 24,
              padding: '12px 16px',
              background: 'rgba(201,149,109,0.04)',
              border: `1px solid rgba(201,149,109,0.1)`,
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={13} style={{ color: C.accent, flexShrink: 0 }} />
              <p style={{ fontSize: 11, color: C.muted }}>
                Demo Credentials:
              </p>
            </div>
            <p style={{ fontSize: 10, color: C.muted, margin: 0, paddingLeft: 21 }}>
              👑 Super Admin: <span style={{ color: C.accent, fontFamily: "'DM Mono', monospace" }}>admin123</span>
            </p>
            <p style={{ fontSize: 10, color: C.muted, margin: 0, paddingLeft: 21 }}>
              👤 Moderator: <span style={{ color: C.accent, fontFamily: "'DM Mono', monospace" }}>sarah@beautyglowry.com</span> / <span style={{ color: C.accent, fontFamily: "'DM Mono', monospace" }}>moderator123</span>
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 20 }}>
          Beauty Glowry Admin © 2024 · Secure Role Based Access
        </p>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0F0F0D !important; }
      `}</style>
    </div>
  );
}
