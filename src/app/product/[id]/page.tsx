'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShoppingBag, Heart, Star, ChevronLeft, ChevronRight,
  Plus, Minus, ArrowRight, ZoomIn, Check, Zap,
  Shield, Truck, Leaf, ChevronDown, Beaker, Package,
  Globe, Clock, FlaskConical, Sparkles, Eye
} from 'lucide-react';
import { products, Product, brands } from '../../../data/products';
import { useCartStore } from '../../../store/useCartStore';
import { useAuthStore } from '../../../store/useAuthStore';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import ProductCard from '../../../components/ProductCard';
import { HelpCircle as HelpCircleIcon } from 'lucide-react';

// ─── Star Rating ───────────────────────────────────────────────────
function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          style={{
            fill: i < Math.round(rating) ? '#C9956D' : 'none',
            color: i < Math.round(rating) ? '#C9956D' : 'var(--border-dark, #D4C9BE)',
          }}
        />
      ))}
    </div>
  );
}

// ─── Accordion ─────────────────────────────────────────────────────
function AccordionItem({ title, children, defaultOpen = false }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid var(--border-default)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '16px 0',
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-primary)', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.04em' }}>{title}</span>
        <ChevronDown size={15} style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} />
      </button>
      <div style={{ maxHeight: open ? 600 : 0, overflow: 'hidden', transition: 'max-height 0.4s cubic-bezier(0.16,1,0.3,1)', opacity: open ? 1 : 0 }}>
        <div style={{ paddingBottom: 18 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────
export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  useEffect(() => {
    if (product) {
      setSelectedVariant(product.variants[0] ?? null);
    }
  }, [product]);

  useEffect(() => {
    if (!params || !params.id) return;
    setLoading(true);
    fetch(`/api/products/${params.id}`)
      .then((res) => {
        if (res.status === 404) {
          setProduct(undefined);
          throw new Error('Product not found in database');
        }
        if (!res.ok) throw new Error('Failed to load product');
        return res.json();
      })
      .then((data) => {
        if (data && data.id) {
          setProduct(data);
          if (data.reviews) setReviews(data.reviews);
          if (data.qnas) setQnas(data.qnas);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load product from DB:', err);
        setProduct(undefined);
        setLoading(false);
      });

    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDbProducts(data);
        }
      })
      .catch((err) => console.error('Failed to fetch live products for related section:', err));
  }, [params]);

  const [isAdded, setIsAdded] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [reviews, setReviews] = useState<any[]>([]);
  const [qnas, setQnas] = useState<any[]>([]);
  const [reviewName, setReviewName] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  
  const [questionText, setQuestionText] = useState('');
  const [qnaError, setQnaError] = useState('');
  const [qnaSuccess, setQnaSuccess] = useState(false);
  const [qnaLoading, setQnaLoading] = useState(false);

  const [reviewError, setReviewError] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);

  const { user, token } = useAuthStore();

  useEffect(() => {
    if (user) {
      setReviewName(user.name);
    }
  }, [user]);

  const imgRef = useRef<HTMLDivElement>(null);
  const { addToCart, toggleWishlist, isInWishlist, clearCart } = useCartStore();

  const allImages = product
    ? [product.image, ...(product.productImages?.filter(img => img !== product.image) || [])]
    : [];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  }, []);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, selectedVariant, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2500);
  };

  const handleOrderNow = () => {
    if (!product) return;
    clearCart();
    addToCart(product, selectedVariant, quantity);
    router.push('/checkout');
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    if (!user) {
      setReviewError('You must be logged in to submit a review.');
      return;
    }

    setReviewLoading(true);
    setReviewError('');

    try {
      const response = await fetch(`/api/products/${product?.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewText.trim(),
          userId: user.id
        }),
      });
      const data = await response.json();
      setReviewLoading(false);

      if (!response.ok) {
        setReviewError(data.error || 'Failed to submit review.');
        return;
      }

      setReviews([data.review, ...reviews]);
      setReviewText('');
      setReviewRating(5);
      alert('Review posted successfully!');
    } catch (err) {
      setReviewLoading(false);
      setReviewError('Failed to connect to server.');
    }
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    if (!user) {
      setQnaError('You must be logged in to ask a question.');
      return;
    }

    setQnaLoading(true);
    setQnaError('');
    setQnaSuccess(false);

    try {
      const response = await fetch(`/api/products/${product?.id}/qnas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          question: questionText.trim(),
          userId: user.id
        }),
      });
      const data = await response.json();
      setQnaLoading(false);

      if (!response.ok) {
        setQnaError(data.error || 'Failed to submit question.');
        return;
      }

      setQnas([data.qna, ...qnas]);
      setQuestionText('');
      setQnaSuccess(true);
      setTimeout(() => setQnaSuccess(false), 3000);
    } catch (err) {
      setQnaLoading(false);
      setQnaError('Failed to connect to server.');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div className="pc-skeleton" style={{ width: 64, height: 64, borderRadius: '50%' }} />
            <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading formulation details...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32 }}>Product Not Found</h2>
          <Link href="/products" className="btn-primary">Back to Shop</Link>
        </div>
        <Footer />
      </>
    );
  }

  const price = selectedVariant?.price ?? product.price;
  const discount = product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
  const avgRating = reviews.length > 0 ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : '5.0';
  const related = dbProducts.filter(p => p.id !== product.id && p.category === product.category).slice(0, 4);

  return (
    <>
      <Navbar />

      {/* Breadcrumb */}
      <div style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)', padding: '12px 0' }}>
        <div className="container-lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link href="/products" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Products</Link>
            <span>/</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{product.name.slice(0, 42)}…</span>
          </div>
        </div>
      </div>

      {/* ══ MAIN PRODUCT SECTION ══════════════════════════════════════════ */}
      <section style={{ background: 'var(--bg-base)', padding: '48px 0 64px' }}>
        <div className="container-lg">
          <div className="pdp-main-grid">

            {/* ── LEFT: Gallery ───────────────────────────────────── */}
            <div className="pdp-gallery">

              {/* Main Image */}
              <div
                ref={imgRef}
                onMouseEnter={() => setZoom(true)}
                onMouseLeave={() => setZoom(false)}
                onMouseMove={handleMouseMove}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  cursor: zoom ? 'crosshair' : 'zoom-in',
                  marginBottom: 12,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.06)',
                }}
              >
                {/* Normal image */}
                <img
                  src={allImages[selectedImage]}
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: zoom ? 'none' : 'block', transition: 'opacity 0.3s' }}
                />
                {/* Zoomed */}
                {zoom && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: `url(${allImages[selectedImage]})`,
                    backgroundSize: '250%',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  }} />
                )}

                {/* Badges */}
                <div style={{ position: 'absolute', top: 14, left: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {product.isBestseller && <span className="badge-bestseller">Bestseller</span>}
                  {product.isNew && <span className="badge-new">New</span>}
                  {product.isFreeDelivery && <span className="badge-free-delivery">Free Delivery</span>}
                  {discount > 0 && <span className="badge-sale">−{discount}%</span>}
                </div>

                {/* Size chip on image */}
                <div style={{
                  position: 'absolute', bottom: 14, left: 14,
                  background: 'rgba(250,247,242,0.9)', backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border-default)', borderRadius: 4,
                  padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, fontWeight: 700, color: 'var(--text-primary)',
                  fontFamily: "'DM Mono', monospace",
                }}>
                  <Package size={12} style={{ color: 'var(--text-muted)' }} />
                  {product.size}
                </div>

                {/* Zoom hint */}
                <div style={{
                  position: 'absolute', bottom: 14, right: 14,
                  background: 'rgba(250,247,242,0.85)', backdropFilter: 'blur(8px)',
                  border: '1px solid var(--border-default)', borderRadius: 3,
                  padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 10, color: 'var(--text-muted)', pointerEvents: 'none',
                }}>
                  <ZoomIn size={11} /> Hover to zoom
                </div>

                {/* Arrow nav */}
                {allImages.length > 1 && (
                  <>
                    <button onClick={() => setSelectedImage(p => (p === 0 ? allImages.length - 1 : p - 1))}
                      style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', background: 'rgba(250,247,242,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                      <ChevronLeft size={17} />
                    </button>
                    <button onClick={() => setSelectedImage(p => (p === allImages.length - 1 ? 0 : p + 1))}
                      style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 34, height: 34, borderRadius: '50%', background: 'rgba(250,247,242,0.9)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                      <ChevronRight size={17} />
                    </button>
                  </>
                )}
              </div>

              {/* ── Thumbnail Strip ──────────────────────────────────── */}
              {allImages.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(allImages.length, 5)}, 1fr)`, gap: 8 }}>
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      style={{
                        aspectRatio: '1',
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: selectedImage === i
                          ? '2px solid var(--accent)'
                          : '2px solid var(--border-default)',
                        padding: 0, cursor: 'pointer',
                        background: 'var(--bg-elevated)',
                        transition: 'border-color 0.2s, transform 0.2s',
                        transform: selectedImage === i ? 'scale(1)' : 'scale(0.97)',
                      }}
                      onMouseEnter={(e) => { if (selectedImage !== i) e.currentTarget.style.borderColor = 'rgba(201,149,109,0.5)'; }}
                      onMouseLeave={(e) => { if (selectedImage !== i) e.currentTarget.style.borderColor = 'var(--border-default)'; }}
                    >
                      <img src={img} alt={`View ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </button>
                  ))}
                </div>
              )}

              {/* ── Product Specs Card ───────────────────────────────── */}
              <div
                style={{
                  marginTop: 16,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 6,
                  padding: 18,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 0,
                }}
              >
                {[
                  { icon: <Package size={13} />, label: 'Net Content', value: product.size },
                  { icon: <FlaskConical size={13} />, label: 'Net Weight', value: product.weight || `${product.size.replace(/[^0-9]/g, '')}g` },
                  { icon: <Clock size={13} />, label: 'Shelf Life', value: product.shelfLife || '24 months' },
                  { icon: <Globe size={13} />, label: 'Made In', value: product.madeIn || 'Bangladesh' },
                ].map((spec, i) => (
                  <div
                    key={spec.label}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8,
                      padding: '11px 14px',
                      borderBottom: i < 2 ? '1px solid var(--border-subtle)' : 'none',
                      borderRight: i % 2 === 0 ? '1px solid var(--border-subtle)' : 'none',
                    }}
                  >
                    <div style={{ color: 'var(--accent)', marginTop: 1, flexShrink: 0 }}>{spec.icon}</div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 3 }}>
                        {spec.label}
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}>
                        {spec.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Product Info ────────────────────────────────── */}
            <div>
              {/* Brand & Category Row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                {product.brand && (() => {
                  const b = brands.find(br => br.id === product.brand);
                  return b ? (
                    <Link
                      href={`/brands/${product.brand}`}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.14em',
                        textTransform: 'uppercase',
                        color: 'var(--accent)',
                        textDecoration: 'none',
                      }}
                    >
                      {b.name}
                    </Link>
                  ) : null;
                })()}
                {product.brand && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>|</span>}
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  {product.category}
                </span>
              </div>

              {/* Name */}
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 34, fontWeight: 500,
                  color: 'var(--text-primary)', lineHeight: 1.15, marginBottom: 14,
                }}
              >
                {product.name}
              </h1>

              {/* Rating + Size inline */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <StarRating rating={Number(avgRating)} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: 'var(--text-secondary)' }}>
                    {avgRating} · {reviews.length + product.reviewCount} reviews
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 12px',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 3, fontSize: 12, fontWeight: 700,
                    color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace",
                  }}
                >
                  <Package size={11} style={{ color: 'var(--text-muted)' }} /> {product.size}
                </div>
              </div>

              {/* Active Ingredients chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border-default)' }}>
                {product.actives.map((a) => (
                  <div key={a.name} className="badge-active" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                    <Beaker size={10} /> {a.name} {a.concentration}{a.unit}
                  </div>
                ))}
              </div>

              {/* Description */}
              <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 24 }}>
                {product.description}
              </p>

              {/* ── Price Block ─────────────────────────────────── */}
              <div
                style={{
                  background: 'linear-gradient(135deg, var(--bg-elevated) 0%, rgba(201,149,109,0.04) 100%)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 8,
                  padding: '18px 20px',
                  marginBottom: 22,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 44, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>
                    ৳{price.toLocaleString()}
                  </span>
                  {discount > 0 && (
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      ৳{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                {discount > 0 && (
                  <div
                    style={{
                      background: 'linear-gradient(135deg, var(--accent), #d9835a)',
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 13,
                      padding: '6px 14px',
                      borderRadius: 99,
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(201,149,109,0.3)',
                    }}
                  >
                    −{discount}% OFF
                  </div>
                )}
              </div>

              {/* Variant Select */}
              {product.variants.length > 1 && (
                <div style={{ marginBottom: 22 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 10 }}>
                    Select Size / Pack
                  </p>
                  <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
                    {product.variants.map((v) => (
                      <button
                        key={v.sku}
                        onClick={() => setSelectedVariant(v)}
                        style={{
                          padding: '10px 16px', border: selectedVariant?.sku === v.sku ? '1px solid var(--accent)' : '1px solid var(--border-default)',
                          borderRadius: 3, background: selectedVariant?.sku === v.sku ? 'rgba(201,149,109,0.08)' : 'transparent',
                          color: selectedVariant?.sku === v.sku ? 'var(--accent)' : 'var(--text-secondary)',
                          fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                        }}
                      >
                        {v.label}
                        <span style={{ display: 'block', fontSize: 11, fontFamily: "'DM Mono', monospace", marginTop: 2 }}>৳{v.price.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Purchase Block ─────────────────────────────── */}
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 10,
                  padding: '20px',
                  marginBottom: 20,
                  boxShadow: '0 2px 16px rgba(26,26,24,0.05)',
                }}
              >
                {/* Quantity Label */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: 0 }}>
                    Quantity
                  </p>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
                    Total: <strong style={{ color: 'var(--accent)' }}>৳{(price * quantity).toLocaleString()}</strong>
                  </span>
                </div>

                {/* Quantity Stepper */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    border: '1px solid var(--border-default)',
                    borderRadius: 8,
                    overflow: 'hidden',
                    marginBottom: 16,
                    background: 'var(--bg-elevated)',
                  }}
                >
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    style={{
                      width: 44, height: 44, background: 'none', border: 'none',
                      cursor: 'pointer', color: 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,149,109,0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <Minus size={14} />
                  </button>
                  <span
                    style={{
                      minWidth: 52, textAlign: 'center', fontSize: 16, fontWeight: 700,
                      color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace",
                      borderLeft: '1px solid var(--border-default)',
                      borderRight: '1px solid var(--border-default)',
                      padding: '0 12px', lineHeight: '44px',
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    style={{
                      width: 44, height: 44, background: 'none', border: 'none',
                      cursor: 'pointer', color: 'var(--text-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,149,109,0.08)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* CTA Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* Order Now — Primary CTA */}
                  <button
                    onClick={handleOrderNow}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      height: 54,
                      background: 'linear-gradient(135deg, var(--accent) 0%, #c07a50 100%)',
                      color: '#FFF',
                      border: 'none',
                      borderRadius: 8,
                      fontSize: 14,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      boxShadow: '0 6px 24px rgba(201,149,109,0.35)',
                      transition: 'all 0.25s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(201,149,109,0.45)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(201,149,109,0.35)'; }}
                  >
                    <Zap size={16} />
                    Order Now — ৳{(price * quantity).toLocaleString()}
                  </button>

                  {/* Add to Cart + Wishlist */}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      onClick={handleAddToCart}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        height: 50,
                        background: isAdded ? 'rgba(139,157,119,0.12)' : 'var(--bg-elevated)',
                        color: isAdded ? 'var(--sage)' : 'var(--text-primary)',
                        border: isAdded ? '1.5px solid var(--sage)' : '1.5px solid var(--border-dark)',
                        borderRadius: 8,
                        fontSize: 13,
                        fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {isAdded ? <><Check size={15} /> Added to Bag</> : <><ShoppingBag size={15} /> Add to Bag</>}
                    </button>

                    <button
                      onClick={() => toggleWishlist(product.id.toString())}
                      style={{
                        width: 50, height: 50,
                        border: isInWishlist(product.id.toString()) ? '1.5px solid rgba(239,68,68,0.4)' : '1.5px solid var(--border-dark)',
                        borderRadius: 8,
                        background: isInWishlist(product.id.toString()) ? 'rgba(239,68,68,0.06)' : 'var(--bg-elevated)',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.25s ease',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = isInWishlist(product.id.toString()) ? 'rgba(239,68,68,0.4)' : 'var(--border-dark)'; e.currentTarget.style.background = isInWishlist(product.id.toString()) ? 'rgba(239,68,68,0.06)' : 'var(--bg-elevated)'; }}
                    >
                      <Heart size={17} style={{ fill: isInWishlist(product.id.toString()) ? '#ef4444' : 'none', color: isInWishlist(product.id.toString()) ? '#ef4444' : 'var(--text-muted)', transition: 'all 0.25s' }} />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Trust Facilities Bar ──────────────────────────────── */}
              <div className="pdp-trust-bar">
                {[
                  {
                    icon: <Truck size={18} style={{ color: '#4CAF82' }} />,
                    title: 'Free Delivery',
                    desc: product.isFreeDelivery ? 'Free shipping on this item!' : 'On orders ৳1,500+',
                  },
                  {
                    icon: <Shield size={18} style={{ color: '#60A5FA' }} />,
                    title: '100% Authentic',
                    desc: 'Lab-tested formula',
                  },
                  {
                    icon: <Leaf size={18} style={{ color: '#8B9D77' }} />,
                    title: 'Clean Formula',
                    desc: 'No harsh additives',
                  },
                  {
                    icon: <Sparkles size={18} style={{ color: '#C9956D' }} />,
                    title: '7-Day Return',
                    desc: 'Hassle-free policy',
                  },
                ].map((item, i) => (
                  <div
                    key={item.title}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textAlign: 'center',
                      padding: '16px 10px',
                      background: 'var(--bg-elevated)',
                      borderRight: i < 3 ? '1px solid var(--border-subtle)' : 'none',
                      gap: 7,
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,149,109,0.05)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-elevated)')}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-default)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {item.icon}
                    </div>
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, marginBottom: 2 }}>{item.title}</p>
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Skin Types */}
              <div style={{ marginBottom: 22 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Suitable For
                </p>
                <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                  {product.skinTypes.map((type) => (
                    <span key={type} style={{ fontSize: 12, color: 'var(--text-secondary)', border: '1px solid var(--border-default)', padding: '4px 12px', borderRadius: 3 }}>
                      {type}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Accordion Info ────────────────────────────────────── */}
              <div>
                <AccordionItem title="Key Ingredients" defaultOpen>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {product.actives.map((a) => (
                      <div key={a.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 14px', background: 'var(--bg-elevated)', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Beaker size={13} style={{ color: 'var(--accent)' }} />
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontFamily: "'DM Mono', monospace" }}>{a.name}</span>
                        </div>
                        <span className="badge-active">{a.concentration}{a.unit}</span>
                      </div>
                    ))}
                  </div>
                </AccordionItem>

                <AccordionItem title="How to Use">
                  <ol style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {product.usageSteps.map((step, i) => (
                      <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', color: '#fff', fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          {i + 1}
                        </span>
                        <p style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-secondary)', paddingTop: 3 }}>{step}</p>
                      </li>
                    ))}
                  </ol>
                </AccordionItem>

                <AccordionItem title="Product Specifications">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                      { label: 'Net Content', value: product.size },
                      { label: 'Net Weight', value: product.weight || '—' },
                      { label: 'Shelf Life', value: product.shelfLife || '24 months' },
                      { label: 'Made In', value: product.madeIn || 'Bangladesh' },
                      { label: 'Category', value: product.category },
                      { label: 'Skin Types', value: product.skinTypes.join(', ') },
                    ].map((s) => (
                      <div key={s.label} style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 4, border: '1px solid var(--border-subtle)' }}>
                        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </AccordionItem>

                <AccordionItem title="Full INCI Ingredient List">
                  <p style={{ fontSize: 11, lineHeight: 1.9, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
                    {product.inciList}
                  </p>
                </AccordionItem>

                <AccordionItem title="Skin Concerns Addressed">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {product.concerns.map((c) => (
                      <Link key={c} href={`/products?concern=${encodeURIComponent(c)}`}
                        style={{ fontSize: 12, color: 'var(--accent)', border: '1px solid rgba(201,149,109,0.3)', background: 'rgba(201,149,109,0.06)', padding: '5px 14px', borderRadius: 3, textDecoration: 'none', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(201,149,109,0.12)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(201,149,109,0.06)')}
                      >
                        {c}
                      </Link>
                    ))}
                  </div>
                </AccordionItem>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ REVIEWS ══════════════════════════════════════════════════════ */}
      <section style={{ padding: '72px 0', background: 'var(--bg-surface)', borderTop: '1px solid var(--border-default)' }}>
        <div className="container-lg">
          <div className="pdp-reviews-grid">
            {/* Summary */}
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 20 }}>
                Customer Reviews
              </h2>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 60, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {avgRating}
                </span>
                <div>
                  <StarRating rating={Number(avgRating)} size={16} />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{reviews.length + product.reviewCount} total reviews</p>
                </div>
              </div>
              {[5, 4, 3, 2, 1].map((s) => {
                const pct = s >= 4 ? (s === 5 ? 84 : 12) : 4;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 10 }}>{s}</span>
                    <Star size={11} style={{ fill: '#C9956D', color: '#C9956D', flexShrink: 0 }} />
                    <div style={{ flex: 1, height: 5, background: 'var(--border-default)', borderRadius: 99 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent)', borderRadius: 99 }} />
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', width: 26 }}>{pct}%</span>
                  </div>
                );
              })}
            </div>

            {/* List + Form */}
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 36 }}>
                {reviews.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-muted)', fontSize: 13, fontStyle: 'italic' }}>
                    No reviews written yet. Be the first to share your experience!
                  </div>
                ) : (
                  reviews.map((r: any, i: number) => (
                    <div key={i} style={{ padding: 20, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{r.name}</p>
                          <StarRating rating={r.rating} size={12} />
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.date}</span>
                      </div>
                      <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{r.text}"</p>
                    </div>
                  ))
                )}
              </div>

              {/* Review Form */}
              <div style={{ padding: 24, border: '1px solid var(--border-default)', borderRadius: 6, background: 'var(--bg-base)' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 18 }}>
                  Write a Review
                </h3>
                {!user && (
                  <div style={{ padding: '12px 16px', background: 'rgba(201,149,109,0.08)', border: '1px solid rgba(201,149,109,0.2)', borderRadius: 6, marginBottom: 16, fontSize: 12, color: 'var(--accent)' }}>
                    🔒 Please log in to your account to write a review.
                  </div>
                )}
                {reviewError && (
                  <div style={{ padding: '10px 14px', background: 'rgba(224,90,90,0.08)', borderLeft: '3px solid var(--danger, #E05A5A)', color: 'var(--danger, #E05A5A)', fontSize: 12, borderRadius: 3, marginBottom: 16 }}>
                    {reviewError}
                  </div>
                )}
                <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={reviewName}
                      onChange={(e) => setReviewName(e.target.value)}
                      required
                      readOnly={!!user}
                      disabled={!user}
                      className="input-field"
                      style={{ background: !!user ? 'var(--bg-elevated)' : 'var(--bg-surface)' }}
                    />
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      disabled={!user}
                      className="input-field"
                    >
                      {[5,4,3,2,1].map(s => <option key={s} value={s}>{'⭐'.repeat(s)} — {s} Stars</option>)}
                    </select>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Share your experience..."
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    required
                    disabled={!user || reviewLoading}
                    className="input-field"
                    style={{ resize: 'vertical' }}
                  />
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={!user || reviewLoading}
                    style={{
                      alignSelf: 'flex-start',
                      opacity: (!user || reviewLoading) ? 0.6 : 1,
                      cursor: (!user || reviewLoading) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {reviewLoading ? 'Posting...' : 'Post Review'} <ArrowRight size={13} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ QUESTIONS & ANSWERS ═══════════════════════════════════════════ */}
      <section style={{ padding: '72px 0', background: 'var(--bg-base)', borderTop: '1px solid var(--border-default)' }}>
        <div className="container-lg">
          <div className="pdp-reviews-grid">
            {/* Left Side: Summary & Ask box */}
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 16 }}>
                Questions & Answers
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 24 }}>
                Have a question about formulations, ingredients, or suitability? Ask our skincare specialists or check answers from our community.
              </p>

              <div style={{ padding: 20, border: '1px solid var(--border-default)', borderRadius: 6, background: 'var(--bg-surface)' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 14 }}>
                  Ask a Question
                </h3>
                {qnaError && (
                  <div style={{ padding: '8px 12px', background: 'rgba(224,90,90,0.08)', borderLeft: '3px solid var(--danger, #E05A5A)', color: 'var(--danger, #E05A5A)', fontSize: 11, borderRadius: 3, marginBottom: 12 }}>
                    {qnaError}
                  </div>
                )}
                {qnaSuccess && (
                  <div style={{ padding: '8px 12px', background: 'rgba(76,175,130,0.08)', borderLeft: '3px solid var(--success, #4CAF82)', color: 'var(--success, #4CAF82)', fontSize: 11, borderRadius: 3, marginBottom: 12 }}>
                    ✓ Question posted successfully.
                  </div>
                )}
                <form onSubmit={handleAskQuestion} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <textarea
                    rows={3}
                    placeholder={user ? "What would you like to know?" : "Please sign in to ask a question..."}
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    required
                    disabled={!user || qnaLoading}
                    className="input-field"
                    style={{ resize: 'none', fontSize: 12.5 }}
                  />
                  <button
                    type="submit"
                    disabled={!user || qnaLoading}
                    className="btn-primary"
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: 11,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      opacity: (!user || qnaLoading) ? 0.6 : 1,
                      cursor: (!user || qnaLoading) ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {qnaLoading ? 'Posting...' : 'Ask Question'}
                  </button>
                </form>
              </div>
            </div>

            {/* Right Side: Questions list */}
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {qnas.length === 0 ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 6, color: 'var(--text-muted)' }}>
                    <HelpCircleIcon size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p style={{ fontSize: 13, fontStyle: 'italic' }}>No questions asked yet. Be the first to ask!</p>
                  </div>
                ) : (
                  qnas.map((q: any) => (
                    <div key={q.id} style={{ padding: 22, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Q: {q.question}</h4>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>{q.date}</span>
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>Asked by: {q.askedBy}</p>

                      {q.answer ? (
                        <div style={{ background: 'var(--bg-surface)', borderLeft: '3px solid var(--accent)', padding: '12px 16px', borderRadius: '0 6px 6px 0' }}>
                          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                            <strong>A:</strong> {q.answer}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 6 }}>
                            ✓ Answered by Beauty Glowry Dermatologist
                          </p>
                        </div>
                      ) : (
                        <div style={{ background: 'rgba(201,149,109,0.03)', borderLeft: '3px solid var(--border-default)', padding: '10px 16px', borderRadius: '0 6px 6px 0', fontSize: 11.5, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          ⌛ Question is pending review by our skincare experts.
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ RELATED PRODUCTS ═════════════════════════════════════════════ */}
      {related.length > 0 && (
        <section style={{ padding: '72px 0', background: 'var(--bg-elevated)', borderTop: '1px solid var(--border-default)' }}>
          <div className="container-lg">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 400, color: 'var(--text-primary)' }}>
                You May Also Like
              </h2>
              <Link href="/products" className="btn-outline" style={{ fontSize: 12 }}>View All <ArrowRight size={13} /></Link>
            </div>
            <div className="pdp-related-grid">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      <Footer />

      <style>{`
        /* pc-skeleton shimmer animation */
        .pc-skeleton {
          background: linear-gradient(
            90deg,
            var(--bg-elevated) 25%,
            rgba(201,149,109,0.06) 50%,
            var(--bg-elevated) 75%
          );
          background-size: 200% 100%;
          animation: pc-shimmer 1.4s infinite;
        }
        @keyframes pc-shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }

        /* ── Product Detail Page Mobile Responsive ──── */
        .pdp-main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 56px;
          align-items: flex-start;
        }
        .pdp-gallery {
          position: sticky;
          top: 112px;
        }
        .pdp-trust-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0;
          border: 1px solid var(--border-default);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .pdp-reviews-grid {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 56px;
        }
        .pdp-related-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 18px;
        }

        /* ── Tablet (max 900px) */
        @media (max-width: 900px) {
          .pdp-main-grid { grid-template-columns: 1fr; gap: 32px; }
          .pdp-gallery { position: static; top: auto; }
          .pdp-trust-bar { grid-template-columns: repeat(2, 1fr); }
          .pdp-reviews-grid { grid-template-columns: 1fr; gap: 40px; }
          .pdp-related-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
        }

        /* ── Mobile (max 640px) */
        @media (max-width: 640px) {
          .pdp-main-grid { gap: 24px; }
          .pdp-trust-bar {
            grid-template-columns: repeat(2, 1fr);
          }
          .pdp-related-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
        }

        /* ── Mobile buy buttons sticky bar */
        @media (max-width: 640px) {
          .pdp-action-sticky {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            z-index: 40;
            background: var(--bg-surface);
            border-top: 1px solid var(--border-default);
            padding: 12px 16px;
            display: flex;
            gap: 10px;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
          }
        }
      `}</style>
    </>
  );
}
