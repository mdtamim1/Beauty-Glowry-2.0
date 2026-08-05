'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { products } from '../data/products';

interface LiveSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LiveSearch({ isOpen, onClose }: LiveSearchProps) {
  const [query, setQuery] = useState('');
  const [dbProducts, setDbProducts] = useState<typeof products>([]);
  const [results, setResults] = useState<typeof products>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDbProducts(data);
          setResults(data.slice(0, 4));
        }
      })
      .catch((err) => console.error('Failed to fetch live products for search:', err));
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(dbProducts.slice(0, 4));
      return;
    }
    const q = query.toLowerCase();
    setResults(
      dbProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.description && p.description.toLowerCase().includes(q))
      ).slice(0, 6)
    );
  }, [query, dbProducts]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [query, results]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?search=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < results.length) {
        router.push(`/product/${results[activeIndex].id}`);
        onClose();
      } else if (query.trim()) {
        router.push(`/products?search=${encodeURIComponent(query.trim())}`);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="animate-fade-in"
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(26,26,24,0.5)', backdropFilter: 'blur(6px)' }}
      />
      <div
        className="animate-scale-in live-search-modal"
        style={{
          position: 'fixed',
          top: '10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: 680,
          zIndex: 90,
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 4,
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(26,26,24,0.2)',
        }}
      >
        {/* Search Input Form */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <button
            type="submit"
            aria-label="Search"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Search size={20} />
          </button>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search formulations, actives, concerns..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: 16,
              color: 'var(--text-primary)',
              background: 'transparent',
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <button
            type="button"
            onClick={onClose}
            style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </form>

        {/* Results */}
        <div className="live-search-results-container" style={{ maxHeight: 480, overflowY: 'auto' }}>
          {results.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
              No results found for "{query}"
            </div>
          ) : (
            <>
              <div
                style={{
                  padding: '12px 24px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                {query ? `Results for "${query}"` : 'Popular Formulations'}
              </div>
              {results.map((product, idx) => (
                <Link
                  key={product.id}
                  href={`/product/${product.id}`}
                  onClick={onClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 24px',
                    textDecoration: 'none',
                    transition: 'background 0.15s',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: idx === activeIndex ? 'var(--bg-elevated)' : 'transparent',
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 3,
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{product.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{product.category}</p>
                  </div>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'var(--accent)',
                      flexShrink: 0,
                    }}
                  >
                    ৳{product.price.toLocaleString()}
                  </span>
                </Link>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 24px',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Use ↑↓ to navigate, Enter to select</span>
          <Link
            href={query ? `/products?search=${encodeURIComponent(query)}` : '/products'}
            onClick={onClose}
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--accent)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .live-search-modal {
            top: 0 !important;
            left: 0 !important;
            bottom: 0 !important;
            right: 0 !important;
            transform: none !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 100vh !important;
            border-radius: 0 !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .live-search-results-container {
            max-height: none !important;
            flex: 1 !important;
            overflow-y: auto !important;
          }
        }
      `}</style>
    </>
  );
}
