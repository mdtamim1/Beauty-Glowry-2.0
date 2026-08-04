'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Zap, ArrowRight, Trash2, ArrowLeft } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { products } from '../../data/products';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
  const { wishlist, removeFromWishlist, addToCart, setBuyNow } = useCartStore();
  const router = useRouter();
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});
  const [dbProducts, setDbProducts] = useState<typeof products>(products);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDbProducts(data);
        }
      })
      .catch((err) => console.error('Failed to fetch live products for wishlist:', err));
  }, []);

  // Get full product objects from wishlist IDs
  const wishlistProducts = dbProducts.filter((p) => wishlist.includes(String(p.id)));

  const handleAddToCart = (product: typeof products[0]) => {
    addToCart(product);
    setAddedIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => setAddedIds((prev) => ({ ...prev, [product.id]: false })), 2000);
  };

  const handleOrderNow = (product: typeof products[0]) => {
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
    <>
      <Navbar />

      <div style={{ background: 'var(--bg-base)', minHeight: '80vh', paddingBottom: 80 }}>
        {/* Header */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-default)',
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
              Saved Items
            </p>
            <h1
              className="font-editorial"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 'clamp(28px, 5vw, 52px)',
                fontWeight: 400,
                color: 'var(--text-primary)',
                lineHeight: 1.05,
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              My Wishlist
              {wishlistProducts.length > 0 && (
                <span
                  style={{
                    fontSize: 14,
                    fontFamily: "'DM Mono', monospace",
                    fontWeight: 500,
                    color: 'var(--text-muted)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    padding: '3px 12px',
                    borderRadius: 99,
                    letterSpacing: 0,
                  }}
                >
                  {wishlistProducts.length} items
                </span>
              )}
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>
              Products you've saved for later.
            </p>
          </div>
        </div>

        <div className="container-lg" style={{ paddingTop: 40 }}>
          {wishlistProducts.length === 0 ? (
            /* Empty State */
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                border: '1px solid var(--border-default)',
                borderRadius: 8,
                background: 'var(--bg-surface)',
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'rgba(201,149,109,0.08)',
                  border: '2px dashed rgba(201,149,109,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                }}
              >
                <Heart size={32} style={{ color: 'var(--accent)', opacity: 0.5 }} />
              </div>
              <h2
                className="font-editorial"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 28,
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                  marginBottom: 10,
                }}
              >
                Your wishlist is empty
              </h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 32 }}>
                Tap the heart icon on any product to save it here.
              </p>
              <Link href="/products" className="btn-accent">
                Explore Products <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <>
              {/* Back link */}
              <div style={{ marginBottom: 28 }}>
                <Link
                  href="/products"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <ArrowLeft size={14} /> Continue Shopping
                </Link>
              </div>

              {/* Grid */}
              <div className="wishlist-grid">
                {wishlistProducts.map((product) => {
                  const discount =
                    product.originalPrice > product.price
                      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
                      : 0;
                  const isAdded = addedIds[product.id];

                  return (
                    <div key={product.id} className="wishlist-card">
                      {/* Image */}
                      <div className="wishlist-card-img-wrap">
                        <Link href={`/product/${product.id}`} style={{ display: 'block', height: '100%' }}>
                          <img
                            src={product.image}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease' }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                          />
                        </Link>

                        {/* Badges */}
                        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {product.isBestseller && (
                            <span style={{ background: 'rgba(26,26,24,0.82)', color: '#FAF7F2', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 99, backdropFilter: 'blur(8px)' }}>
                              ★ Bestseller
                            </span>
                          )}
                          {discount > 0 && (
                            <span style={{ background: 'rgba(201,149,109,0.92)', color: '#fff', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 99 }}>
                              −{discount}%
                            </span>
                          )}
                        </div>

                        {/* Remove from wishlist */}
                        <button
                          onClick={() => removeFromWishlist(String(product.id))}
                          aria-label="Remove from wishlist"
                          style={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            width: 34,
                            height: 34,
                            borderRadius: '50%',
                            background: 'rgba(26,26,24,0.7)',
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(250,247,242,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            color: '#ef4444',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.7)')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(26,26,24,0.7)')}
                        >
                          <Trash2 size={13} style={{ color: 'inherit' }} />
                        </button>
                      </div>

                      {/* Content */}
                      <div style={{ padding: '14px 15px 16px' }}>
                        {product.actives.length > 0 && (
                          <span
                            style={{
                              display: 'inline-block',
                              background: 'rgba(139,157,119,0.11)',
                              color: 'var(--sage-hover, #6B7D57)',
                              fontSize: 9,
                              fontWeight: 700,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              padding: '3px 9px',
                              borderRadius: 99,
                              border: '1px solid rgba(139,157,119,0.22)',
                              marginBottom: 9,
                            }}
                          >
                            {product.actives[0].name} {product.actives[0].concentration}{product.actives[0].unit}
                          </span>
                        )}

                        <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 5 }}>
                          {product.category}
                        </p>

                        <Link href={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
                          <h3
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, serif",
                              fontSize: 17,
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                              lineHeight: 1.3,
                              marginBottom: 10,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {product.name}
                          </h3>
                        </Link>

                        {/* Price */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 8,
                            marginBottom: 14,
                            paddingTop: 10,
                            borderTop: '1px solid var(--border-subtle)',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, serif",
                              fontSize: 20,
                              fontWeight: 600,
                              color: 'var(--text-primary)',
                            }}
                          >
                            ৳{product.price.toLocaleString()}
                          </span>
                          {discount > 0 && (
                            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                              ৳{product.originalPrice.toLocaleString()}
                            </span>
                          )}
                          {discount > 0 && (
                            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', background: 'rgba(201,149,109,0.1)', border: '1px solid rgba(201,149,109,0.2)', padding: '2px 7px', borderRadius: 99, marginLeft: 'auto' }}>
                              Save {discount}%
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                          <button
                            onClick={() => handleAddToCart(product)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              padding: '10px 8px',
                              background: isAdded ? 'var(--sage)' : 'transparent',
                              color: isAdded ? '#fff' : 'var(--text-primary)',
                              border: isAdded ? 'none' : '1px solid var(--text-primary)',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                              transition: 'all 0.25s ease',
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                          >
                            <ShoppingBag size={12} />
                            {isAdded ? 'Added!' : 'Add to Cart'}
                          </button>
                          <button
                            onClick={() => handleOrderNow(product)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              padding: '10px 8px',
                              background: 'var(--accent)',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              cursor: 'pointer',
                              transition: 'all 0.25s ease',
                              fontFamily: "'DM Sans', sans-serif",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-hover)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--accent)')}
                          >
                            <Zap size={12} />
                            Order Now
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />

      <style>{`
        .wishlist-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .wishlist-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          overflow: hidden;
          transition: border-color 0.3s ease, box-shadow 0.4s ease, transform 0.4s ease;
        }
        .wishlist-card:hover {
          border-color: rgba(201,149,109,0.4);
          box-shadow: 0 24px 56px rgba(26,26,24,0.13);
          transform: translateY(-4px);
        }
        .wishlist-card-img-wrap {
          position: relative;
          aspect-ratio: 4/5;
          overflow: hidden;
          background: var(--bg-elevated);
        }

        @media (max-width: 1100px) {
          .wishlist-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .wishlist-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
        @media (max-width: 420px) {
          .wishlist-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
