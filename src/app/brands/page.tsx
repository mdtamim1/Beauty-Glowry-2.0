'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Package, MapPin, Calendar } from 'lucide-react';
import { brands, products } from '../../data/products';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function BrandsPage() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dbProducts, setDbProducts] = useState<typeof products>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDbProducts(data);
        }
        setLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load products for brand count:', err);
        setLoaded(true);
      });
  }, []);

  // Compute product count per brand
  const brandsWithCount = brands.map((brand) => ({
    ...brand,
    productCount: dbProducts.filter((p) => p.brand === brand.id).length,
  }));

  return (
    <>
      <Navbar />

      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
          padding: '80px 0 60px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative background text */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 'clamp(80px, 15vw, 200px)',
            fontWeight: 700,
            color: 'var(--text-primary)',
            opacity: 0.03,
            whiteSpace: 'nowrap',
            userSelect: 'none',
            letterSpacing: '0.05em',
          }}
        >
          BRANDS
        </div>

        <div className="container-lg" style={{ position: 'relative', zIndex: 1 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: 14,
            }}
          >
            Our Partners
          </p>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(32px, 6vw, 58px)',
              fontWeight: 400,
              color: 'var(--text-primary)',
              lineHeight: 1.05,
              marginBottom: 16,
            }}
          >
            Shop by Brand
          </h1>
          <p
            style={{
              fontSize: 15,
              color: 'var(--text-muted)',
              maxWidth: 540,
              lineHeight: 1.7,
            }}
          >
            Discover curated clinical skincare from the world's leading dermatological brands — each selected for scientific rigour and proven efficacy.
          </p>
        </div>
      </div>

      {/* ── Brand Grid ──────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-base)',
          paddingTop: 56,
          paddingBottom: 100,
        }}
      >
        <div className="container-lg">
          <div className="brands-grid">
            {brandsWithCount.map((brand) => {
              const isHovered = hoveredId === brand.id;
              return (
                <Link
                  key={brand.id}
                  href={`/brands/${brand.id}`}
                  style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}
                  onMouseEnter={() => setHoveredId(brand.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <article
                    style={{
                      background: 'var(--bg-surface)',
                      border: `1px solid ${isHovered ? brand.accentColor + '60' : 'var(--border-default)'}`,
                      borderRadius: 12,
                      overflow: 'hidden',
                      transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                      boxShadow: isHovered
                        ? `0 24px 64px ${brand.accentColor}22, 0 4px 16px rgba(26,26,24,0.08)`
                        : '0 2px 8px rgba(26,26,24,0.04)',
                      transition: 'all 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      flex: 1,
                    }}
                  >
                    {/* Cover Image */}
                    <div
                      style={{
                        position: 'relative',
                        height: 200,
                        overflow: 'hidden',
                        background: 'var(--bg-elevated)',
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundImage: `url(${brand.coverImage})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          transform: isHovered ? 'scale(1.06)' : 'scale(1)',
                          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                          filter: 'brightness(0.55)',
                        }}
                      />

                      {/* Brand logo / monogram */}
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: '50%',
                            background: `${brand.accentColor}28`,
                            border: `2px solid ${brand.accentColor}60`,
                            backdropFilter: 'blur(12px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 26,
                            transition: 'transform 0.3s ease',
                            transform: isHovered ? 'scale(1.12)' : 'scale(1)',
                          }}
                        >
                          {brand.logo}
                        </div>
                        <h2
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontSize: 22,
                            fontWeight: 600,
                            color: '#FAF7F2',
                            letterSpacing: '0.06em',
                            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
                          }}
                        >
                          {brand.name}
                        </h2>
                      </div>

                      {/* Product count badge */}
                      {loaded && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 12,
                            right: 12,
                            background: 'rgba(26,26,24,0.75)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(250,247,242,0.15)',
                            borderRadius: 99,
                            padding: '4px 12px',
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#FAF7F2',
                            letterSpacing: '0.06em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                        >
                          <Package size={10} />
                          {brand.productCount} products
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: brand.accentColor,
                          marginBottom: 8,
                        }}
                      >
                        {brand.tagline}
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          lineHeight: 1.65,
                          marginBottom: 18,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {brand.description}
                      </p>

                      {/* Meta row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 16,
                          paddingTop: 14,
                          borderTop: '1px solid var(--border-subtle)',
                          marginBottom: 16,
                          marginTop: 'auto',
                        }}
                      >
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            color: 'var(--text-muted)',
                          }}
                        >
                          <MapPin size={11} />
                          {brand.country}
                        </span>
                        <span
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: 11,
                            color: 'var(--text-muted)',
                          }}
                        >
                          <Calendar size={11} />
                          Est. {brand.founded}
                        </span>
                      </div>

                      {/* CTA */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: isHovered ? brand.accentColor : 'var(--text-primary)',
                            transition: 'color 0.2s ease',
                          }}
                        >
                          Shop {brand.name}
                        </span>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: isHovered ? brand.accentColor : 'transparent',
                            border: `1px solid ${isHovered ? brand.accentColor : 'var(--border-default)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.25s ease',
                          }}
                        >
                          <ArrowRight
                            size={14}
                            style={{
                              color: isHovered ? '#fff' : 'var(--text-muted)',
                              transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                              transition: 'all 0.25s ease',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </article>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        .brands-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }
        @media (min-width: 1024px) {
          .brands-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 640px) {
          .brands-grid { grid-template-columns: 1fr; gap: 16px; }
        }
      `}</style>
    </>
  );
}
