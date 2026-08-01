import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Leaf } from 'lucide-react';

const footerLinks = {
  Shop: [
    { label: 'All Formulations', href: '/products' },
    { label: 'Serums & Elixirs', href: '/products?category=Serums+%26+Elixirs' },
    { label: 'Moisturizers', href: '/products?category=Moisturizers+%26+Creams' },
    { label: 'Toners', href: '/products?category=Toners+%26+Essences' },
    { label: 'Cleansers', href: '/products?category=Cleansers+%26+Washes' },
  ],
  Solutions: [
    { label: 'Acne & Blemishes', href: '/products?concern=Acne+%26+Blemishes' },
    { label: 'Brightening', href: '/products?concern=Dullness+%26+Uneven+Tone' },
    { label: 'Anti-Aging', href: '/products?concern=Aging+%26+Fine+Lines' },
    { label: 'Hydration', href: '/products?concern=Dehydration+%26+Dryness' },
    { label: 'Skin Quiz', href: '/quiz' },
  ],
  Support: [
    { label: 'Track Order', href: '#' },
    { label: 'Return Policy', href: '#' },
    { label: 'FAQ', href: '#' },
    { label: 'Contact Us', href: '#' },
  ],
};

const payments = ['bKash', 'Nagad', 'SSLCommerz', 'Visa/MC', 'COD'];

export default function Footer() {
  const [config, setConfig] = useState({
    storeName: 'Beauty Glowry',
    storeTagline: 'Precision-formulated active skincare engineered for clinical efficacy.',
    storePhone: '',
    storeEmail: 'hello@beautyglowry.com',
    storeAddress: 'Dhaka, Bangladesh'
  });

  useEffect(() => {
    fetch('/api/admin/store-config')
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setConfig((prev) => ({ ...prev, ...data }));
        }
      })
      .catch((err) => console.error('Failed to load store config in Footer:', err));
  }, []);

  return (
    <footer
      style={{
        background: 'var(--text-primary)',
        color: 'var(--bg-base)',
        paddingTop: 80,
        paddingBottom: 40,
        marginTop: 'auto',
      }}
    >
      <div className="container-lg">
        {/* Top Section */}
        <div className="footer-top-grid">
          {/* Brand Column */}
          <div>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 26,
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                marginBottom: 16,
                color: 'var(--bg-base)',
              }}
            >
              {config.storeName}
            </div>
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.8,
                color: 'rgba(250,247,242,0.6)',
                marginBottom: 16,
                maxWidth: 280,
              }}
            >
              {config.storeTagline}
            </p>
            
            {/* Dynamic Contact details */}
            <div style={{ fontSize: 12, color: 'rgba(250,247,242,0.45)', display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
              {config.storePhone && <div>📞 {config.storePhone}</div>}
              {config.storeEmail && <div>✉️ {config.storeEmail}</div>}
              {config.storeAddress && <div>📍 {config.storeAddress}</div>}
            </div>

            {/* Social */}
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { label: 'Facebook', href: '#', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg> },
                { label: 'Instagram', href: '#', svg: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg> },
                { label: 'TikTok', href: '#', svg: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg> },
                { label: 'X', href: '#', svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.763l7.729-8.835L2.25 2.25h6.813l4.027 5.328 5.154-5.328zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/></svg> },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 2,
                    border: '1px solid rgba(250,247,242,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'rgba(250,247,242,0.6)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.color = 'var(--accent)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(250,247,242,0.15)';
                    e.currentTarget.style.color = 'rgba(250,247,242,0.6)';
                  }}
                >
                  {s.svg}
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'rgba(250,247,242,0.45)',
                  marginBottom: 20,
                }}
              >
                {title}
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="link-underline"
                      style={{
                        fontSize: 13,
                        color: 'rgba(250,247,242,0.7)',
                        textDecoration: 'none',
                        transition: 'color 0.2s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--bg-base)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250,247,242,0.7)')}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Row */}
        <div
          style={{
            paddingTop: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Leaf size={13} style={{ color: '#8B9D77' }} />
            <span style={{ fontSize: 11, color: 'rgba(250,247,242,0.4)', letterSpacing: '0.04em' }}>
              © {new Date().getFullYear()} {config.storeName}. All Rights Reserved.
            </span>
          </div>

          {/* Payments */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {payments.map((p) => (
              <span
                key={p}
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  color: 'rgba(250,247,242,0.45)',
                  border: '1px solid rgba(250,247,242,0.1)',
                  padding: '4px 8px',
                  borderRadius: 2,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        /* Footer top grid */
        .footer-top-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: 48px;
          padding-bottom: 56px;
          border-bottom: 1px solid rgba(250,247,242,0.1);
        }

        /* Tablet — 900px */
        @media (max-width: 900px) {
          .footer-top-grid {
            grid-template-columns: 1fr 1fr;
            gap: 40px;
          }
        }

        /* Mobile — 560px */
        @media (max-width: 560px) {
          .footer-top-grid {
            grid-template-columns: 1fr;
            gap: 32px;
          }
        }
      `}</style>
    </footer>
  );
}
