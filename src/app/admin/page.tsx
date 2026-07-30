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
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setTimeout(() => {
      if (password === ADMIN_PASSWORD) {
        router.push('/admin/dashboard');
      } else {
        setError('Incorrect password. Try "admin123"');
        setLoading(false);
      }
    }, 600);
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
            padding: '48px 40px',
            boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
          }}
        >
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: `linear-gradient(135deg, ${C.accent}, #A07050)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: `0 12px 32px rgba(201,149,109,0.3)`,
              }}
            >
              <Leaf size={24} color="#fff" />
            </div>
            <h1
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: C.text,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                marginBottom: 6,
              }}
            >
              Beauty Glowry
            </h1>
            <p style={{ fontSize: 13, color: C.muted }}>Admin Console · Secure Access</p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: C.border, marginBottom: 32 }} />

          {/* Form */}
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: C.muted,
                  marginBottom: 10,
                }}
              >
                Admin Password
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
                  placeholder="Enter password..."
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 44px 12px 40px',
                    background: C.elevated,
                    border: `1px solid ${error ? '#E05A5A' : C.border}`,
                    borderRadius: 8,
                    fontSize: 14,
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
                <p style={{ fontSize: 12, color: '#E05A5A', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Shield size={12} /> {error}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              style={{
                width: '100%',
                padding: '13px',
                background: loading ? C.muted : `linear-gradient(135deg, ${C.accent}, #B5814A)`,
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: '#fff',
                cursor: loading || !password ? 'not-allowed' : 'pointer',
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
              background: 'rgba(201,149,109,0.06)',
              border: `1px solid rgba(201,149,109,0.15)`,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Shield size={13} style={{ color: C.accent, flexShrink: 0 }} />
            <p style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
              Demo password: <span style={{ color: C.accent, fontFamily: "'DM Mono', monospace", fontWeight: 600 }}>admin123</span>
            </p>
          </div>
        </div>

        {/* Footer note */}
        <p style={{ textAlign: 'center', fontSize: 11, color: C.muted, marginTop: 20 }}>
          Beauty Glowry Admin © 2024 · All access logged
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
