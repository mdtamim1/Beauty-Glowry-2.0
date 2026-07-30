'use client';

import React, { useState, createContext, useContext } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Star,
  Megaphone, Settings, Menu, X, Bell, Search,
  ChevronRight, LogOut, Leaf, ExternalLink
} from 'lucide-react';

// ─── Admin Context ───────────────────────────────────────────────
interface AdminContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
}
const AdminCtx = createContext<AdminContextType>({
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
});
export const useAdminCtx = () => useContext(AdminCtx);

// ─── Nav Items ────────────────────────────────────────────────────
const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/reviews', label: 'Reviews', icon: Star },
  { href: '/admin/marketing', label: 'Marketing', icon: Megaphone },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

// ─── Color Tokens ─────────────────────────────────────────────────
const C = {
  bg: '#0F0F0D',
  surface: '#1A1A17',
  elevated: '#222220',
  border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.14)',
  text: '#F0EBE3',
  muted: '#7A7470',
  accent: '#C9956D',
  accentDim: 'rgba(201,149,109,0.12)',
  success: '#4CAF82',
  warning: '#F0A54B',
  danger: '#E05A5A',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Active nav item
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: collapsed ? '24px 18px' : '24px 24px',
          borderBottom: `1px solid ${C.border}`,
          marginBottom: 8,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 6,
            background: `linear-gradient(135deg, ${C.accent}, #A07050)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Leaf size={16} color="#fff" />
        </div>
        {!collapsed && (
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: '0.05em', lineHeight: 1.2 }}>
              BEAUTY GLOWRY
            </p>
            <p style={{ fontSize: 10, color: C.muted, letterSpacing: '0.08em', marginTop: 1 }}>Admin Console</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '8px 12px', overflowY: 'auto' }}>
        <p
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: C.muted,
            padding: `8px ${collapsed ? 6 : 10}px 10px`,
            opacity: collapsed ? 0 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: collapsed ? '10px 0' : '10px 12px',
                borderRadius: 6,
                marginBottom: 2,
                textDecoration: 'none',
                background: active ? C.accentDim : 'transparent',
                border: `1px solid ${active ? 'rgba(201,149,109,0.25)' : 'transparent'}`,
                transition: 'all 0.15s ease',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = 'transparent';
              }}
            >
              <item.icon
                size={18}
                style={{ color: active ? C.accent : C.muted, flexShrink: 0, transition: 'color 0.15s' }}
              />
              {!collapsed && (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    color: active ? C.text : C.muted,
                    letterSpacing: '0.02em',
                    transition: 'color 0.15s',
                  }}
                >
                  {item.label}
                </span>
              )}
              {!collapsed && active && (
                <ChevronRight size={13} style={{ marginLeft: 'auto', color: C.accent, opacity: 0.6 }} />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div style={{ padding: '12px', borderTop: `1px solid ${C.border}` }}>
        <Link
          href="/"
          target="_blank"
          title={collapsed ? 'View Store' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '9px 0' : '9px 12px',
            borderRadius: 6,
            textDecoration: 'none',
            marginBottom: 4,
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <ExternalLink size={16} style={{ color: C.muted }} />
          {!collapsed && <span style={{ fontSize: 12, color: C.muted }}>View Store</span>}
        </Link>
        <Link
          href="/admin"
          title={collapsed ? 'Logout' : undefined}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: collapsed ? '9px 0' : '9px 12px',
            borderRadius: 6,
            textDecoration: 'none',
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(224,90,90,0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <LogOut size={16} style={{ color: '#E05A5A' }} />
          {!collapsed && <span style={{ fontSize: 12, color: '#E05A5A' }}>Logout</span>}
        </Link>
      </div>
    </div>
  );

  return (
    <AdminCtx.Provider value={{ sidebarCollapsed: collapsed, setSidebarCollapsed: setCollapsed }}>
      <div
        style={{
          display: 'flex',
          minHeight: '100vh',
          background: C.bg,
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        {/* ── Desktop Sidebar ──────────────────────────────────── */}
        <aside
          style={{
            width: collapsed ? 64 : 220,
            flexShrink: 0,
            background: C.surface,
            borderRight: `1px solid ${C.border}`,
            position: 'fixed',
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 40,
            transition: 'width 0.3s cubic-bezier(0.16,1,0.3,1)',
            overflow: 'hidden',
          }}
          className="admin-sidebar"
        >
          <SidebarContent />
        </aside>

        {/* ── Mobile Overlay ────────────────────────────────────── */}
        {mobileOpen && (
          <>
            <div
              onClick={() => setMobileOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)' }}
            />
            <aside
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                width: 240,
                zIndex: 60,
                background: C.surface,
                borderRight: `1px solid ${C.border}`,
              }}
            >
              <SidebarContent />
            </aside>
          </>
        )}

        {/* ── Main Area ────────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            marginLeft: collapsed ? 64 : 220,
            transition: 'margin-left 0.3s cubic-bezier(0.16,1,0.3,1)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
          }}
        >
          {/* Topbar */}
          <header
            style={{
              height: 60,
              background: C.surface,
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              position: 'sticky',
              top: 0,
              zIndex: 30,
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Collapse toggle */}
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="admin-hide-mobile"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: 'none',
                  border: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.muted,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = C.borderHover)}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
              >
                <Menu size={16} />
              </button>
              {/* Mobile menu */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="admin-show-mobile"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  background: 'none',
                  border: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  display: 'none',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.muted,
                }}
              >
                {mobileOpen ? <X size={16} /> : <Menu size={16} />}
              </button>

              {/* Breadcrumb */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: C.muted }}>Admin</span>
                <ChevronRight size={11} style={{ color: C.muted }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                  {NAV_ITEMS.find((n) => isActive(n.href))?.label || 'Dashboard'}
                </span>
              </div>
            </div>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {/* Notification bell */}
              <button
                style={{
                  position: 'relative',
                  width: 34,
                  height: 34,
                  borderRadius: 6,
                  background: 'none',
                  border: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.muted,
                }}
              >
                <Bell size={15} />
                <span
                  style={{
                    position: 'absolute',
                    top: 7,
                    right: 7,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: C.accent,
                    border: `1.5px solid ${C.surface}`,
                  }}
                />
              </button>

              {/* Admin badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: C.elevated,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${C.accent}, #A07050)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  A
                </div>
                <div className="admin-hide-mobile">
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1 }}>Admin</p>
                  <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Super User</p>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>{children}</main>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0F0F0D !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        .admin-hide-mobile { display: flex !important; }
        .admin-show-mobile { display: none !important; }
        @media (max-width: 768px) {
          .admin-sidebar { display: none !important; }
          .admin-hide-mobile { display: none !important; }
          .admin-show-mobile { display: flex !important; }
        }
      `}</style>
    </AdminCtx.Provider>
  );
}
