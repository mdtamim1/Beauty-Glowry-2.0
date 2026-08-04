'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ArrowRight, GitCompare, Trash2 } from 'lucide-react';
import { useCartStore } from '../store/useCartStore';
import { products as localProducts } from '../data/products';

export default function CompareTray() {
  const { compareList, removeFromCompare, clearCompare } = useCartStore();
  const [dbProducts, setDbProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDbProducts(data);
        } else {
          setDbProducts(localProducts);
        }
      })
      .catch(() => {
        setDbProducts(localProducts);
      });
  }, []);

  if (!compareList || compareList.length === 0) return null;

  // Resolve compared products
  const selectedProducts = compareList
    .map(id => dbProducts.find(p => String(p.id) === String(id)))
    .filter(Boolean);

  const canCompare = selectedProducts.length >= 2;

  return (
    <div style={{
      position: 'fixed',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: 720,
      background: 'rgba(20, 16, 12, 0.9)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: 20,
      padding: '14px 20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.05)',
      zIndex: 9999,
      animation: 'compare-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      flexWrap: 'wrap',
    }}
      className="compare-tray-responsive"
    >
      {/* Products list */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 280 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(201, 149, 109, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--accent)', flexShrink: 0
        }}>
          <GitCompare size={18} />
        </div>
        
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {selectedProducts.map((p: any) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '4px 8px 4px 6px',
                borderRadius: 10,
                border: '1px solid rgba(255, 255, 255, 0.05)',
                position: 'relative',
              }}
            >
              <img
                src={p.image}
                alt={p.name}
                style={{ width: 28, height: 28, borderRadius: 6, objectFit: 'cover', background: '#333' }}
              />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#fcfaf7', maxWidth: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </span>
              <button
                onClick={() => removeFromCompare(String(p.id))}
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          
          {selectedProducts.length < 3 && (
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.4)',
              border: '1.5px dashed rgba(255,255,255,0.15)',
              padding: '6px 12px', borderRadius: 10,
              display: 'flex', alignItems: 'center', height: 24, boxSizing: 'border-box'
            }}>
              + Add product
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          onClick={clearCompare}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 4, transition: 'color 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#ff6b6b'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >
          <Trash2 size={13} /> Clear
        </button>

        {canCompare ? (
          <Link
            href="/compare"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              padding: '8px 18px',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 700,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 4px 12px rgba(201, 149, 109, 0.3)',
              transition: 'transform 0.2s, opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.03)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            Compare Now <ArrowRight size={13} />
          </Link>
        ) : (
          <div style={{
            background: 'rgba(255, 255, 255, 0.05)',
            color: 'rgba(255,255,255,0.3)',
            padding: '8px 18px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
            cursor: 'not-allowed',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            Select {2 - selectedProducts.length} more
          </div>
        )}
      </div>

      <style>{`
        @keyframes compare-slide-up {
          from { transform: translate(-50%, 100px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
        @media (max-width: 640px) {
          .compare-tray-responsive {
            width: 94% !important;
            border-radius: 16px !important;
            padding: 10px 14px !important;
            bottom: 10px !important;
          }
        }
      `}</style>
    </div>
  );
}
