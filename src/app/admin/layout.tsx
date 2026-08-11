'use client';

import React, { useState, createContext, useContext, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, Package, ShoppingCart, Users, Star,
  Megaphone, Settings, Menu, X, Bell, Search,
  ChevronRight, LogOut, Leaf, ExternalLink
} from 'lucide-react';
import { AdminSession } from './utils';

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
  textSec: '#B0A8A0',
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
  const [session, setSession] = useState<AdminSession | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Run seed only once on mount (not on every pathname change)
  useEffect(() => {
    const { seedTeamData } = require('./utils');
    seedTeamData();
  }, []);

  useEffect(() => {
    if (pathname === '/admin' || pathname === '/admin/') return;

    const sessionStr = localStorage.getItem('bg_admin_session');
    if (sessionStr) {
      setSession(JSON.parse(sessionStr));
    } else {
      router.push('/admin');
    }
  }, [pathname]);

  // Notifications State and Handlers
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setNotifications(data);
        }
      }
    } catch (e) {
      console.error('Failed to load admin notifications:', e);
    }
  };

  useEffect(() => {
    loadNotifications();
    // Poll every 30s instead of 10s — reduces server load by 3x
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch('/api/admin/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
      }
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const res = await fetch('/api/admin/notifications?clearAll=true', {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (e) {
      console.error('Error clearing notifications:', e);
    }
  };

  // Active nav item check
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  // Filter navigation items by user permissions
  const filteredNavItems = NAV_ITEMS.filter((item) => {
    if (!session) return true;
    return session.permissions.includes(item.label);
  });

  // Access control check for direct URL access
  const currentNavItem = NAV_ITEMS.find((n) => isActive(n.href));
  const hasAccess = !session || !currentNavItem || session.permissions.includes(currentNavItem.label);

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
            <p style={{ fontSize: 10, color: C.muted, letterSpacing: '0.08em', marginTop: 1 }}>
              {session?.role === 'admin' ? 'Admin Console' : 'Moderator Portal'}
            </p>
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
        {filteredNavItems.map((item) => {
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
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('bg_admin_session');
            }
          }}
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

  const accessDeniedScreen = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      textAlign: 'center',
      padding: '24px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        padding: '48px 40px',
        borderRadius: 16,
        maxWidth: 500,
        boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: 'rgba(240,165,75,0.1)',
          border: `1px solid ${C.warning}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
          boxShadow: '0 8px 24px rgba(240,165,75,0.15)',
        }}>
          <Bell size={28} style={{ color: C.warning }} />
        </div>
        
        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 12 }}>
          Access Denied
        </h2>
        
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 32 }}>
          Your moderator account (<strong style={{ color: C.text }}>{session?.email}</strong>) does not have permission to view the <strong style={{ color: C.accent }}>{currentNavItem?.label}</strong> tab. Please contact a Super Admin to adjust your security policy.
        </p>

        <div style={{ display: 'flex', gap: 12, width: '100%' }}>
          <Link
            href={session?.permissions && session.permissions.length > 0 ? `/admin/${session.permissions[0].toLowerCase() === 'dashboard' ? 'dashboard' : session.permissions[0].toLowerCase()}` : '/admin'}
            style={{
              flex: 1,
              padding: '10px 18px',
              background: 'rgba(255,255,255,0.04)',
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              color: C.textSec,
              textDecoration: 'none',
              transition: 'all 0.15s',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            Go Back
          </Link>
          <Link
            href="/admin"
            onClick={() => {
              if (typeof window !== 'undefined') localStorage.removeItem('bg_admin_session');
            }}
            style={{
              flex: 1,
              padding: '10px 18px',
              background: C.accent,
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              color: '#fff',
              textDecoration: 'none',
              transition: 'all 0.15s',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 4px 12px rgba(201,149,109,0.2)`,
            }}
          >
            Switch Account
          </Link>
        </div>
      </div>
    </div>
  );

  if (pathname === '/admin' || pathname === '/admin/') {
    return <>{children}</>;
  }

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
              {/* Notification bell dropdown container */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                  style={{
                    position: 'relative',
                    width: 34,
                    height: 34,
                    borderRadius: 6,
                    background: showNotifDropdown ? 'rgba(255,255,255,0.03)' : 'none',
                    border: `1px solid ${C.border}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: showNotifDropdown ? C.text : C.muted,
                    transition: 'all 0.2s',
                  }}
                >
                  <Bell size={15} />
                  {notifications.some((n) => !n.is_read) && (
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
                  )}
                </button>

                {showNotifDropdown && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 42,
                      right: 0,
                      width: 320,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                      zIndex: 100,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        borderBottom: `1px solid ${C.border}`,
                        background: C.elevated,
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>
                        Notifications ({notifications.filter((n) => !n.is_read).length})
                      </span>
                      {notifications.length > 0 && (
                        <button
                          onClick={() => {
                            clearAllNotifications();
                            setShowNotifDropdown(false);
                          }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: C.accent,
                            fontSize: 10,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <div
                      style={{
                        maxHeight: 280,
                        overflowY: 'auto',
                      }}
                    >
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => markAsRead(n.id)}
                            style={{
                              padding: '12px 16px',
                              borderBottom: `1px solid ${C.border}`,
                              cursor: 'pointer',
                              background: n.is_read ? 'transparent' : 'rgba(201, 149, 109, 0.04)',
                              transition: 'background 0.2s',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 4,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: n.is_read ? 600 : 700,
                                  color: n.is_read ? C.textSec : C.text,
                                }}
                              >
                                {n.title}
                              </span>
                              {!n.is_read && (
                                <span
                                  style={{
                                    width: 5,
                                    height: 5,
                                    borderRadius: '50%',
                                    background: C.accent,
                                  }}
                                />
                              )}
                            </div>
                            <p
                              style={{
                                fontSize: 11,
                                color: C.textSec,
                                margin: 0,
                                lineHeight: 1.4,
                              }}
                            >
                              {n.message}
                            </p>
                            <span
                              style={{
                                fontSize: 8,
                                color: C.muted,
                                display: 'block',
                                marginTop: 6,
                              }}
                            >
                              {new Date(n.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div
                          style={{
                            padding: '24px 16px',
                            textAlign: 'center',
                            color: C.muted,
                            fontSize: 11,
                          }}
                        >
                          No alerts available.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

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
                    background: session?.role === 'admin'
                      ? `linear-gradient(135deg, ${C.accent}, #A07050)`
                      : `linear-gradient(135deg, ${C.success}, #3b8e64)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                  }}
                >
                  {session?.name ? session.name[0].toUpperCase() : 'A'}
                </div>
                <div className="admin-hide-mobile">
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.text, lineHeight: 1 }}>
                    {session?.name || 'Admin'}
                  </p>
                  <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>
                    {session?.role === 'admin' ? 'Super User' : 'Moderator'}
                  </p>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main style={{ flex: 1, padding: 24, overflow: 'auto' }}>
            {hasAccess ? children : accessDeniedScreen}
          </main>
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
