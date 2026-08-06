'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Package, MapPin, Calendar, Search, Globe, Sparkles, SlidersHorizontal } from 'lucide-react';
import { brands as staticBrands, products as staticProducts } from '../../data/products';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function BrandsPage() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [dbBrands, setDbBrands] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((res) => res.json()),
      fetch('/api/brands').then((res) => res.json())
    ])
      .then(([productsData, brandsData]) => {
        if (Array.isArray(productsData)) setDbProducts(productsData);
        if (Array.isArray(brandsData)) setDbBrands(brandsData);
        setLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load data for brands page:', err);
        setLoaded(true);
      });
  }, []);

  const activeBrands = dbBrands.length > 0 ? dbBrands : staticBrands;

  const brandsWithCount = useMemo(() => {
    return activeBrands.map((brand) => {
      // Find fallback info from static brands if database lacks them
      const staticMatch = staticBrands.find((sb) => sb.id === brand.id);
      return {
        id: brand.id,
        name: brand.name,
        logo: brand.logo || staticMatch?.logo || '✦',
        tagline: staticMatch?.tagline || 'Dermatological Formulations',
        description: brand.description || staticMatch?.description || 'Precision formulations engineered for skin efficiency.',
        coverImage: staticMatch?.coverImage || 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=1600&auto=format&fit=crop',
        country: staticMatch?.country || 'International',
        founded: staticMatch?.founded || '2024',
        accentColor: staticMatch?.accentColor || '#C9956D',
        productCount: dbProducts.filter((p) => p.brand === brand.id).length,
        productsList: dbProducts.filter((p) => p.brand === brand.id),
      };
    });
  }, [activeBrands, dbProducts]);

  // Unique countries for filtering
  const countries = useMemo(() => {
    const list = brandsWithCount.map((b) => b.country);
    return ['All', ...Array.from(new Set(list))];
  }, [brandsWithCount]);

  // Filtered brands
  const filteredBrands = useMemo(() => {
    return brandsWithCount.filter((brand) => {
      const matchesSearch = brand.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        brand.tagline.toLowerCase().includes(searchTerm.toLowerCase()) ||
        brand.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = selectedCountry === 'All' || brand.country === selectedCountry;
      return matchesSearch && matchesCountry;
    });
  }, [brandsWithCount, searchTerm, selectedCountry]);

  // Stats computation
  const stats = useMemo(() => {
    const uniqueCountries = new Set(brandsWithCount.map(b => b.country)).size;
    return {
      totalBrands: brandsWithCount.length,
      regions: uniqueCountries,
      totalProducts: dbProducts.length
    };
  }, [brandsWithCount, dbProducts]);

  return (
    <>
      <Navbar />

      {/* ── Page Header & Stats Banner ─────────────────────────────────────────── */}
      <div className="brands-hero">
        <div className="container-lg brands-hero-content">
          <div className="brands-title-block">
            <span className="brands-badge">
              <Sparkles size={12} style={{ color: 'var(--accent)' }} /> CLINICAL PARTNERS
            </span>
            <h1 className="brands-heading">Our Skincare Houses</h1>
            <p className="brands-subtitle">
              Science-first dermatological formulators selected for clinical potency, clean actives, and measurable skin transformation.
            </p>
          </div>

          {/* Stats boxes */}
          <div className="brands-stats-row">
            <div className="brand-stat-box">
              <span className="brand-stat-num">{stats.totalBrands}</span>
              <span className="brand-stat-label">Active Brands</span>
            </div>
            <div className="brand-stat-box">
              <span className="brand-stat-num">{stats.regions}</span>
              <span className="brand-stat-label">Origin Countries</span>
            </div>
            <div className="brand-stat-box">
              <span className="brand-stat-num">{stats.totalProducts}</span>
              <span className="brand-stat-label">Formulations</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Row ────────────────────────────────────────────────── */}
      <div className="brands-filter-section">
        <div className="container-lg brands-filter-row">
          {/* Search bar */}
          <div className="brands-search-wrapper">
            <Search size={16} className="brands-search-icon" />
            <input
              type="text"
              placeholder="Search clinical brand..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="brands-search-input"
            />
          </div>

          {/* Country filter tags */}
          <div className="brands-tags-group">
            <span className="filter-label">
              <Globe size={13} /> Country:
            </span>
            <div className="brands-tags-scroll">
              {countries.map((country) => (
                <button
                  key={country}
                  onClick={() => setSelectedCountry(country)}
                  className={`brand-filter-tag ${selectedCountry === country ? 'active' : ''}`}
                >
                  {country}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Brand Grid ─────────────────────────────────────────────────────────── */}
      <div className="brands-main-content">
        <div className="container-lg">
          {filteredBrands.length === 0 ? (
            <div className="brands-empty-state">
              <Package size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <h3>No Brands Found</h3>
              <p>Try refining your search terms or clearing the country filter.</p>
              {(searchTerm || selectedCountry !== 'All') && (
                <button
                  onClick={() => { setSearchTerm(''); setSelectedCountry('All'); }}
                  className="btn-outline"
                  style={{ marginTop: 16, padding: '8px 20px', fontSize: 13 }}
                >
                  Reset Filters
                </button>
              )}
            </div>
          ) : (
            <div className="brands-custom-grid">
              {filteredBrands.map((brand) => {
                const isHovered = hoveredId === brand.id;
                return (
                  <Link
                    key={brand.id}
                    href={`/brands/${brand.id}`}
                    className="brand-card-link"
                    onMouseEnter={() => setHoveredId(brand.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    <article
                      className="brand-card"
                      style={{
                        borderColor: isHovered ? brand.accentColor : 'var(--border-default)',
                        boxShadow: isHovered
                          ? `0 30px 70px ${brand.accentColor}18, 0 8px 32px rgba(0,0,0,0.12)`
                          : '0 4px 16px rgba(0,0,0,0.02)',
                        transform: isHovered ? 'translateY(-6px)' : 'translateY(0)',
                      }}
                    >
                      {/* Card Cover Banner */}
                      <div className="brand-card-banner">
                        <div
                          className="brand-card-cover-bg"
                          style={{
                            backgroundImage: `url(${brand.coverImage})`,
                            transform: isHovered ? 'scale(1.08)' : 'scale(1)',
                          }}
                        />
                        <div className="brand-card-overlay" />
                        
                        {/* Circle logo over banner */}
                        <div
                          className="brand-card-logo-circle"
                          style={{
                            borderColor: brand.accentColor,
                            background: `rgba(28,28,25,0.85)`,
                            transform: isHovered ? 'scale(1.1) translateY(-6px)' : 'scale(1) translateY(0)',
                          }}
                        >
                          {brand.logo}
                        </div>
                      </div>

                      {/* Card Info Content */}
                      <div className="brand-card-body">
                        <div className="brand-card-meta-top">
                          <span className="brand-card-country">
                            <MapPin size={12} /> {brand.country}
                          </span>
                          <span className="brand-card-year">
                            <Calendar size={12} /> Est. {brand.founded}
                          </span>
                        </div>

                        <h2 className="brand-card-title">{brand.name}</h2>
                        
                        <p className="brand-card-tagline" style={{ color: brand.accentColor }}>
                          {brand.tagline}
                        </p>
                        
                        <p className="brand-card-desc">{brand.description}</p>

                        {/* Key formulations (product thumbnails) */}
                        {brand.productsList.length > 0 && (
                          <div className="brand-card-products">
                            <p className="brand-card-products-title">
                              Featured Formulations ({brand.productCount})
                            </p>
                            <div className="brand-card-products-row">
                              {brand.productsList.slice(0, 3).map((prod) => (
                                <Link
                                  key={prod.id}
                                  href={`/product/${prod.id}`}
                                  onClick={(e) => e.stopPropagation()} // prevent outer Link click
                                  className="brand-mini-product-link"
                                  title={prod.name}
                                >
                                  <img src={prod.image} alt={prod.name} className="brand-mini-product-img" />
                                </Link>
                              ))}
                              {brand.productsList.length > 3 && (
                                <div className="brand-mini-product-more">
                                  +{brand.productsList.length - 3}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Bottom CTA Row */}
                        <div className="brand-card-cta-row" style={{ marginTop: brand.productsList.length > 0 ? 20 : 'auto' }}>
                          <span
                            className="brand-card-cta-text"
                            style={{
                              color: isHovered ? brand.accentColor : 'var(--text-primary)',
                            }}
                          >
                            Explore Formulations
                          </span>
                          <div
                            className="brand-card-arrow-circle"
                            style={{
                              background: isHovered ? brand.accentColor : 'transparent',
                              borderColor: isHovered ? brand.accentColor : 'var(--border-default)',
                            }}
                          >
                            <ArrowRight
                              size={14}
                              style={{
                                color: isHovered ? '#fff' : 'var(--text-muted)',
                                transform: isHovered ? 'translateX(3px)' : 'translateX(0)',
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
          )}
        </div>
      </div>

      <Footer />

      <style>{`
        /* Immersive Hero styling */
        .brands-hero {
          background: linear-gradient(to bottom, var(--bg-surface) 0%, var(--bg-base) 100%);
          border-bottom: 1px solid var(--border-default);
          padding: 80px 0 64px;
          position: relative;
        }

        .brands-hero-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 40px;
        }

        .brands-title-block {
          flex: 1;
          max-width: 600px;
        }

        .brands-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          color: var(--accent);
          background: rgba(201, 149, 109, 0.08);
          padding: 6px 14px;
          border-radius: 99px;
          margin-bottom: 16px;
          border: 1px solid rgba(201, 149, 109, 0.15);
        }

        .brands-heading {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(34px, 5.5vw, 52px);
          font-weight: 400;
          color: var(--text-primary);
          line-height: 1.1;
          margin-bottom: 14px;
        }

        .brands-subtitle {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.65;
        }

        .brands-stats-row {
          display: flex;
          gap: 16px;
          flex-shrink: 0;
        }

        .brand-stat-box {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          padding: 16px 24px;
          min-width: 130px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }

        .brand-stat-num {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 32px;
          font-weight: 700;
          color: var(--accent);
          line-height: 1.1;
        }

        .brand-stat-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-top: 4px;
        }

        /* Filter section */
        .brands-filter-section {
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-default);
          padding: 16px 0;
          position: sticky;
          top: 0;
          z-index: 10;
          backdrop-filter: blur(12px);
          background: rgba(255, 255, 255, 0.85);
        }
        .dark .brands-filter-section {
          background: rgba(28, 28, 25, 0.85);
        }

        .brands-filter-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .brands-search-wrapper {
          position: relative;
          width: 320px;
          display: flex;
          align-items: center;
        }

        .brands-search-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
        }

        .brands-search-input {
          width: 100%;
          padding: 10px 14px 10px 38px;
          background: var(--bg-base);
          border: 1px solid var(--border-default);
          border-radius: 99px;
          font-size: 13.5px;
          color: var(--text-primary);
          outline: none;
          transition: all 0.2s ease;
        }

        .brands-search-input:focus {
          border-color: var(--accent);
          background: var(--bg-surface);
          box-shadow: 0 0 0 4px rgba(201, 149, 109, 0.1);
        }

        .brands-tags-group {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: hidden;
        }

        .filter-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 5px;
          flex-shrink: 0;
        }

        .brands-tags-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 4px 0;
        }

        .brands-tags-scroll::-webkit-scrollbar {
          display: none;
        }

        .brand-filter-tag {
          padding: 6px 16px;
          border-radius: 99px;
          border: 1px solid var(--border-default);
          background: transparent;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .brand-filter-tag:hover {
          color: var(--text-primary);
          border-color: var(--text-secondary);
        }

        .brand-filter-tag.active {
          background: var(--text-primary);
          color: var(--bg-base);
          border-color: var(--text-primary);
        }

        /* Main Grid Content */
        .brands-main-content {
          background: var(--bg-base);
          padding: 56px 0 100px;
        }

        .brands-custom-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 32px;
        }

        @media (min-width: 640px) {
          .brands-custom-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 28px;
          }
        }

        @media (min-width: 1024px) {
          .brands-custom-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 32px;
          }
        }

        .brand-card-link {
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .brand-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: 100%;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .brand-card-banner {
          position: relative;
          height: 130px;
          overflow: hidden;
          background: var(--bg-elevated);
        }

        .brand-card-cover-bg {
          position: absolute;
          inset: 0;
          background-size: cover;
          background-position: center;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .brand-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%);
        }

        .brand-card-logo-circle {
          position: absolute;
          bottom: -24px;
          left: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 700;
          color: #FAF7F2;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 2;
        }

        .brand-card-body {
          padding: 38px 24px 24px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .brand-card-meta-top {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 11px;
          color: var(--text-muted);
          margin-bottom: 12px;
        }

        .brand-card-country, .brand-card-year {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 500;
        }

        .brand-card-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.2;
          margin-bottom: 4px;
        }

        .brand-card-tagline {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }

        .brand-card-desc {
          font-size: 13.5px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 16px;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Card Products Section */
        .brand-card-products {
          border-top: 1px dashed var(--border-default);
          padding-top: 14px;
          margin-top: auto;
        }

        .brand-card-products-title {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin-bottom: 8px;
        }

        .brand-card-products-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .brand-mini-product-link {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 1px solid var(--border-default);
          overflow: hidden;
          background: var(--bg-base);
          display: block;
          transition: all 0.2s ease;
        }

        .brand-mini-product-link:hover {
          transform: translateY(-2px);
          border-color: var(--accent);
        }

        .brand-mini-product-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .brand-mini-product-more {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          border: 1px dashed var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-muted);
          background: var(--bg-base);
        }

        /* Card CTA row */
        .brand-card-cta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 14px;
        }

        .brand-card-cta-text {
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          transition: color 0.2s ease;
        }

        .brand-card-arrow-circle {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          border: 1px solid var(--border-default);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.25s ease;
        }

        .brands-empty-state {
          text-align: center;
          padding: 60px 20px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 16px;
        }

        .brands-empty-state h3 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
        }

        .brands-empty-state p {
          font-size: 14px;
          color: var(--text-muted);
        }

        /* ── Mobile Responsive Overrides ────────────────────────────────────── */
        @media (max-width: 768px) {
          .brands-hero {
            padding: 48px 0 40px;
          }

          .brands-hero-content {
            flex-direction: column;
            align-items: flex-start;
            gap: 24px;
          }

          .brands-stats-row {
            width: 100%;
            overflow-x: auto;
            padding-bottom: 6px;
          }

          .brand-stat-box {
            flex: 1;
            padding: 12px 16px;
            min-width: 100px;
          }

          .brand-stat-num {
            font-size: 26px;
          }

          .brands-filter-row {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
          }

          .brands-search-wrapper {
            width: 100%;
          }

          .brands-tags-group {
            width: 100%;
          }

          .brands-main-content {
            padding: 32px 0 64px;
          }
        }
      `}</style>
    </>
  );
}
