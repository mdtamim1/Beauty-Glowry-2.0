'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Heart, Star, Zap, Check, GitCompare } from 'lucide-react';
import { Product, brands } from '../data/products';
import { useCartStore } from '../store/useCartStore';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=1000&auto=format&fit=crop';

interface ProductCardProps {
  product: Product;
  onQuickView?: () => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { addToCart, toggleWishlist, isInWishlist, setBuyNow, addToCompare, removeFromCompare, isInCompare } = useCartStore();
  const router = useRouter();

  const imgRef = useRef<HTMLImageElement>(null);
  const productImage = product.image || FALLBACK_IMAGE;

  useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      setImageLoaded(true);
    }
  }, [productImage]);

  const inWishlist = isInWishlist(product.id.toString());
  const inCompare = isInCompare(product.id.toString());
  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id.toString());
  };

  const handleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(product.id.toString());
    } else {
      addToCompare(product.id.toString());
    }
  };

  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBuyNow({
      id: `${product.id}-default`,
      product: {
        id: String(product.id),
        name: product.name,
        image: productImage,
        price: product.price,
        discount_price: product.originalPrice > product.price ? product.price : undefined,
      },
      quantity: 1,
    });
    router.push('/checkout?mode=buynow');
  };

  const brand = product.brand ? brands.find(b => b.id === product.brand) : null;

  return (
    <div
      className="pc-root"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ══ IMAGE BLOCK ══════════════════════════════════════ */}
      <div className="pc-img-section">
        <Link href={`/product/${product.id}`} className="pc-img-link">
          <div className="pc-img-wrap">

            {/* Skeleton */}
            {!imageLoaded && <div className="pc-skeleton" />}

            <img
              ref={imgRef}
              src={productImage}
              alt={product.name}
              loading="lazy"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(true)}
              className={`pc-img${hovered ? ' pc-img-zoom' : ''}`}
            />

            {/* Bottom gradient overlay */}
            <div className={`pc-overlay${hovered ? ' pc-overlay-deep' : ''}`} />

            {/* ── Top-left badges */}
            <div className="pc-badges">
              {product.isBestseller && (
                <span className="pc-badge pc-badge-bestseller">★ Best</span>
              )}
              {product.isNew && (
                <span className="pc-badge pc-badge-new">New</span>
              )}
              {product.isFreeDelivery && (
                <span className="pc-badge pc-badge-free">Free</span>
              )}
            </div>

            {/* ── Discount badge — top-right corner */}
            {discount > 0 && (
              <div className="pc-discount-badge">
                −{discount}%
              </div>
            )}

            {/* ── Action bar slides up on hover */}
            <div className={`pc-action-bar${hovered ? ' pc-action-bar-visible' : ''}`}>
              <button
                onClick={handleAddToCart}
                className={`pc-btn-bag${isAdded ? ' pc-btn-bag-added' : ''}`}
              >
                {isAdded
                  ? <><Check size={11} /><span>Added!</span></>
                  : <><ShoppingBag size={11} /><span>Add</span></>
                }
              </button>
              <div className="pc-btn-sep" />
              <button
                onClick={handleOrderNow}
                className="pc-btn-buy"
              >
                <Zap size={11} />
                <span>Buy Now</span>
              </button>
            </div>

          </div>
        </Link>

        {/* ── Wishlist */}
        <button
          onClick={handleWishlist}
          aria-label="Wishlist"
          className={`pc-wishlist${inWishlist ? ' pc-wishlist-on' : ''}`}
        >
          <Heart
            size={12}
            style={{ fill: inWishlist ? '#fff' : 'none', color: '#fff', transition: 'all 0.2s' }}
          />
        </button>

        {/* ── Compare */}
        <button
          onClick={handleCompare}
          aria-label="Compare"
          className={`pc-compare${inCompare ? ' pc-compare-on' : ''}`}
        >
          <GitCompare size={12} style={{ color: '#fff', transition: 'all 0.25s' }} />
        </button>
      </div>

      {/* ══ CONTENT BLOCK ════════════════════════════════════ */}
      <div className="pc-body">

        {/* Brand + Stars row */}
        <div className="pc-meta-row">
          {brand ? (
            <Link href={`/brands/${product.brand}`} className="pc-brand">
              {brand.name}
            </Link>
          ) : (
            <span className="pc-brand-empty" />
          )}
          <div className="pc-stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={8}
                style={{
                  fill: i < Math.round(product.rating) ? '#C9956D' : 'none',
                  color: i < Math.round(product.rating) ? '#C9956D' : 'var(--border-dark,#C8BFB5)',
                  flexShrink: 0,
                }}
              />
            ))}
            <span className="pc-rating-text">{product.rating}</span>
          </div>
        </div>

        {/* Name */}
        <Link href={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
          <h3 className="pc-name">{product.name}</h3>
        </Link>

        {/* Active ingredient pill */}
        {product.actives.length > 0 && (
          <div className="pc-active">
            <span className="pc-active-dot" />
            {product.actives[0].name} {product.actives[0].concentration}{product.actives[0].unit}
          </div>
        )}

        <div className="pc-spacer" />

        {/* Price row */}
        <div className="pc-price-row">
          <div className="pc-prices">
            <span className="pc-price">৳{product.price.toLocaleString()}</span>
            {discount > 0 && (
              <span className="pc-price-was">৳{product.originalPrice.toLocaleString()}</span>
            )}
          </div>
          {product.size && <span className="pc-size-tag">{product.size}</span>}
        </div>

      </div>

      <style>{`
        /* ═══ ROOT ═══════════════════════════════════════════ */
        .pc-root {
          position: relative;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          width: 100%;
          transition:
            border-color 0.35s ease,
            box-shadow 0.45s cubic-bezier(0.16,1,0.3,1),
            transform 0.45s cubic-bezier(0.16,1,0.3,1);
        }
        .pc-root:hover {
          border-color: rgba(201,149,109,0.45);
          box-shadow:
            0 0 0 1px rgba(201,149,109,0.12),
            0 16px 48px rgba(26,26,24,0.12),
            0 4px 16px rgba(201,149,109,0.1);
          transform: translateY(-4px);
        }

        /* ═══ IMAGE SECTION ═══════════════════════════════════ */
        .pc-img-section {
          position: relative;
          flex-shrink: 0;
        }

        /* ═══ IMAGE ══════════════════════════════════════════ */
        .pc-img-link {
          display: block;
          position: relative;
          text-decoration: none;
        }
        .pc-img-wrap {
          position: relative;
          width: 100%;
          aspect-ratio: 1 / 1;
          background: var(--bg-elevated);
          overflow: hidden;
        }
        .pc-skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            var(--bg-elevated) 25%,
            rgba(201,149,109,0.06) 50%,
            var(--bg-elevated) 75%
          );
          background-size: 200% 100%;
          animation: pc-shimmer 1.4s infinite;
          z-index: 1;
        }
        @keyframes pc-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .pc-img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.65s cubic-bezier(0.16,1,0.3,1);
          will-change: transform;
        }
        .pc-img-zoom { transform: scale(1.07); }

        /* Bottom gradient overlay */
        .pc-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            transparent 40%,
            rgba(15,12,10,0.6) 100%
          );
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
          z-index: 5;
        }
        .pc-overlay-deep { opacity: 1; }

        /* ═══ BADGES ═════════════════════════════════════════ */
        .pc-badges {
          position: absolute;
          top: 8px;
          left: 8px;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .pc-badge {
          display: inline-block;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3px 7px;
          border-radius: 99px;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          font-family: 'DM Sans', sans-serif;
          line-height: 1;
        }
        .pc-badge-bestseller {
          background: rgba(18,14,10,0.75);
          color: #F5EFE8;
          border: 1px solid rgba(255,255,255,0.12);
        }
        .pc-badge-new {
          background: linear-gradient(135deg,rgba(139,157,119,0.9),rgba(107,125,87,0.9));
          color: #fff;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .pc-badge-free {
          background: linear-gradient(135deg,rgba(60,165,120,0.88),rgba(40,140,100,0.88));
          color: #fff;
          border: 1px solid rgba(255,255,255,0.15);
        }

        /* Discount badge */
        .pc-discount-badge {
          position: absolute;
          top: 8px;
          right: 42px;
          z-index: 10;
          background: linear-gradient(135deg, var(--accent,#C9956D), #c07a50);
          color: #fff;
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: 0.04em;
          padding: 3px 8px;
          border-radius: 99px;
          box-shadow: 0 2px 8px rgba(201,149,109,0.4);
          font-family: 'DM Sans', sans-serif;
        }

        /* ═══ WISHLIST ════════════════════════════════════════ */
        .pc-wishlist {
          position: absolute;
          top: 8px;
          right: 8px;
          z-index: 15;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(20,16,12,0.48);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .pc-wishlist:hover {
          background: rgba(239,68,68,0.72);
          border-color: rgba(239,68,68,0.4);
          transform: scale(1.12);
        }
        .pc-wishlist-on {
          background: rgba(239,68,68,0.88) !important;
          border-color: rgba(239,68,68,0.5) !important;
        }

        /* ═══ COMPARE ═════════════════════════════════════════ */
        .pc-compare {
          position: absolute;
          top: 42px;
          right: 8px;
          z-index: 15;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(20,16,12,0.48);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .pc-compare:hover {
          background: rgba(201,149,109,0.72);
          border-color: rgba(201,149,109,0.4);
          transform: scale(1.12);
        }
        .pc-compare-on {
          background: rgba(201,149,109,0.88) !important;
          border-color: rgba(201,149,109,0.5) !important;
        }

        /* ═══ ACTION BAR ═════════════════════════════════════ */
        .pc-action-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: stretch;
          height: 38px;
          background: rgba(10,8,6,0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid rgba(255,255,255,0.07);
          transform: translateY(100%);
          transition: transform 0.35s cubic-bezier(0.16,1,0.3,1);
          z-index: 12;
        }
        .pc-action-bar-visible { transform: translateY(0); }

        .pc-btn-bag, .pc-btn-buy {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 0 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: rgba(245,240,234,0.88);
          transition: background 0.2s ease, color 0.2s ease;
        }
        .pc-btn-bag:hover {
          background: rgba(255,255,255,0.08);
          color: #fff;
        }
        .pc-btn-bag-added { color: #8DB87A !important; }

        .pc-btn-buy {
          color: var(--accent, #C9956D);
        }
        .pc-btn-buy:hover {
          background: rgba(201,149,109,0.14) !important;
          color: #e0b48a !important;
        }
        .pc-btn-sep {
          width: 1px;
          background: rgba(255,255,255,0.1);
          margin: 9px 0;
          flex-shrink: 0;
        }

        /* Mobile/touch: action bar always visible */
        @media (hover: none) and (pointer: coarse), (max-width: 640px) {
          .pc-action-bar { transform: translateY(0) !important; }
          .pc-overlay { opacity: 0.5; }
        }

        /* ═══ BODY ═══════════════════════════════════════════ */
        .pc-body {
          padding: 11px 12px 13px;
          display: flex;
          flex-direction: column;
          gap: 0;
          flex: 1;
          background: var(--bg-surface);
        }
        .pc-spacer {
          flex: 1;
          min-height: 4px;
        }

        /* Meta row — brand + stars */
        .pc-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 5px;
          min-height: 14px;
        }

        /* Brand */
        .pc-brand {
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--accent, #C9956D);
          text-decoration: none;
          transition: opacity 0.2s;
          line-height: 1;
        }
        .pc-brand:hover { opacity: 0.72; }
        .pc-brand-empty {
          display: block;
          width: 1px;
        }

        /* Name */
        .pc-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.3;
          margin: 0 0 6px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          letter-spacing: 0.01em;
        }

        /* Active ingredient pill */
        .pc-active {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          color: var(--text-muted);
          margin-bottom: 8px;
          font-family: 'DM Sans', sans-serif;
        }
        .pc-active-dot {
          width: 3.5px;
          height: 3.5px;
          border-radius: 50%;
          background: var(--sage, #8B9D77);
          flex-shrink: 0;
        }

        /* Stars */
        .pc-stars {
          display: flex;
          align-items: center;
          gap: 1.5px;
        }
        .pc-rating-text {
          font-size: 8px;
          color: var(--text-muted);
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.02em;
          margin-left: 2px;
        }

        /* Price row */
        .pc-price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 8px;
          border-top: 1px solid var(--border-subtle);
          margin-top: auto;
        }
        .pc-prices {
          display: flex;
          align-items: baseline;
          gap: 5px;
        }
        .pc-price {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 17px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1;
          letter-spacing: -0.01em;
        }
        .pc-price-was {
          font-family: 'DM Mono', monospace;
          font-size: 9.5px;
          color: var(--text-muted);
          text-decoration: line-through;
          opacity: 0.65;
        }
        .pc-size-tag {
          font-size: 7.5px;
          font-weight: 700;
          font-family: 'DM Mono', monospace;
          color: var(--text-muted);
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          padding: 2px 6px;
          border-radius: 99px;
          white-space: nowrap;
          letter-spacing: 0.04em;
        }
      `}</style>
    </div>
  );
}
