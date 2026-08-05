'use client';

import React, { useState, useEffect } from 'react';
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
  { label: 'AI Skin Analyzer', href: '/skin-analyzer' },
  { label: 'Compare Products', href: '/compare' },
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
          // Sort categories alphabetically
          const sortedCategories = [...data].sort((a, b) => a.name.localeCompare(b.name));
          setMobileCategories(sortedCategories);
          
          const dynamicMega = [
            { label: 'All Formulations', href: '/products', desc: 'Browse the full collection' },
            ...sortedCategories.map((c) => ({
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

  // Group categories alphabetically by first letter for "letter wise serial"
  const groupedCategories = mobileCategories.reduce((acc, cat) => {
    const letter = cat.name.charAt(0).toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(cat);
    return acc;
  }, {} as Record<string, any[]>);

  const sortedLetters = Object.keys(groupedCategories).sort();

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
          {/* Left: Mobile Menu Trigger (when hamburger on left is wanted) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
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

          {/* Right: Icons (Premium Circle Outline Styling) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, justifyContent: 'flex-end' }}>
            <button
              onClick={() => user ? router.push('/account') : setAccountOpen(true)}
              aria-label="Account"
              className="navbar-icon-btn hide-on-mobile"
            >
              {user ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: user.avatar ? 'transparent' : 'var(--accent)',
                }}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#FFF', textTransform: 'uppercase' }}>
                      {user.name.charAt(0)}
                    </span>
                  )}
                </div>
              ) : (
                <User size={18} />
              )}
            </button>

            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="navbar-icon-btn"
            >
              <Search size={18} />
            </button>

            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              aria-label="Wishlist"
              className="navbar-icon-btn hide-on-mobile"
            >
              <Heart size={18} />
              {wishlistCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    minWidth: 16,
                    height: 16,
                    background: '#ef4444',
                    color: '#FFF',
                    fontSize: 8,
                    fontWeight: 700,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {wishlistCount > 9 ? '9+' : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart Button */}
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Cart"
              className="navbar-icon-btn"
            >
              <ShoppingBag size={18} />
              {totalCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    minWidth: 16,
                    height: 16,
                    background: 'var(--accent)',
                    color: '#FFF',
                    fontSize: 8,
                    fontWeight: 700,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}
                >
                  {totalCount > 9 ? '9+' : totalCount}
                </span>
              )}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Menu"
              className="navbar-icon-btn"
              id="mobile-menu-btn"
              style={{ display: 'none' }}
            >
              <Menu size={18} />
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
              width: '85vw',
              maxWidth: 320,
              zIndex: 70,
              background: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              padding: 24,
              borderRight: '1px solid var(--border-default)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
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

            {/* Scrollable Navigation Area */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto', flex: 1, paddingRight: 4 }}>
              {/* Part 1: Main Links */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', padding: '8px 0' }}
                >
                  Home
                </Link>
                <Link
                  href="/products"
                  onClick={() => setMobileOpen(false)}
                  style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', padding: '8px 0' }}
                >
                  Shop All Products
                </Link>
                <Link
                  href="/brands"
                  onClick={() => setMobileOpen(false)}
                  style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', padding: '8px 0' }}
                >
                  Brands
                </Link>
              </div>

              {/* Part 2: Categories (Letter-Wise Alphabetical Headings) */}
              {sortedLetters.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 12 }}>
                    Formulations (A-Z)
                  </span>
                  
                  {sortedLetters.map((letter) => (
                    <div key={letter} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', marginBottom: 6, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 2 }}>
                        {letter}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingLeft: 4 }}>
                        {groupedCategories[letter].map((cat: any) => (
                          <Link
                            key={cat.name}
                            href={`/products?category=${encodeURIComponent(cat.name)}`}
                            onClick={() => setMobileOpen(false)}
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: 'var(--text-secondary)',
                              textDecoration: 'none',
                            }}
                          >
                            {cat.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Part 3: Clinical Tools & Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
                  Clinical Tools
                </span>
                <Link
                  href="/skin-analyzer"
                  onClick={() => setMobileOpen(false)}
                  style={{ fontSize: 14, fontWeight: 600, color: 'var(--sage)', textDecoration: 'none', padding: '6px 0' }}
                >
                  AI Skin Analyzer
                </Link>
                <Link
                  href="/quiz"
                  onClick={() => setMobileOpen(false)}
                  style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', padding: '6px 0' }}
                >
                  Skin Quiz
                </Link>
                <Link
                  href="/compare"
                  onClick={() => setMobileOpen(false)}
                  style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none', padding: '6px 0' }}
                >
                  Compare Products
                </Link>
                <Link
                  href="/blog"
                  onClick={() => setMobileOpen(false)}
                  style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none', padding: '6px 0' }}
                >
                  Blog
                </Link>
              </div>

              {/* Part 4: User Profile Area */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginBottom: 20 }}>
                <Link
                  href="/wishlist"
                  onClick={() => setMobileOpen(false)}
                  style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', textDecoration: 'none', padding: '6px 0' }}
                >
                  My Wishlist ({wishlistCount})
                </Link>
                <button
                  onClick={() => { setMobileOpen(false); user ? router.push('/account') : setAccountOpen(true); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    padding: '6px 0',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  {user ? 'My Profile' : 'Sign In / Register'}
                </button>
              </div>
            </nav>

            <div style={{ marginTop: 'auto', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
              © 2026 Beauty Glowry
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
        /* Cohesive Outline Circular Icon Buttons */
        .navbar-icon-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid var(--border-default);
          background: rgba(255, 255, 255, 0.4);
          color: var(--text-primary);
          cursor: pointer;
          position: relative;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .navbar-icon-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--bg-surface);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(201,149,109,0.12);
        }

        /* Responsive styling for Mobile Menu Button */
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
          .desktop-nav { display: none !important; }
          .navbar-container { padding: 0 16px !important; }
          header {
            background: rgba(250, 247, 242, 0.97) !important;
            backdrop-filter: blur(20px) !important;
            -webkit-backdrop-filter: blur(20px) !important;
            border-bottom: 1px solid var(--border-default) !important;
          }
        }

        /* Hide non-essential icons on Mobile to prevent clutter */
        @media (max-width: 640px) {
          .hide-on-mobile { display: none !important; }
        }

        /* Logo size on small screens */
        @media (max-width: 400px) {
          .navbar-logo { font-size: 17px !important; letter-spacing: 0.12em !important; }
        }
      `}</style>
    </>
  );
}
