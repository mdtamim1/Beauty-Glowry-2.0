'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X, Grid3X3, List, ChevronDown, Search } from 'lucide-react';
import { products, skinConcerns, categories, Product } from '../../data/products';
import ProductCard from '../../components/ProductCard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

type SortOption = 'popularity' | 'price-low' | 'price-high' | 'rating' | 'newest';

function ProductsContent() {
  const searchParams = useSearchParams();

  const [dbProducts, setDbProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDbProducts(data);
        }
      })
      .catch((err) => console.error('Failed to fetch live products:', err));
  }, []);

  const displayProducts = dbProducts.length > 0 ? dbProducts : products;

  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const cat = searchParams.get('category');
    return cat ? [decodeURIComponent(cat)] : [];
  });
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(() => {
    const c = searchParams.get('concern');
    return c ? [decodeURIComponent(c)] : [];
  });
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 9;

  const skinTypes = ['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal', 'All Skin Types'];

  const filteredProducts = useMemo(() => {
    let result = [...displayProducts];

    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }
    if (selectedConcerns.length > 0) {
      result = result.filter((p) => p.concerns.some((c) => selectedConcerns.some((sc) => c.includes(sc.split(' ')[0]))));
    }
    if (selectedSkinTypes.length > 0) {
      result = result.filter((p) => p.skinTypes.some((st) => selectedSkinTypes.includes(st)));
    }
    result = result.filter((p) => p.price <= maxPrice);

    switch (sortBy) {
      case 'price-low': result.sort((a, b) => a.price - b.price); break;
      case 'price-high': result.sort((a, b) => b.price - a.price); break;
      case 'rating': result.sort((a, b) => b.rating - a.rating); break;
      case 'newest': result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0)); break;
      default: result.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0)); break;
    }

    return result;
  }, [selectedCategories, selectedConcerns, selectedSkinTypes, maxPrice, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / PER_PAGE);
  const paginated = filteredProducts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggleFilter = (arr: string[], val: string): string[] =>
    arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

  const clearAll = () => {
    setSelectedCategories([]);
    setSelectedConcerns([]);
    setSelectedSkinTypes([]);
    setMaxPrice(5000);
    setPage(1);
  };

  const activeFilterCount = selectedCategories.length + selectedConcerns.length + selectedSkinTypes.length;

  const FilterButton = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '8px 10px',
        fontSize: 13,
        fontWeight: active ? 600 : 400,
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        background: active ? 'rgba(201,149,109,0.08)' : 'transparent',
        border: 'none',
        borderRadius: 2,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--text-secondary)'; }}
    >
      {label}
      {active && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--accent)',
            display: 'inline-block',
          }}
        />
      )}
    </button>
  );

  const Sidebar = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Category */}
      <div>
        <h3
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 12,
          }}
        >
          Product Type
        </h3>
        {categories.map((cat) => (
          <FilterButton
            key={cat}
            label={cat}
            active={selectedCategories.includes(cat)}
            onClick={() => { setSelectedCategories((p) => toggleFilter(p, cat)); setPage(1); }}
          />
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--border-default)' }} />

      {/* Skin Concern */}
      <div>
        <h3
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 12,
          }}
        >
          Skin Concern
        </h3>
        {skinConcerns.map((c) => (
          <FilterButton
            key={c.id}
            label={c.name}
            active={selectedConcerns.includes(c.name)}
            onClick={() => { setSelectedConcerns((p) => toggleFilter(p, c.name)); setPage(1); }}
          />
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--border-default)' }} />

      {/* Skin Type */}
      <div>
        <h3
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 12,
          }}
        >
          Skin Type
        </h3>
        {skinTypes.map((t) => (
          <FilterButton
            key={t}
            label={t}
            active={selectedSkinTypes.includes(t)}
            onClick={() => { setSelectedSkinTypes((p) => toggleFilter(p, t)); setPage(1); }}
          />
        ))}
      </div>

      <div style={{ height: 1, background: 'var(--border-default)' }} />

      {/* Price Range */}
      <div>
        <h3
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-muted)',
            marginBottom: 12,
          }}
        >
          Max Price
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>৳0</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent)', fontFamily: "'DM Mono', monospace" }}>৳{maxPrice.toLocaleString()}</span>
        </div>
        <input
          type="range"
          min={500}
          max={5000}
          step={100}
          value={maxPrice}
          onChange={(e) => { setMaxPrice(Number(e.target.value)); setPage(1); }}
          style={{ width: '100%', accentColor: 'var(--accent)' }}
        />
      </div>

      {activeFilterCount > 0 && (
        <button onClick={clearAll} className="btn-outline" style={{ fontSize: 12, padding: '10px 20px' }}>
          Clear All Filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '80vh', paddingTop: 24, background: 'var(--bg-base)' }}>
        {/* Page Header */}
        <div
          style={{
            borderBottom: '1px solid var(--border-default)',
            background: 'var(--bg-surface)',
            padding: '48px 0 40px',
          }}
        >
          <div className="container-lg">
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: 12,
              }}
            >
              Clinical Collection
            </p>
            <h1
              className="font-editorial products-page-title"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 400,
                color: 'var(--text-primary)',
                lineHeight: 1.05,
                marginBottom: 12,
              }}
            >
              All Formulations
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 560 }}>
              Dermatologist-formulated active treatments for measurable skin transformation.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="products-toolbar-wrap">
          <div className="container-lg products-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="products-filter-btn"
              >
                <SlidersHorizontal size={14} />
                Filters
                {activeFilterCount > 0 && (
                  <span
                    style={{
                      background: 'var(--accent)',
                      color: '#FFF',
                      fontSize: 10,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {filteredProducts.length} results
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                style={{
                  padding: '6px 12px',
                  background: 'none',
                  border: '1px solid var(--border-default)',
                  borderRadius: 2,
                  fontSize: 12,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <option value="popularity">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest First</option>
              </select>

              <div className="view-toggle">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`view-toggle-btn${viewMode === 'grid' ? ' view-toggle-active' : ''}`}
                >
                  <Grid3X3 size={15} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`view-toggle-btn${viewMode === 'list' ? ' view-toggle-active' : ''}`}
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="mobile-sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="container-lg" style={{ paddingTop: 40, paddingBottom: 80 }}>
          <div style={{ display: 'flex', gap: 40 }}>
            {/* Sidebar — desktop inline, mobile drawer */}
            <div className={`products-sidebar${sidebarOpen ? ' products-sidebar-open' : ''}`}>
              <div className="products-sidebar-inner">
                {/* Mobile close button */}
                <div className="sidebar-mobile-header">
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Filters</span>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                  >
                    <X size={20} style={{ color: 'var(--text-secondary)' }} />
                  </button>
                </div>
                <Sidebar />
                {/* Mobile apply button */}
                <div className="sidebar-mobile-footer">
                  <button onClick={() => setSidebarOpen(false)} className="btn-accent" style={{ width: '100%', justifyContent: 'center' }}>
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>

            {/* Products */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {paginated.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '80px 20px',
                    border: '1px solid var(--border-default)',
                    borderRadius: 4,
                    background: 'var(--bg-surface)',
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      background: 'var(--bg-elevated)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 20px',
                    }}
                  >
                    <Search size={24} style={{ color: 'var(--text-muted)' }} />
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: 24,
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      marginBottom: 8,
                    }}
                  >
                    No formulations found
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>Try adjusting your filters</p>
                  <button onClick={clearAll} className="btn-outline">
                    Clear All Filters
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="products-grid">
                  {paginated.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {paginated.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        gap: 24,
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border-default)',
                        borderRadius: 4,
                        overflow: 'hidden',
                        transition: 'all 0.25s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--border-dark)')}
                      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-default)')}
                    >
                      <div
                        style={{
                          width: 200,
                          flexShrink: 0,
                          background: 'var(--bg-elevated)',
                          overflow: 'hidden',
                        }}
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 160 }}
                        />
                      </div>
                      <div style={{ padding: '24px 24px 24px 0', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          {p.actives.length > 0 && (
                            <span className="badge-active" style={{ marginBottom: 10, display: 'inline-block' }}>
                              {p.actives[0].name} {p.actives[0].concentration}{p.actives[0].unit}
                            </span>
                          )}
                          <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>{p.name}</h3>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{p.description.slice(0, 120)}...</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20 }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
                            ৳{p.price.toLocaleString()}
                          </span>
                          <ProductCard product={p} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 48 }}>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => { setPage(i + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: page === i + 1 ? 'var(--text-primary)' : 'var(--border-default)',
                        background: page === i + 1 ? 'var(--text-primary)' : 'transparent',
                        color: page === i + 1 ? 'var(--bg-base)' : 'var(--text-secondary)',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />

      <style>{`
        /* ── Page title ─────────────────────────────────── */
        .products-page-title { font-size: 52px; }

        /* ── Toolbar ──────────────────────────────────── */
        .products-toolbar-wrap {
          border-bottom: 1px solid var(--border-default);
          background: var(--bg-surface);
          position: sticky;
          top: 64px;
          z-index: 20;
        }
        .products-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 52px;
          gap: 12px;
          flex-wrap: wrap;
          padding-top: 8px;
          padding-bottom: 8px;
        }
        .products-filter-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: none;
          border: 1px solid var(--border-default);
          border-radius: 2px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .view-toggle {
          display: flex;
          border: 1px solid var(--border-default);
          border-radius: 2px;
          overflow: hidden;
        }
        .view-toggle-btn {
          padding: 6px 10px;
          background: transparent;
          border: none;
          cursor: pointer;
          color: var(--text-muted);
        }
        .view-toggle-active {
          background: var(--text-primary);
          color: var(--bg-base);
        }

        /* ── Sidebar ──────────────────────────────────── */
        .products-sidebar {
          width: 220px;
          flex-shrink: 0;
          display: none;
        }
        .products-sidebar.products-sidebar-open {
          display: block;
        }
        .products-sidebar-inner {
          position: sticky;
          top: 128px;
        }
        .sidebar-mobile-header { display: none; }
        .sidebar-mobile-footer { display: none; }
        .mobile-sidebar-overlay { display: none; }

        /* ── Products grid ────────────────────────────── */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }

        /* ═══════════════════════════════════════════════════
           TABLET — 900px
        ═══════════════════════════════════════════════════ */
        @media (max-width: 900px) {
          .products-page-title { font-size: 38px; }
          .products-grid { grid-template-columns: repeat(2, 1fr); }
        }

        /* ═══════════════════════════════════════════════════
           MOBILE — 768px: sidebar becomes drawer
        ═══════════════════════════════════════════════════ */
        @media (max-width: 768px) {
          .products-page-title { font-size: 30px; }

          /* Sidebar becomes a bottom sheet / side drawer */
          .products-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 300px;
            z-index: 80;
            background: var(--bg-surface);
            border-right: 1px solid var(--border-default);
            overflow-y: auto;
            transform: translateX(-100%);
            transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
            display: block !important;
          }
          .products-sidebar.products-sidebar-open {
            transform: translateX(0);
          }
          .products-sidebar-inner {
            position: static;
            padding: 0 24px 32px;
          }
          .sidebar-mobile-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 20px 0 16px;
            margin-bottom: 24px;
            border-bottom: 1px solid var(--border-default);
          }
          .sidebar-mobile-footer {
            display: block;
            margin-top: 24px;
            padding-top: 20px;
            border-top: 1px solid var(--border-default);
          }
          .mobile-sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            z-index: 70;
            background: rgba(26,26,24,0.5);
          }
          .products-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }

        /* ═══════════════════════════════════════════════════
           SMALL MOBILE — 420px
        ═══════════════════════════════════════════════════ */
        @media (max-width: 420px) {
          .products-grid { grid-template-columns: 1fr; }
          .products-sidebar { width: 100vw; }
        }
      `}</style>
    </>
  );
}

export default function ProductsPage() {
  return (
    <React.Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-base)' }} />}>
      <ProductsContent />
    </React.Suspense>
  );
}
