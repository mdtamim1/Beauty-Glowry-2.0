'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Search, Menu, X, ChevronDown, Heart, User } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { useAuthStore } from '../store/useAuthStore';
import CartDrawer from './CartDrawer';
import LiveSearch from './LiveSearch';
import CustomerAccountModal from './CustomerAccountModal';

const navLinks = [
  { label: 'Home', href: '/' },
  {
    label: 'Shop',
    href: '/products',
    mega: [
      { label: 'All Formulations', href: '/products', desc: 'Browse the full collection' },
      { label: 'Serums & Elixirs', href: '/products?category=Serums+%26+Elixirs', desc: 'Targeted active treatments' },
      { label: 'Moisturizers', href: '/products?category=Moisturizers+%26+Creams', desc: 'Barrier repair formulas' },
      { label: 'Toners & Essences', href: '/products?category=Toners+%26+Essences', desc: 'Prep & hydrate layers' },
      { label: 'Cleansers', href: '/products?category=Cleansers+%26+Washes', desc: 'Deep-clean actives' },
      { label: 'New Arrivals', href: '/products?isNew=true', desc: 'Just synthesized' },
    ],
  },
  {
    label: 'Brands',
    href: '/brands',
    mega: [
      { label: 'All Brands', href: '/brands', desc: 'Browse all partner brands' },
      { label: 'Beauty Glowry', href: '/brands/beauty-glowry', desc: 'Our in-house clinical line' },
      { label: 'DermaLab', href: '/brands/dermalab', desc: 'Evidence-based dermatology' },
      { label: 'PureAct', href: '/brands/pureact', desc: 'Clean actives, pure results' },
      { label: 'Luminos', href: '/brands/luminos', desc: 'Radiance & brightening experts' },
    ],
  },
  { label: 'Skin Quiz', href: '/quiz' },
  { label: 'Blog', href: '/blog' },
  { label: 'Acne Care', href: '/products?concern=Acne+%26+Blemishes' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState<string | null>(null);
  const router = useRouter();
  const [storeName, setStoreName] = useState('Beauty Glowry');
  const [links, setLinks] = useState(navLinks);
  const [mobileCategories, setMobileCategories] = useState<any[]>([]);

  const cart = useCartStore((s) => s.cart);
  const user = useAuthStore((s) => s.user);
  const wishlist = useCartStore((s) => s.wishlist);
  const totalCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const wishlistCount = wishlist.length;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Fetch dynamic store name
    fetch('/api/admin/store-config')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.storeName) {
          setStoreName(data.storeName);
        }
      })
      .catch((err) => console.error('Failed to load store config in Navbar:', err));

    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setMobileCategories(data);
          const dynamicMega = [
            { label: 'All Formulations', href: '/products', desc: 'Browse the full collection' },
            ...data.map((c) => ({
              label: c.name,
              href: `/products?category=${encodeURIComponent(c.name)}`,
              desc: c.description || 'Clinical formulation'
            })),
            { label: 'New Arrivals', href: '/products?isNew=true', desc: 'Just synthesized' }
          ];
          setLinks((prev) =>
            prev.map((link) =>
              link.label === 'Shop' ? { ...link, mega: dynamicMega } : link
            )
          );
        }
      })
      .catch((err) => console.error('Failed to load dynamic categories in Navbar:', err));

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mobileList = [
    { label: 'Home', href: '/' },
    { label: 'All Products', href: '/products' },
    { label: 'Brands', href: '/brands' },
    ...(mobileCategories.length > 0
      ? mobileCategories.map((c) => ({
          label: c.name,
          href: `/products?category=${encodeURIComponent(c.name)}`,
        }))
      : [{ label: 'Serums & Elixirs', href: '/products?category=Serums+%26+Elixirs' }]),
    { label: 'Skin Quiz', href: '/quiz' },
    { label: 'Blog', href: '/blog' },
    { label: 'Acne Care', href: '/products?concern=Acne+%26+Blemishes' },
    { label: 'My Wishlist', href: '/wishlist' },
  ];

  // Close mega on outside click
  useEffect(() => {
    const handler = () => setMegaOpen(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          background: scrolled ? 'rgba(250, 247, 242, 0.96)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid var(--border-default)' : '1px solid transparent',
        }}
      >


        <div className="container-lg navbar-container" style={{ display: 'flex', alignItems: 'center', height: 64 }}>
          {/* Left: mobile menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="hide-mobile"
              style={{
                display: 'none',
                padding: 8,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
            >
              <Menu size={22} />
            </button>

            {/* Desktop nav */}
            <nav
              className="desktop-nav"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 32,
              }}
            >
              {links.map((link) => (
                <div
                  key={link.label}
                  style={{ position: 'relative' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (link.mega) setMegaOpen(megaOpen === link.label ? null : link.label);
                  }}
                >
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: '13px',
                      fontWeight: 500,
                      letterSpacing: '0.05em',
                      color: 'var(--text-primary)',
                      padding: '4px 0',
                    }}
                  >
                    {link.mega ? (
                      <>
                        {link.label}
                        <ChevronDown
                          size={14}
                          style={{
                            transform: megaOpen === link.label ? 'rotate(180deg)' : 'rotate(0)',
                            transition: 'transform 0.2s',
                          }}
                        />
                      </>
                    ) : (
                      <Link
                        href={link.href}
                        style={{
                          color: link.label === 'Skin Quiz' ? 'var(--sage)' : 'var(--text-primary)',
                          fontWeight: link.label === 'Skin Quiz' ? 600 : 500,
                          textDecoration: 'none',
                        }}
                        className="link-underline"
                      >
                        {link.label}
                      </Link>
                    )}
                  </button>

                  {/* Mega Dropdown */}
                  {link.mega && megaOpen === link.label && (
                    <div
                      className="animate-fade-up"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 12px)',
                        left: '-20px',
                        width: 440,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 4,
                        padding: 24,
                        boxShadow: '0 24px 60px rgba(26,26,24,0.12)',
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 4,
                      }}
                    >
                      {link.mega.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setMegaOpen(null)}
                          style={{
                            display: 'block',
                            padding: '10px 14px',
                            borderRadius: 3,
                            textDecoration: 'none',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{item.label}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </div>

          {/* Center: Logo */}
          <Link
            href="/"
            className="navbar-logo"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              flex: '0 0 auto',
            }}
          >
            {storeName}
          </Link>

          {/* Right: Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'flex-end' }}>
            <button
              onClick={() => user ? router.push('/account') : setAccountOpen(true)}
              aria-label="Account"
              style={{ padding: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              className="btn-ghost"
            >
              {user ? (
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: user.avatar ? 'transparent' : 'var(--accent, #C9956D)',
                  color: '#FFFFFF',
                  fontSize: 10,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textTransform: 'uppercase',
                  fontFamily: "'DM Sans', sans-serif",
                  overflow: 'hidden',
                  border: '2px solid var(--accent)',
                }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
              ) : (
                <User size={18} />
              )}
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              style={{ padding: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', borderRadius: 2 }}
              className="btn-ghost"
            >
              <Search size={18} />
            </button>

            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="btn-ghost navbar-wishlist-btn"
              style={{
                position: 'relative',
                padding: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-primary)',
                textDecoration: 'none',
                borderRadius: 2,
              }}
            >
              <Heart size={18} />
              {wishlistCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 15,
                    height: 15,
                    background: '#ef4444',
                    color: '#FFF',
                    fontSize: 8,
                    fontWeight: 700,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Button — premium pill style */}
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Cart"
              className="navbar-cart-btn"
            >
              <ShoppingBag size={15} />
              <span className="navbar-cart-label">Cart</span>
              {totalCount > 0 && (
                <span className="navbar-cart-badge">
                  {totalCount > 9 ? '9+' : totalCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Menu"
              style={{
                display: 'none',
                padding: 10,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-primary)',
              }}
              id="mobile-menu-btn"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            className="animate-fade-in"
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 60,
              background: 'rgba(26,26,24,0.5)',
            }}
          />
          <div
            className="animate-slide-right"
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 300,
              zIndex: 70,
              background: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              padding: 28,
              borderRight: '1px solid var(--border-default)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 18,
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: 'var(--text-primary)',
                }}
              >
                {storeName}
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {mobileList.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    fontSize: 15,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    textDecoration: 'none',
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border-subtle)',
                    letterSpacing: '0.02em',
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={() => { setMobileOpen(false); setAccountOpen(true); }}
                style={{
                  background: 'none',
                  border: 'none',
                  textAlign: 'left',
                  fontSize: 15,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  padding: '12px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Account / Sign Up
              </button>
            </nav>

            <div style={{ marginTop: 'auto', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              © 2024 Beauty Glowry
            </div>
          </div>
        </>
      )}

      {/* Spacer for fixed header */}
      <div style={{ height: 64 }} />

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <LiveSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <CustomerAccountModal isOpen={accountOpen} onClose={() => setAccountOpen(false)} />

      <style>{`
        /* Show mobile menu btn on small screens */
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
        }

        /* Hide desktop nav on mobile */
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
        }

        /* Logo size on small screens */
        @media (max-width: 400px) {
          .navbar-logo { font-size: 17px !important; letter-spacing: 0.12em !important; }
        }

        /* Ensure container fits on mobile */
        @media (max-width: 768px) {
          .navbar-container { padding: 0 16px !important; }
        }

        /* ── MOBILE: Always show solid navbar background ────────────
           On mobile, transparent header causes content bleed-through.
           Force a solid frosted background at all scroll positions.
        ────────────────────────────────────────────────────────────── */
        @media (max-width: 768px) {
          header {
            background: rgba(250, 247, 242, 0.97) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            border-bottom: 1px solid var(--border-default) !important;
          }
        }

        /* Premium cart pill button */
        .navbar-cart-btn {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 8px 16px 8px 12px;
          background: var(--text-primary);
          color: var(--bg-base);
          border: none;
          border-radius: 99px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          position: relative;
        }
        .navbar-cart-btn:hover {
          background: var(--accent);
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(201,149,109,0.35);
        }
        .navbar-cart-label {
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .navbar-cart-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          background: var(--accent);
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          border-radius: 99px;
          transition: background 0.25s ease;
        }
        .navbar-cart-btn:hover .navbar-cart-badge {
          background: rgba(255,255,255,0.25);
        }

        /* Wishlist button */
        .navbar-wishlist-btn {
          transition: color 0.2s ease, transform 0.2s ease !important;
        }
        .navbar-wishlist-btn:hover {
          color: #ef4444 !important;
          transform: scale(1.1);
        }

        /* Hide cart label text on very small screens */
        @media (max-width: 480px) {
          .navbar-cart-label { display: none; }
          .navbar-cart-btn { padding: 8px 10px; border-radius: 50%; }
        }
      `}</style>
    </>
  );
}
