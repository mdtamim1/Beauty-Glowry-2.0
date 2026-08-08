'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { SlidersHorizontal, X, Grid3X3, List, ChevronDown, Search } from 'lucide-react';
import { products, skinConcerns, categories, Product } from '../../data/products';
import ProductCard from '../../components/ProductCard';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

type SortOption = 'popularity' | 'price-low' | 'price-high' | 'rating' | 'newest';

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [dbProducts, setDbProducts] = useState<Product[]>([]);
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
        console.error('Failed to fetch live products:', err);
        setLoaded(true);
      });
  }, []);

  const displayProducts = dbProducts;

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

  // Helper to sync category/concern filter changes into browser URL query string for SEO & shareability
  const updateUrlParams = (cats: string[], concs: string[]) => {
    const params = new URLSearchParams();
    if (cats.length > 0) params.set('category', cats[0]);
    if (concs.length > 0) params.set('concern', concs[0]);
    const queryString = params.toString();
    const target = queryString ? `${pathname}?${queryString}` : pathname;
    router.replace(target, { scroll: false });
  };

  const handleCategoryToggle = (cat: string) => {
    const next = toggleFilter(selectedCategories, cat);
    setSelectedCategories(next);
    setPage(1);
    updateUrlParams(next, selectedConcerns);
  };

  const handleConcernToggle = (concernName: string) => {
    const next = toggleFilter(selectedConcerns, concernName);
    setSelectedConcerns(next);
    setPage(1);
    updateUrlParams(selectedCategories, next);
  };

  // SEO Dynamic Heading Title
  const pageTitle = useMemo(() => {
    if (selectedCategories.length > 0 && selectedConcerns.length > 0) {
      return `${selectedCategories.join(', ')} for ${selectedConcerns.join(', ')}`;
    }
    if (selectedCategories.length > 0) {
      return `${selectedCategories.join(', ')} Formulations`;
    }
    if (selectedConcerns.length > 0) {
      return `${selectedConcerns.join(', ')} Care & Treatments`;
    }
    return 'All Formulations';
  }, [selectedCategories, selectedConcerns]);

  // SEO Dynamic Subtitle
  const pageSubtitle = useMemo(() => {
    if (selectedCategories.length > 0) {
      return `Explore clean, dermatologist-formulated ${selectedCategories.join(', ').toLowerCase()} engineered for clinical results.`;
    }
    if (selectedConcerns.length > 0) {
      return `Targeted clinical treatments formulated to effectively address ${selectedConcerns.join(', ').toLowerCase()}.`;
    }
    return 'Dermatologist-formulated active treatments for measurable skin transformation.';
  }, [selectedCategories, selectedConcerns]);

  // Sync client-side document title for SEO
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.title = pageTitle === 'All Formulations'
        ? 'Clinical Skincare Products Catalog | BEAUTY GLOWRY'
        : `${pageTitle} | BEAUTY GLOWRY`;
    }
  }, [pageTitle]);

  const filteredProducts = useMemo(() => {
    let result = [...displayProducts];

    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }
    if (selectedConcerns.length > 0) {
      result = result.filter((p) =>
        (p.concerns || []).some((c) =>
          selectedConcerns.some((scName) => {
            const concernObj = skinConcerns.find((sc) => sc.name === scName);
            return concernObj ? c === concernObj.tag : false;
          })
        )
      );
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
  }, [displayProducts, selectedCategories, selectedConcerns, selectedSkinTypes, maxPrice, sortBy]);

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
    updateUrlParams([], []);
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

  const SidebarContent = () => (
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
            onClick={() => handleCategoryToggle(cat)}
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
            onClick={() => handleConcernToggle(c.name)}
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://beautyglowry.com';

  // Dynamically generate CollectionPage schema for the products page
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: pageTitle,
    description: pageSubtitle,
    url: `${baseUrl}/products`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: filteredProducts.map((p, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `${baseUrl}/product/${p.id}`,
        name: p.name,
      })),
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${baseUrl}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Products',
        item: `${baseUrl}/products`,
      },
      ...(selectedCategories.length > 0 ? [{
        '@type': 'ListItem',
        position: 3,
        name: selectedCategories[0],
        item: `${baseUrl}/products?category=${encodeURIComponent(selectedCategories[0])}`,
      }] : []),
    ],
  };

  return (
    <>
      <Navbar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
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
              {pageTitle}
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', maxWidth: 560 }}>
              {pageSubtitle}
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
              {/* View toggle */}
              <div
                style={{
                  display: 'flex',
                  border: '1px solid var(--border-default)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '6px 10px',
                    background: viewMode === 'grid' ? 'var(--bg-elevated)' : 'transparent',
                    border: 'none',
                    color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                  title="Grid View"
                >
                  <Grid3X3 size={15} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '6px 10px',
                    background: viewMode === 'list' ? 'var(--bg-elevated)' : 'transparent',
                    border: 'none',
                    color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                  title="List View"
                >
                  <List size={15} />
                </button>
              </div>

              {/* Sort dropdown */}
              <div style={{ position: 'relative' }}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  style={{
                    appearance: 'none',
                    padding: '7px 28px 7px 12px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 2,
                    cursor: 'pointer',
                    outline: 'none',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  <option value="popularity">Bestsellers First</option>
                  <option value="newest">Newest Arrivals</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
                <ChevronDown
                  size={13}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="container-lg products-main-grid">
          {/* Desktop Sidebar */}
          <aside className="products-desktop-sidebar">
            <SidebarContent />
          </aside>

          {/* Product Grid / List */}
          <main style={{ minHeight: 400 }}>
            {activeFilterCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  marginBottom: 20,
                }}
              >
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Active filters:</span>
                {selectedCategories.map((c) => (
                  <span key={c} className="tag-filter-active">
                    {c}
                    <button onClick={() => handleCategoryToggle(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
                {selectedConcerns.map((c) => (
                  <span key={c} className="tag-filter-active">
                    {c}
                    <button onClick={() => handleConcernToggle(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
                {selectedSkinTypes.map((st) => (
                  <span key={st} className="tag-filter-active">
                    {st}
                    <button onClick={() => setSelectedSkinTypes((p) => p.filter((x) => x !== st))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
                <button
                  onClick={clearAll}
                  style={{
                    fontSize: 11,
                    color: 'var(--accent)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Clear all
                </button>
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '80px 20px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 4,
                }}
              >
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 24,
                    color: 'var(--text-secondary)',
                    marginBottom: 12,
                  }}
                >
                  No matching formulations found
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
                  Try adjusting your filter selection or price range.
                </p>
                <button onClick={clearAll} className="btn-accent" style={{ padding: '10px 24px' }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                <div className={viewMode === 'grid' ? 'products-grid' : 'products-list'}>
                  {paginated.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 48,
                    }}
                  >
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        style={{
                          width: 36,
                          height: 36,
                          fontSize: 13,
                          fontWeight: 600,
                          color: page === i + 1 ? '#FFF' : 'var(--text-primary)',
                          background: page === i + 1 ? 'var(--accent)' : 'var(--bg-surface)',
                          border: `1px solid ${page === i + 1 ? 'var(--accent)' : 'var(--border-default)'}`,
                          borderRadius: 2,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 90,
              background: 'rgba(0,0,0,0.6)',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: 300,
              zIndex: 100,
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border-default)',
              padding: 24,
              overflowY: 'auto',
              boxShadow: '4px 0 24px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 24,
                paddingBottom: 16,
                borderBottom: '1px solid var(--border-default)',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Filters
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent />
          </div>
        </>
      )}

      <Footer />
    </>
  );
}

export default function ProductsPage() {
  return (
    <React.Suspense fallback={
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading formulations catalog...</p>
      </div>
    }>
      <ProductsContent />
    </React.Suspense>
  );
}
