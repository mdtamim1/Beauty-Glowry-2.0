import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, X, ArrowRight, Sparkles } from 'lucide-react';
import { products } from '../data/products';
import DropletGlyph from './DropletGlyph';

const LiveSearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.actives || []).some(a => a.name.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectResult = (productId) => {
    onClose();
    navigate(`/product/${productId}`);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)' }} />

      {/* Search Header Container */}
      <div style={{ position: 'relative', width: '100%', background: '#FFFFFF', padding: '24px 0', borderBottom: '1px solid var(--border-champagne)', zIndex: 1001, boxShadow: 'var(--shadow-lg)' }}>
        <div className="container" style={{ maxWidth: '800px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Search size={24} color="var(--obsidian-emerald)" />
            <input 
              type="text"
              placeholder="Type an active ingredient (e.g., Niacinamide, Salicylic Acid, Vitamin C)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flexGrow: 1,
                border: 'none',
                fontSize: '18px',
                fontWeight: 500,
                color: 'var(--velvet-charcoal)',
                background: 'transparent'
              }}
              autoFocus
            />
            <button onClick={onClose} aria-label="Close search" style={{ padding: '8px' }}>
              <X size={24} color="var(--slate-muted)" />
            </button>
          </div>

          {/* Quick Tags */}
          {!query && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--slate-muted)', fontWeight: 600 }}>POPULAR ACTIVES:</span>
              {['Niacinamide 10%', 'Salicylic Acid BHA', 'Vitamin C 15%', 'Centella Asiatica', 'Ceramides'].map((tag, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuery(tag)}
                  style={{
                    fontSize: '12px',
                    padding: '4px 10px',
                    borderRadius: '16px',
                    background: 'var(--rose-gold-light)',
                    color: 'var(--rose-gold)',
                    border: '1px solid rgba(197, 155, 39, 0.25)',
                    fontWeight: 500
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Instant Search Results */}
          {searchResults.length > 0 && (
            <div style={{ marginTop: '24px', borderTop: '1px solid var(--border-champagne)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--slate-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                MATCHING FORMULATIONS ({searchResults.length})
              </div>

              {searchResults.map(prod => (
                <div
                  key={prod.id}
                  onClick={() => handleSelectResult(prod.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    transition: 'var(--transition)',
                    background: '#FFFFFF'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--silk-background)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#FFFFFF'}
                >
                  <img src={prod.image} alt={prod.name} style={{ width: '54px', height: '54px', objectFit: 'cover', borderRadius: '6px' }} />
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--velvet-charcoal)' }}>{prod.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--slate-muted)' }}>{prod.category}</div>
                  </div>
                  <span className="font-mono" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--obsidian-emerald)' }}>
                    ৳{prod.price}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default LiveSearchModal;
