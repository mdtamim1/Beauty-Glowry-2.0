'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ArrowRight, Search, Star, Package, ChevronRight } from 'lucide-react';
import { brands as staticBrands, products as staticProducts } from '../../data/products';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

// ── Brand accent gradients ────────────────────────────────────────────────────
const BRAND_GRADIENTS: Record<string, string> = {
  'beauty-glowry': 'linear-gradient(135deg, #1a0d00 0%, #3d1f00 40%, #c9956d 100%)',
  'dermalab':       'linear-gradient(135deg, #001a10 0%, #023d22 40%, #4caf82 100%)',
  'pureact':        'linear-gradient(135deg, #00061a 0%, #02174a 40%, #60a5fa 100%)',
  'luminos':        'linear-gradient(135deg, #1a0d00 0%, #4a2700 40%, #f0a54b 100%)',
};

const DEFAULT_GRADIENT = 'linear-gradient(135deg, #0f0c08 0%, #2a1f14 40%, #c9956d 100%)';

export default function BrandsPage() {
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbBrands, setDbBrands]     = useState<any[]>([]);
  const [loaded, setLoaded]         = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredId, setHoveredId]   = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/brands').then(r => r.json()),
    ])
      .then(([prods, brnds]) => {
        if (Array.isArray(prods))  setDbProducts(prods);
        if (Array.isArray(brnds)) setDbBrands(brnds);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const activeBrands = dbBrands.length > 0 ? dbBrands : staticBrands;

  const brandsData = useMemo(() => {
    return activeBrands.map(brand => {
      const st = staticBrands.find(s => s.id === brand.id);
      const prods = dbProducts.filter(p => p.brand === brand.id);
      return {
        id: brand.id,
        name: brand.name,
        tagline: st?.tagline || brand.tagline || 'Dermatological Excellence',
        description: brand.description || st?.description || '',
        logo: brand.logo || st?.logo || '✦',
        coverImage: st?.coverImage || brand.coverImage || 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=1600&auto=format&fit=crop',
        country: st?.country || brand.country || 'International',
        founded: st?.founded || brand.founded || '2024',
        accentColor: st?.accentColor || brand.accentColor || '#C9956D',
        gradient: BRAND_GRADIENTS[brand.id] || DEFAULT_GRADIENT,
        productCount: prods.length,
        productsList: prods,
        topRating: prods.length > 0
          ? Math.max(...prods.map(p => p.rating || 0))
          : null,
      };
    });
  }, [activeBrands, dbProducts]);

  const filtered = useMemo(() => {
    if (!searchTerm) return brandsData;
    const q = searchTerm.toLowerCase();
    return brandsData.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.tagline.toLowerCase().includes(q) ||
      b.country.toLowerCase().includes(q)
    );
  }, [brandsData, searchTerm]);

  const totalProducts = dbProducts.length;

  return (
    <>
      <Navbar />

      {/* ══ HERO ═══════════════════════════════════════════════════════════════ */}
      <div className="bh-hero" ref={heroRef}>
        {/* Background grid of brand images */}
        <div className="bh-hero-bg-grid" aria-hidden>
          {brandsData.slice(0, 4).map((b, i) => (
            <div
              key={b.id}
              className="bh-hero-bg-cell"
              style={{ backgroundImage: `url(${b.coverImage})` }}
            />
          ))}
        </div>
        <div className="bh-hero-veil" />

        <div className="container-lg bh-hero-inner">
          <p className="bh-eyebrow">Our Skincare Partners</p>
          <h1 className="bh-hero-title">
            Brands you can<br />
            <em>trust &amp; love</em>
          </h1>
          <p className="bh-hero-sub">
            Curated clinical skincare houses — each selected for ingredient integrity,
            proven efficacy, and measurable skin transformation.
          </p>

          {/* Stats strip */}
          <div className="bh-stats-strip">
            {[
              { n: brandsData.length, l: 'Clinical Brands' },
              { n: totalProducts,     l: 'Formulations' },
              { n: new Set(brandsData.map(b => b.country)).size, l: 'Countries' },
            ].map(({ n, l }) => (
              <div key={l} className="bh-stat">
                <span className="bh-stat-n">{n}</span>
                <span className="bh-stat-l">{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Floating search bar */}
        <div className="bh-search-float">
          <div className="bh-search-wrap">
            <Search size={16} className="bh-search-icon" />
            <input
              type="text"
              placeholder="Search brands, origins…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="bh-search-input"
            />
            {searchTerm && (
              <button className="bh-search-clear" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>
          <span className="bh-search-count">
            {filtered.length} brand{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* ══ BRAND CARDS GRID ═══════════════════════════════════════════════════ */}
      <section className="bh-section">
        <div className="container-lg">
          {filtered.length === 0 ? (
            <div className="bh-empty">
              <Package size={40} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
              <h3>No brands match "{searchTerm}"</h3>
              <button className="btn-outline" style={{ marginTop: 16, padding: '10px 24px', fontSize: 13 }}
                onClick={() => setSearchTerm('')}>
                Clear Search
              </button>
            </div>
          ) : (
            <div className="bh-grid">
              {filtered.map((brand, idx) => {
                const isHov = hoveredId === brand.id;
                return (
                  <Link
                    key={brand.id}
                    href={`/brands/${brand.id}`}
                    className="bh-card-link"
                    onMouseEnter={() => setHoveredId(brand.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <article
                      className={`bh-card bh-card-${(idx % 4 === 0 || idx % 4 === 3) ? 'wide' : 'narrow'}`}
                      style={{
                        '--brand-color': brand.accentColor,
                        boxShadow: isHov
                          ? `0 32px 80px ${brand.accentColor}28, 0 8px 28px rgba(0,0,0,0.16)`
                          : '0 2px 12px rgba(0,0,0,0.04)',
                        transform: isHov ? 'translateY(-8px)' : 'none',
                      } as React.CSSProperties}
                    >
                      {/* ── Cover image with gradient overlay */}
                      <div className="bh-card-cover">
                        <div
                          className="bh-card-cover-img"
                          style={{
                            backgroundImage: `url(${brand.coverImage})`,
                            transform: isHov ? 'scale(1.07)' : 'scale(1)',
                          }}
                        />
                        {/* Dark gradient base */}
                        <div
                          className="bh-card-cover-grad"
                          style={{ background: brand.gradient }}
                        />
                        {/* Soft veil */}
                        <div className="bh-card-cover-veil" />

                        {/* ── Top badges */}
                        <div className="bh-card-top-row">
                          <span className="bh-card-origin">
                            {brand.country}
                          </span>
                          {brand.productCount > 0 && (
                            <span className="bh-card-count-badge">
                              {brand.productCount} products
                            </span>
                          )}
                        </div>

                        {/* ── Brand name block (over image) */}
                        <div className="bh-card-name-block">
                          <span
                            className="bh-card-logo-glyph"
                            style={{ color: brand.accentColor }}
                          >
                            {brand.logo}
                          </span>
                          <h2 className="bh-card-name">{brand.name}</h2>
                          <p
                            className="bh-card-tagline"
                            style={{ color: brand.accentColor }}
                          >
                            {brand.tagline}
                          </p>
                        </div>
                      </div>

                      {/* ── Card body */}
                      <div className="bh-card-body">
                        <p className="bh-card-desc">{brand.description}</p>

                        {/* Product thumbnail strip */}
                        {brand.productsList.length > 0 && (
                          <div className="bh-card-prods">
                            <span className="bh-card-prods-label">Featured</span>
                            <div className="bh-card-prods-strip">
                              {brand.productsList.slice(0, 4).map(p => (
                                <div key={p.id} className="bh-prod-thumb">
                                  <img src={p.image} alt={p.name} />
                                </div>
                              ))}
                              {brand.productsList.length > 4 && (
                                <div className="bh-prod-thumb bh-prod-more">
                                  +{brand.productsList.length - 4}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Bottom CTA */}
                        <div className="bh-card-cta">
                          <div className="bh-card-meta">
                            {brand.topRating && (
                              <span className="bh-card-rating">
                                <Star size={11} style={{ fill: '#C9956D', color: '#C9956D' }} />
                                {brand.topRating.toFixed(1)}
                              </span>
                            )}
                            <span className="bh-card-since">Est. {brand.founded}</span>
                          </div>
                          <span
                            className="bh-card-explore"
                            style={{ color: isHov ? brand.accentColor : 'var(--text-primary)' }}
                          >
                            Explore
                            <span
                              className="bh-card-arrow"
                              style={{ background: isHov ? brand.accentColor : 'var(--bg-elevated)' }}
                            >
                              <ArrowRight size={13} style={{ color: isHov ? '#fff' : 'var(--text-muted)' }} />
                            </span>
                          </span>
                        </div>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ══ BOTTOM TRUST STRIP ════════════════════════════════════════════════ */}
      <section className="bh-trust">
        <div className="container-lg bh-trust-inner">
          <p className="bh-trust-label">Why our brands?</p>
          {[
            { icon: '🔬', h: 'Clinically Tested', s: 'Every formula validated with independent dermatological trials.' },
            { icon: '🌿', h: 'Clean Actives',     s: 'No harmful additives — just potent, effective ingredients.' },
            { icon: '📋', h: 'Full Transparency', s: 'Complete INCI lists and concentration disclosure.' },
            { icon: '🌍', h: 'Global Sourcing',   s: 'Ingredients sourced from certified labs worldwide.' },
          ].map(({ icon, h, s }) => (
            <div key={h} className="bh-trust-item">
              <span className="bh-trust-icon">{icon}</span>
              <strong className="bh-trust-h">{h}</strong>
              <p className="bh-trust-s">{s}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />

      <style>{`
        /* ══ HERO ═══════════════════════════════════════════════════════════ */
        .bh-hero {
          position: relative;
          min-height: 520px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          overflow: hidden;
          background: var(--text-primary);
          padding-bottom: 56px;
        }

        .bh-hero-bg-grid {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        .bh-hero-bg-cell {
          background-size: cover;
          background-position: center;
          opacity: 0.22;
        }
        .bh-hero-veil {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(26,26,24,0.5) 0%,
            rgba(26,26,24,0.82) 60%,
            rgba(26,26,24,0.96) 100%
          );
        }

        .bh-hero-inner {
          position: relative;
          z-index: 2;
          padding-top: 100px;
        }

        .bh-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--accent);
          margin-bottom: 16px;
        }

        .bh-hero-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(40px, 6vw, 72px);
          font-weight: 400;
          color: var(--bg-base);
          line-height: 1.08;
          margin-bottom: 20px;
        }
        .bh-hero-title em {
          font-style: italic;
          color: var(--accent);
        }

        .bh-hero-sub {
          font-size: 15px;
          color: rgba(250,247,242,0.55);
          line-height: 1.7;
          max-width: 500px;
          margin-bottom: 40px;
        }

        /* Stats strip */
        .bh-stats-strip {
          display: flex;
          gap: 0;
        }
        .bh-stat {
          display: flex;
          flex-direction: column;
          padding: 16px 32px 16px 0;
          margin-right: 32px;
          border-right: 1px solid rgba(250,247,242,0.12);
        }
        .bh-stat:last-child { border-right: none; margin-right: 0; }
        .bh-stat-n {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 36px;
          font-weight: 600;
          color: var(--accent);
          line-height: 1;
        }
        .bh-stat-l {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(250,247,242,0.4);
          margin-top: 4px;
        }

        /* Floating search */
        .bh-search-float {
          position: relative;
          z-index: 10;
          margin-top: 0;
          background: var(--bg-surface);
          border-top: 1px solid var(--border-default);
          padding: 16px 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          padding-left: max(32px, calc((100% - 1240px) / 2 + 32px));
          padding-right: max(32px, calc((100% - 1240px) / 2 + 32px));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .bh-search-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-base);
          border: 1px solid var(--border-default);
          border-radius: 99px;
          padding: 10px 18px;
          flex: 1;
          max-width: 400px;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .bh-search-wrap:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(201,149,109,0.12);
        }
        .bh-search-icon { color: var(--text-muted); flex-shrink: 0; }
        .bh-search-input {
          flex: 1;
          border: none;
          background: transparent;
          font-family: 'DM Sans', sans-serif;
          font-size: 13.5px;
          color: var(--text-primary);
          outline: none;
        }
        .bh-search-input::placeholder { color: var(--text-muted); }
        .bh-search-clear {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 12px;
          padding: 2px 4px;
          line-height: 1;
          transition: color 0.15s;
        }
        .bh-search-clear:hover { color: var(--text-primary); }
        .bh-search-count {
          font-size: 12px;
          color: var(--text-muted);
          font-family: 'DM Mono', monospace;
          white-space: nowrap;
        }

        /* ══ BRAND GRID SECTION ════════════════════════════════════════════ */
        .bh-section {
          background: var(--bg-base);
          padding: 64px 0 100px;
        }

        /* Masonry-style: alternating wide/narrow */
        .bh-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        /* Every 4th card (0-indexed 0 and 3) spans 2 cols — makes mosaic pattern */
        .bh-card-wide  { grid-column: span 2; }
        .bh-card-narrow { grid-column: span 1; }

        .bh-card-link {
          text-decoration: none;
          color: inherit;
          display: block;
          height: 100%;
        }

        .bh-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 20px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-height: 460px;
          transition:
            transform 0.45s cubic-bezier(0.16,1,0.3,1),
            box-shadow 0.45s cubic-bezier(0.16,1,0.3,1),
            border-color 0.3s ease;
        }
        .bh-card:hover {
          border-color: rgba(201,149,109,0.35);
        }

        /* ── Cover */
        .bh-card-cover {
          position: relative;
          height: 240px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .bh-card-wide .bh-card-cover { height: 280px; }

        .bh-card-cover-img {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transition: transform 0.65s cubic-bezier(0.16,1,0.3,1);
        }
        .bh-card-cover-grad {
          position: absolute;
          inset: 0;
          opacity: 0.72;
          mix-blend-mode: multiply;
        }
        .bh-card-cover-veil {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(0,0,0,0.08) 0%,
            rgba(0,0,0,0.55) 70%,
            rgba(0,0,0,0.82) 100%
          );
        }

        /* Top badges */
        .bh-card-top-row {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          z-index: 4;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .bh-card-origin {
          font-size: 9.5px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: rgba(250,247,242,0.7);
          background: rgba(0,0,0,0.35);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 4px 10px;
          border-radius: 99px;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .bh-card-count-badge {
          font-size: 9.5px;
          font-weight: 700;
          color: rgba(250,247,242,0.8);
          background: rgba(201,149,109,0.35);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          padding: 4px 10px;
          border-radius: 99px;
          border: 1px solid rgba(201,149,109,0.3);
        }

        /* Brand name block over cover */
        .bh-card-name-block {
          position: absolute;
          bottom: 20px;
          left: 22px;
          right: 22px;
          z-index: 4;
        }
        .bh-card-logo-glyph {
          font-size: 22px;
          line-height: 1;
          display: block;
          margin-bottom: 6px;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.4));
        }
        .bh-card-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px;
          font-weight: 700;
          color: #FAF7F2;
          line-height: 1.1;
          margin: 0 0 5px;
          letter-spacing: 0.01em;
          text-shadow: 0 2px 16px rgba(0,0,0,0.4);
        }
        .bh-card-wide .bh-card-name { font-size: 34px; }
        .bh-card-tagline {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin: 0;
          opacity: 0.9;
        }

        /* ── Card body */
        .bh-card-body {
          padding: 22px 22px 20px;
          display: flex;
          flex-direction: column;
          flex: 1;
          gap: 0;
        }

        .bh-card-desc {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.65;
          margin-bottom: 18px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Product thumbnails */
        .bh-card-prods {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
          padding-bottom: 18px;
          border-bottom: 1px solid var(--border-subtle);
        }
        .bh-card-prods-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .bh-card-prods-strip {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .bh-prod-thumb {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border-default);
          background: var(--bg-elevated);
          flex-shrink: 0;
          transition: all 0.2s ease;
        }
        .bh-prod-thumb:hover { transform: translateY(-2px); border-color: var(--accent); }
        .bh-prod-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .bh-prod-more {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          color: var(--text-muted);
          background: var(--bg-elevated);
          border: 1px dashed var(--border-default);
        }

        /* CTA row */
        .bh-card-cta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
        }
        .bh-card-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .bh-card-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11.5px;
          font-weight: 700;
          color: var(--text-secondary);
          font-family: 'DM Mono', monospace;
        }
        .bh-card-since {
          font-size: 10.5px;
          color: var(--text-muted);
          font-family: 'DM Mono', monospace;
        }
        .bh-card-explore {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          transition: color 0.25s ease;
        }
        .bh-card-arrow {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
          border: 1px solid var(--border-default);
        }

        /* ══ EMPTY STATE ═══════════════════════════════════════════════════ */
        .bh-empty {
          text-align: center;
          padding: 80px 24px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 20px;
        }
        .bh-empty h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 22px;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        /* ══ TRUST STRIP ═══════════════════════════════════════════════════ */
        .bh-trust {
          background: var(--bg-surface);
          border-top: 1px solid var(--border-default);
          padding: 56px 0;
        }
        .bh-trust-inner {
          display: grid;
          grid-template-columns: auto repeat(4, 1fr);
          gap: 0 40px;
          align-items: start;
        }
        .bh-trust-label {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--text-muted);
          padding-right: 40px;
          border-right: 1px solid var(--border-default);
          align-self: center;
          white-space: nowrap;
        }
        .bh-trust-item {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .bh-trust-icon {
          font-size: 22px;
          margin-bottom: 4px;
        }
        .bh-trust-h {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-primary);
        }
        .bh-trust-s {
          font-size: 12px;
          color: var(--text-muted);
          line-height: 1.55;
        }

        /* ══ RESPONSIVE ════════════════════════════════════════════════════ */
        @media (max-width: 1024px) {
          .bh-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .bh-card-wide, .bh-card-narrow { grid-column: span 1; }
          .bh-trust-inner {
            grid-template-columns: 1fr 1fr;
            gap: 32px;
          }
          .bh-trust-label {
            grid-column: span 2;
            border-right: none;
            padding-right: 0;
            border-bottom: 1px solid var(--border-default);
            padding-bottom: 16px;
          }
        }

        /* ── TABLET ──────────────────────────────────────── */
        @media (max-width: 768px) {
          .bh-hero { min-height: 320px; padding-bottom: 16px; }
          .bh-hero-inner { padding-top: 72px; }
          .bh-hero-bg-grid { grid-template-columns: repeat(2, 1fr); }
          .bh-hero-sub { display: none; }
          .bh-stats-strip { gap: 0; }
          .bh-stat { padding: 10px 16px 10px 0; margin-right: 16px; }
          .bh-stat-n { font-size: 24px; }
          .bh-search-float {
            padding-left: 16px;
            padding-right: 16px;
            flex-wrap: wrap;
            gap: 10px;
          }
          .bh-search-wrap { max-width: 100%; }
          .bh-section { padding: 20px 0 56px; }

          /* 2-column compact image tiles */
          .bh-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }
          .bh-card-wide, .bh-card-narrow { grid-column: span 1; }

          /* Card becomes a pure image tile on mobile */
          .bh-card {
            min-height: 0;
            border-radius: 14px;
          }
          /* Cover fills the entire card */
          .bh-card-cover {
            height: 165px;
            border-radius: 14px;
          }
          /* Hide text body below image */
          .bh-card-body { display: none; }

          /* Tighten name block */
          .bh-card-name-block {
            bottom: 12px;
            left: 12px;
            right: 12px;
          }
          .bh-card-logo-glyph { font-size: 15px; margin-bottom: 2px; }
          .bh-card-name { font-size: 18px !important; }
          .bh-card-tagline { font-size: 8px; letter-spacing: 0.1em; }

          /* Smaller badges */
          .bh-card-top-row { top: 10px; left: 10px; right: 10px; }
          .bh-card-origin { font-size: 8px; padding: 3px 7px; }
          .bh-card-count-badge { font-size: 8px; padding: 3px 7px; }

          /* Trust */
          .bh-trust { padding: 40px 0; }
          .bh-trust-inner { grid-template-columns: 1fr 1fr; gap: 20px; }
          .bh-trust-label {
            grid-column: span 2;
            border-right: none;
            padding-right: 0;
            border-bottom: 1px solid var(--border-default);
            padding-bottom: 12px;
          }
        }

        /* ── MOBILE SM ─────────────────────────────────────── */
        @media (max-width: 480px) {
          .bh-hero-title { font-size: 30px; }
          .bh-stats-strip { flex-wrap: wrap; gap: 0; }
          .bh-stat { padding: 8px 0; margin: 0; flex: 0 0 50%; }
          .bh-stat:nth-child(odd) {
            border-right: 1px solid rgba(250,247,242,0.12);
            padding-right: 16px;
          }

          /* Slightly smaller tiles */
          .bh-grid { gap: 8px; }
          .bh-card-cover { height: 150px; }

          /* Trust 1 col */
          .bh-trust-inner { grid-template-columns: 1fr; gap: 16px; }
          .bh-trust-label { grid-column: span 1; }
        }
      `}</style>
    </>
  );
}

