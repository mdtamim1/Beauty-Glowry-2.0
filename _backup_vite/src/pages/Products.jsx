import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, Grid, List, Search, X, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import DropletGlyph from '../components/DropletGlyph';
import { useProducts } from '../context/ProductContext';
import { categories as defaultCategories, skinConcerns } from '../data/products';

const Products = () => {
  const { products, loading } = useProducts();
  const [searchParams] = useSearchParams();
  
  const selectedCategoryParam = searchParams.get('category') || 'All';
  const selectedConcernParam = searchParams.get('concern') || 'All';
  const searchQueryParam = searchParams.get('search') || '';

  const [activeCategory, setActiveCategory] = useState(selectedCategoryParam);
  const [activeConcern, setActiveConcern] = useState(selectedConcernParam);
  const [activeSkinType, setActiveSkinType] = useState('All');
  const [maxPrice, setMaxPrice] = useState(3000);
  const [searchQuery, setSearchQuery] = useState(searchQueryParam);
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');

  const skinTypes = ['All', 'Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'];

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      // Price Filter
      if (product.price > maxPrice) return false;
      // Category filter
      if (activeCategory !== 'All' && !product.category?.toLowerCase().includes(activeCategory.toLowerCase())) {
        return false;
      }
      // Concern filter
      if (activeConcern !== 'All' && !(product.concerns || []).some(c => c.toLowerCase().includes(activeConcern.toLowerCase()))) {
        return false;
      }
      // Skin Type filter
      if (activeSkinType !== 'All' && !(product.skinTypes || []).some(s => s.toLowerCase().includes(activeSkinType.toLowerCase()))) {
        return false;
      }
      // Search Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesCat = product.category.toLowerCase().includes(query);
        const matchesActive = (product.actives || []).some(a => a.name.toLowerCase().includes(query));
        if (!matchesName && !matchesCat && !matchesActive) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
      return (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0);
    });
  }, [products, activeCategory, activeConcern, activeSkinType, maxPrice, searchQuery, sortBy]);

  return (
    <div style={{ padding: '40px 0 80px', minHeight: '85vh', background: 'var(--silk-background)' }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ marginBottom: '36px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <DropletGlyph size={14} color="var(--obsidian-emerald)" />
            <span className="font-mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--obsidian-emerald)', textTransform: 'uppercase' }}>
              DERMATOLOGICAL FORMULATION CATALOG
            </span>
          </div>
          <h1 className="font-editorial" style={{ fontSize: '40px', color: 'var(--velvet-charcoal)' }}>
            Clinical Actives & Formulations
          </h1>
          <p style={{ color: 'var(--slate-muted)', fontSize: '15px' }}>
            Filter by skin concern, price range, and active ingredient percentage.
          </p>
        </div>

        {/* Filter Controls Panel */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid var(--border-champagne)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          marginBottom: '36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          
          {/* Row 1: Search + Sort + View */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ flexGrow: 1, maxWidth: '380px', position: 'relative' }}>
              <Search size={18} color="var(--slate-muted)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
              <input 
                type="text" 
                placeholder="Filter by active (e.g. Niacinamide, BHA)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 42px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-champagne)',
                  fontSize: '14px',
                  background: 'var(--silk-background)'
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)' }}>
                  <X size={16} color="var(--slate-muted)" />
                </button>
              )}
            </div>

            {/* Price Slider Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '13px', color: 'var(--slate-muted)', fontWeight: 600 }}>Max Price:</span>
              <input 
                type="range" 
                min="500" 
                max="3000" 
                step="100" 
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                style={{ accentColor: 'var(--obsidian-emerald)', cursor: 'pointer' }}
              />
              <span className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--obsidian-emerald)' }}>
                ৳{maxPrice}
              </span>
            </div>

            {/* Sort & Grid Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', color: 'var(--slate-muted)', fontWeight: 500 }}>Sort by:</span>
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-champagne)',
                    fontSize: '14px',
                    background: '#FFFFFF',
                    color: 'var(--velvet-charcoal)'
                  }}
                >
                  <option value="featured">Bestsellers First</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Highest Rating</option>
                </select>
              </div>

              <div style={{ display: 'flex', background: 'var(--silk-background)', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-champagne)' }}>
                <button onClick={() => setViewMode('grid')} style={{ padding: '6px 10px', borderRadius: '4px', background: viewMode === 'grid' ? '#FFFFFF' : 'transparent' }}>
                  <Grid size={16} />
                </button>
                <button onClick={() => setViewMode('list')} style={{ padding: '6px 10px', borderRadius: '4px', background: viewMode === 'list' ? '#FFFFFF' : 'transparent' }}>
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Category Filter Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', paddingTop: '12px', borderTop: '1px solid var(--border-champagne)' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--velvet-charcoal)', marginRight: '8px' }}>Category:</span>
            {['All', ...defaultCategories].map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setActiveCategory(cat === activeCategory ? 'All' : cat)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '20px',
                  fontSize: '13px',
                  fontWeight: 500,
                  background: activeCategory.toLowerCase().includes(cat.toLowerCase()) && cat !== 'All' ? 'var(--obsidian-emerald)' : activeCategory === 'All' && cat === 'All' ? 'var(--obsidian-emerald)' : 'var(--silk-background)',
                  color: (activeCategory.toLowerCase().includes(cat.toLowerCase()) && cat !== 'All') || (activeCategory === 'All' && cat === 'All') ? '#FFFFFF' : 'var(--velvet-charcoal)',
                  border: '1px solid var(--border-champagne)'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Row 3: Skin Concern Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--velvet-charcoal)', marginRight: '8px' }}>Skin Concern:</span>
            {['All', ...skinConcerns.map(c => c.name)].map((concern, idx) => (
              <button
                key={idx}
                onClick={() => setActiveConcern(concern)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 500,
                  background: activeConcern === concern ? 'var(--rose-gold-light)' : 'transparent',
                  color: activeConcern === concern ? 'var(--rose-gold)' : 'var(--slate-muted)',
                  border: activeConcern === concern ? '1px solid var(--rose-gold)' : '1px solid var(--border-champagne)'
                }}
              >
                {concern}
              </button>
            ))}
          </div>

        </div>

        {/* Results Counter */}
        <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="font-mono" style={{ fontSize: '13px', color: 'var(--slate-muted)' }}>
            SHOWING <strong>{filteredProducts.length}</strong> CLINICAL FORMULATIONS
          </span>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--slate-muted)' }}>
            Loading precision formulations...
          </div>
        ) : filteredProducts.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(260px, 1fr))' : '1fr',
            gap: '28px'
          }}>
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-champagne)' }}>
            <DropletGlyph size={32} color="var(--slate-muted)" />
            <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--velvet-charcoal)', marginTop: '16px', marginBottom: '8px' }}>
              No Formulations Match Your Filter Criteria
            </h3>
            <p style={{ color: 'var(--slate-muted)', fontSize: '14px', marginBottom: '24px' }}>
              Try adjusting your price slider or resetting concern filters.
            </p>
            <button
              onClick={() => { setActiveCategory('All'); setActiveConcern('All'); setActiveSkinType('All'); setMaxPrice(3000); setSearchQuery(''); }}
              style={{ background: 'var(--obsidian-emerald)', color: '#FFFFFF', padding: '12px 24px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}
            >
              Reset All Filters
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Products;
