'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Heart, Eye, Star, Zap } from 'lucide-react';
import { Product, brands } from '../data/products';
import { useCartStore } from '../store/useCartStore';

interface ProductCardProps {
  product: Product;
  onQuickView?: () => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const { addToCart, toggleWishlist, isInWishlist, setBuyNow } = useCartStore();
  const router = useRouter();

  const inWishlist = isInWishlist(product.id.toString());
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

  const handleOrderNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Set buyNow item in store (separate from cart) and navigate to checkout
    setBuyNow({
      id: `${product.id}-default`,
      product: {
        id: String(product.id),
        name: product.name,
        image: product.image,
        price: product.price,
        discount_price: product.originalPrice > product.price ? product.price : undefined,
      },
      quantity: 1,
    });
    router.push('/checkout?mode=buynow');
  };

  return (
    <div
      className="pc-root"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Image Block ─────────────────────────────── */}
      <Link href={`/product/${product.id}`} className="pc-image-link">
        <div className="pc-image-wrap">

          {/* Skeleton */}
          {!imageLoaded && <div className="skeleton pc-skeleton" />}

          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            className={`pc-img${hovered ? ' pc-img-zoom' : ''}`}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />

          {/* Gradient overlay — always subtle, stronger on hover */}
          <div className={`pc-img-gradient${hovered ? ' pc-img-gradient-hover' : ''}`} />

          {/* Top-left badges */}
          <div className="pc-badges">
            {product.isBestseller && (
              <span className="pc-badge pc-badge-bestseller">★ Bestseller</span>
            )}
            {product.isNew && (
              <span className="pc-badge pc-badge-new">New</span>
            )}
            {product.isFreeDelivery && (
              <span className="pc-badge pc-badge-free-delivery">Free Delivery</span>
            )}
            {discount > 0 && (
              <span className="pc-badge pc-badge-sale">−{discount}%</span>
            )}
          </div>

          {/* Wishlist button — top-right */}
          <button
            onClick={handleWishlist}
            aria-label="Wishlist"
            className={`pc-wishlist${inWishlist ? ' pc-wishlist-active' : ''}`}
          >
            <Heart
              size={14}
              style={{
                fill: inWishlist ? '#fff' : 'none',
                color: '#fff',
                transition: 'all 0.2s ease',
              }}
            />
          </button>

          {/* Quick View chip — centre, appears on hover */}
          <div className={`pc-quickview${hovered ? ' pc-quickview-visible' : ''}`}>
            <Eye size={13} />
            <span>Quick View</span>
          </div>

          {/* Hover action bar — slides up from bottom of image */}
          <div className={`pc-action-bar${hovered ? ' pc-action-bar-visible' : ''}`}>
            <button
              onClick={handleAddToCart}
              className={`pc-action-btn${isAdded ? ' pc-action-btn-added' : ''}`}
              aria-label="Add to cart"
            >
              <ShoppingBag size={13} />
              <span>{isAdded ? '✓ Added!' : 'Add to Bag'}</span>
            </button>
            <div className="pc-action-divider" />
            <button
              onClick={handleOrderNow}
              className="pc-action-btn pc-action-btn-order"
              aria-label="Order now"
            >
              <Zap size={13} />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </Link>

      {/* ── Content Block ────────────────────────────── */}
      <div className="pc-content">

        {/* Active ingredient pill */}
        {product.actives.length > 0 && (
          <span className="pc-active-pill">
            {product.actives[0].name} {product.actives[0].concentration}{product.actives[0].unit}
          </span>
        )}

        {/* Brand link */}
        {product.brand && (() => {
          const b = brands.find(br => br.id === product.brand);
          return b ? (
            <Link
              href={`/brands/${product.brand}`}
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--accent, #C9956D)',
                textDecoration: 'none',
                marginBottom: '5px',
                display: 'inline-block',
                width: 'fit-content'
              }}
              className="pc-brand-link"
            >
              {b.name}
            </Link>
          ) : null;
        })()}

        {/* Category + Size row */}
        <div className="pc-meta-row">
          <span className="pc-category">{product.category}</span>
          {product.size && <span className="pc-size">{product.size}</span>}
        </div>

        {/* Product name */}
        <Link href={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
          <h3 className="pc-name">{product.name}</h3>
        </Link>

        {/* Rating row */}
        <div className="pc-rating-row">
          <div className="pc-stars">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={10}
                style={{
                  fill: i < Math.round(product.rating) ? '#C9956D' : 'none',
                  color: i < Math.round(product.rating) ? '#C9956D' : 'var(--border-dark, #C8BFB5)',
                  flexShrink: 0,
                }}
              />
            ))}
          </div>
          <span className="pc-review-count">
            {product.rating} <span className="pc-review-sep">·</span> {product.reviewCount} reviews
          </span>
        </div>

        {/* Price row */}
        <div className="pc-price-row">
          <div className="pc-price-group">
            <span className="pc-price">৳{product.price.toLocaleString()}</span>
            {discount > 0 && (
              <span className="pc-price-original">৳{product.originalPrice.toLocaleString()}</span>
            )}
          </div>
          {discount > 0 && (
            <span className="pc-save-badge">Save {discount}%</span>
          )}
        </div>
      </div>

      <style>{`
        /* ── Root ─────────────────────────────────────── */
        .pc-root {
          position: relative;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: border-color 0.3s ease, box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1), transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pc-root:hover {
          border-color: rgba(201,149,109,0.4);
          box-shadow: 0 24px 56px rgba(26,26,24,0.13), 0 4px 16px rgba(201,149,109,0.08);
          transform: translateY(-5px);
        }

        /* ── Image ────────────────────────────────────── */
        .pc-image-link {
          display: block;
          position: relative;
          text-decoration: none;
        }
        .pc-image-wrap {
          position: relative;
          aspect-ratio: 4/5;
          background: var(--bg-elevated);
          overflow: hidden;
        }
        .pc-skeleton {
          position: absolute;
          inset: 0;
          border-radius: 0;
        }
        .pc-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
          will-change: transform;
        }
        .pc-img-zoom {
          transform: scale(1.07);
        }

        /* Gradient overlay */
        .pc-img-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(26,26,24,0.0) 40%,
            rgba(26,26,24,0.55) 100%
          );
          opacity: 0;
          transition: opacity 0.35s ease;
          pointer-events: none;
        }
        .pc-img-gradient-hover {
          opacity: 1;
        }

        /* ── Badges ───────────────────────────────────── */
        .pc-badges {
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 10;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .pc-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3px 8px;
          border-radius: 99px;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .pc-badge-bestseller {
          background: rgba(26,26,24,0.82);
          color: #FAF7F2;
          border: 1px solid rgba(250,247,242,0.15);
        }
        .pc-badge-new {
          background: rgba(139,157,119,0.92);
          color: #fff;
          border: 1px solid rgba(139,157,119,0.3);
        }
        .pc-badge-sale {
          background: rgba(201,149,109,0.92);
          color: #fff;
          border: 1px solid rgba(201,149,109,0.3);
        }
        .pc-badge-free-delivery {
          background: rgba(76,175,130,0.92);
          color: #fff;
          border: 1px solid rgba(76,175,130,0.3);
        }

        /* ── Wishlist button ─────────────────────────── */
        .pc-wishlist {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 10;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: rgba(26,26,24,0.45);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(250,247,242,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .pc-wishlist:hover {
          background: rgba(201,149,109,0.85);
          border-color: rgba(201,149,109,0.5);
          transform: scale(1.1);
        }
        .pc-wishlist-active {
          background: rgba(201,149,109,0.9) !important;
          border-color: rgba(201,149,109,0.5) !important;
        }

        /* ── Quick View chip ─────────────────────────── */
        .pc-quickview {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -40%);
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(250,247,242,0.95);
          color: var(--text-primary);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 9px 18px;
          border-radius: 2px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          pointer-events: none;
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
        }
        .pc-quickview-visible {
          opacity: 1;
          transform: translate(-50%, -50%);
        }

        /* ── Action Bar (slide from bottom of image) ─── */
        .pc-action-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          align-items: stretch;
          background: rgba(26,26,24,0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-top: 1px solid rgba(250,247,242,0.1);
          transform: translateY(100%);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 12;
        }
        .pc-action-bar-visible {
          transform: translateY(0);
        }
        .pc-action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 11px 8px;
          background: transparent;
          color: rgba(250,247,242,0.9);
          border: none;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s ease, color 0.2s ease;
          font-family: 'DM Sans', sans-serif;
        }
        .pc-action-btn:hover {
          background: rgba(250,247,242,0.08);
          color: #fff;
        }
        .pc-action-btn-added {
          color: #8B9D77 !important;
        }
        .pc-action-btn-order {
          color: var(--accent, #C9956D);
        }
        .pc-action-btn-order:hover {
          background: rgba(201,149,109,0.15) !important;
          color: #DEB896 !important;
        }
        .pc-action-divider {
          width: 1px;
          background: rgba(250,247,242,0.12);
          margin: 8px 0;
          flex-shrink: 0;
        }

        /* ── Content ──────────────────────────────────── */
        .pc-content {
          padding: 14px 15px 16px;
          display: flex;
          flex-direction: column;
          gap: 0;
          flex: 1;
        }

        /* Active ingredient pill */
        .pc-active-pill {
          display: inline-block;
          background: rgba(139,157,119,0.11);
          color: var(--sage-hover, #6B7D57);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 3px 9px;
          border-radius: 99px;
          border: 1px solid rgba(139,157,119,0.22);
          margin-bottom: 9px;
          align-self: flex-start;
        }
        .dark .pc-active-pill {
          background: rgba(157,176,137,0.14);
          color: #9DB089;
          border-color: rgba(157,176,137,0.22);
        }

        /* Meta row (category + size) */
        .pc-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .pc-category {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
        }
        .pc-size {
          font-size: 9px;
          font-weight: 700;
          font-family: 'DM Mono', monospace;
          color: var(--text-muted);
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          padding: 2px 7px;
          border-radius: 99px;
        }

        /* Product name */
        .pc-name {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 17px;
          font-weight: 600;
          color: var(--text-primary);
          line-height: 1.3;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Rating */
        .pc-rating-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 11px;
        }
        .pc-stars {
          display: flex;
          gap: 2px;
        }
        .pc-review-count {
          font-size: 10px;
          color: var(--text-muted);
          font-family: 'DM Mono', monospace;
        }
        .pc-review-sep {
          opacity: 0.4;
          margin: 0 1px;
        }

        /* Price */
        .pc-price-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 10px;
          border-top: 1px solid var(--border-subtle);
        }
        .pc-price-group {
          display: flex;
          align-items: baseline;
          gap: 7px;
        }
        .pc-price {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: -0.01em;
          line-height: 1;
        }
        .pc-price-original {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: var(--text-muted);
          text-decoration: line-through;
        }
        .pc-save-badge {
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--accent, #C9956D);
          background: rgba(201,149,109,0.1);
          border: 1px solid rgba(201,149,109,0.2);
          padding: 3px 8px;
          border-radius: 99px;
        }
      `}</style>
    </div>
  );
}
