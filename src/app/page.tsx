'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Star, Leaf, Shield, Truck, RotateCcw, ChevronRight } from 'lucide-react';
import { products, skinConcerns } from '../data/products';
import ProductCard from '../components/ProductCard';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=1600&auto=format&fit=crop",
];

const BRAND_STATS = [
  { value: '10K+', label: 'Happy Customers' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '100%', label: 'Clinically Tested' },
  { value: '6+', label: 'Premium Actives' },
];

const TRUST_ICONS = [
  { icon: <Truck size={22} />, label: 'Free Express Delivery', desc: 'On orders above ৳1,500' },
  { icon: <Shield size={22} />, label: 'Clinically Formulated', desc: 'Dermatologist approved' },
  { icon: <Leaf size={22} />, label: 'Clean Ingredients', desc: 'No harmful additives' },
  { icon: <RotateCcw size={22} />, label: 'Easy Returns', desc: '7-day hassle-free returns' },
];

const CONCERN_ICONS: Record<string, string> = {
  acne: '✦',
  aging: '◆',
  hydration: '◇',
  brightening: '○',
  darkspots: '●',
  sensitive: '△',
};

export default function HomePage() {
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [banners, setBanners] = useState<any[]>([]);
  const [activeSlide, setActiveSlide] = useState(0);
  const [sectionVisibility, setSectionVisibility] = useState<Record<string, boolean>>({
    hero_slider: true,
    categories: true,
    countdown: true,
    bestsellers: true,
    quiz_cta: true,
    new_arrivals: true,
    testimonials: true,
  });

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

    fetch('/api/admin/banners')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const active = data.filter((b) => b.isActive !== false);
          if (active.length > 0) setBanners(active);
        }
      })
      .catch((err) => console.error('Failed to load active banners:', err));

    fetch('/api/admin/homepage-sections')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const map: Record<string, boolean> = {};
          data.forEach((s) => {
            map[s.key] = s.isVisible;
          });
          setSectionVisibility((prev) => ({ ...prev, ...map }));
        }
      })
      .catch((err) => console.error('Failed to load homepage sections:', err));
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [banners]);

  const currentBanner = banners.length > 0 ? banners[activeSlide] : null;

  const displayProducts = dbProducts;
  const bestsellers = displayProducts.filter((p) => p.isBestseller).slice(0, 4);
  const newArrivals = displayProducts.filter((p) => p.isNew).slice(0, 3);

  return (
    <>
      <Navbar />

      {/* ═══ HERO ═══════════════════════════════════════════════════════════════ */}
      {sectionVisibility.hero_slider !== false && (
        <section className="hero-section" style={{ position: 'relative', overflow: 'hidden' }}>
          {/* Background Image */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `url(${currentBanner ? currentBanner.image : HERO_IMAGES[0]})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 30%',
              filter: 'brightness(0.35)',
              transform: 'scale(1.02)',
              transition: 'background-image 0.8s ease-in-out',
            }}
          />

          {/* Gradient overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(135deg, rgba(26,26,24,0.75) 0%, rgba(26,26,24,0.3) 60%, transparent 100%)',
            }}
          />

          {/* Content */}
          <div className="container-lg hero-content-wrap">
            <div className="hero-content">
              <div
                className="animate-fade-up hero-eyebrow"
              >
                <span className="hero-dot" />
                <span className="hero-eyebrow-text">
                  {currentBanner ? 'Special Promotion' : 'Clinical Skincare — Bangladesh'}
                </span>
              </div>

              {currentBanner ? (
                <h1
                  className="animate-fade-up font-editorial hero-title"
                  style={{ animationDelay: '0.1s' }}
                >
                  {currentBanner.title}
                </h1>
              ) : (
                <h1
                  className="animate-fade-up font-editorial hero-title"
                  style={{ animationDelay: '0.1s' }}
                >
                  Science Meets
                  <em style={{ display: 'block', fontStyle: 'italic', color: 'var(--accent, #C9956D)' }}>
                    Luxury Skin
                  </em>
                </h1>
              )}

              <p
                className="animate-fade-up hero-desc"
                style={{ animationDelay: '0.2s' }}
              >
                {currentBanner ? currentBanner.subtitle : 'Dermatologist-formulated active treatments with clinically-proven concentrations. Engineered for measurable results.'}
              </p>

              <div
                className="animate-fade-up hero-cta-row"
                style={{ animationDelay: '0.3s' }}
              >
                <Link href="/products" className="btn-accent">
                  {currentBanner ? currentBanner.cta : 'Shop All Formulations'} <ArrowRight size={15} />
                </Link>
                <Link
                  href="/quiz"
                  className="hero-quiz-btn"
                >
                  Skin Quiz
                </Link>
              </div>

              {/* Carousel Indicators */}
              {banners.length > 1 && (
                <div style={{
                  position: 'absolute', bottom: 30, right: 30, zIndex: 10,
                  display: 'flex', gap: 8, background: 'rgba(0,0,0,0.3)', padding: '8px 14px',
                  borderRadius: 20, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  {banners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      style={{
                        width: 8, height: 8, borderRadius: '50%', border: 'none',
                        background: activeSlide === idx ? 'var(--accent, #C9956D)' : 'rgba(255,255,255,0.35)',
                        cursor: 'pointer', transition: 'all 0.25s', padding: 0
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Stats Row */}
              <div
                className="animate-fade-up hero-stats"
                style={{ animationDelay: '0.4s' }}
              >
                {BRAND_STATS.map((stat) => (
                  <div key={stat.label} className="hero-stat-item">
                    <div className="hero-stat-value">
                      {stat.value}
                    </div>
                    <div className="hero-stat-label">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Scroll Indicator — hidden on mobile */}
          <div className="hero-scroll-indicator">
            <div style={{ width: 1, height: 56, background: 'rgba(250,247,242,0.2)' }} />
            Scroll
          </div>
        </section>
      )}

      {/* ═══ TRUST BAR ══════════════════════════════════════════════════════════ */}
      {sectionVisibility.countdown !== false && (
        <section style={{ borderTop: '1px solid var(--border-default)', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
          <div className="container-lg">
            <div className="trust-grid">
              {TRUST_ICONS.map((item, i) => (
                <div
                  key={item.label}
                  className="trust-item"
                >
                  <div style={{ color: 'var(--accent)', flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{item.label}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ SKIN CONCERNS ══════════════════════════════════════════════════════ */}
      {sectionVisibility.categories !== false && (
        <section className="section-md" style={{ background: 'var(--bg-base)' }}>
          <div className="container-lg">
            <div className="section-header">
              <div>
                <p className="section-eyebrow" style={{ color: 'var(--accent)' }}>Targeted Solutions</p>
                <h2
                  className="font-editorial section-heading"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontWeight: 400,
                    color: 'var(--text-primary)',
                    lineHeight: 1.1,
                  }}
                >
                  What's Your
                  <br />
                  <em style={{ fontStyle: 'italic' }}>Skin Concern?</em>
                </h2>
              </div>
              <Link
                href="/products"
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexShrink: 0,
                }}
                className="link-underline"
              >
                All Products <ArrowRight size={14} />
              </Link>
            </div>

            <div className="concern-grid">
              {skinConcerns.map((concern) => (
                <Link
                  key={concern.id}
                  href={`/products?concern=${encodeURIComponent(concern.name)}`}
                  className="concern-item"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-default)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <span className="concern-icon">
                    {CONCERN_ICONS[concern.id] || '✦'}
                  </span>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{concern.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Shop targeted formulations</p>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)', marginLeft: 'auto' }} />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ BESTSELLERS ════════════════════════════════════════════════════════ */}
      {sectionVisibility.bestsellers !== false && (
        <section className="section-lg" style={{ background: 'var(--bg-elevated)' }}>
          <div className="container-lg">
            <div className="section-header" style={{ marginBottom: 48 }}>
              <div>
                <p className="section-eyebrow" style={{ color: 'var(--accent)' }}>Most Loved</p>
                <h2
                  className="font-editorial section-heading"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontWeight: 400,
                    color: 'var(--text-primary)',
                    lineHeight: 1.1,
                  }}
                >
                  Bestselling
                  <br />
                  <em style={{ fontStyle: 'italic' }}>Formulations</em>
                </h2>
              </div>
              <Link href="/products" className="btn-outline section-header-link">
                View All <ArrowRight size={14} />
              </Link>
            </div>

            <div className="bestsellers-grid">
              {!loaded ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} style={{
                    height: 380,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 10,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div className="pc-skeleton" style={{ height: '70%' }} />
                    <div style={{ padding: 15 }}>
                      <div className="pc-skeleton" style={{ height: 15, width: '40%', marginBottom: 10 }} />
                      <div className="pc-skeleton" style={{ height: 20, width: '90%', marginBottom: 10 }} />
                      <div className="pc-skeleton" style={{ height: 15, width: '60%' }} />
                    </div>
                  </div>
                ))
              ) : (
                bestsellers.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ BRAND STORY BANNER ═════════════════════════════════════════════════ */}
      {sectionVisibility.brand_story !== false && (
        <section style={{ position: 'relative', overflow: 'hidden', background: 'var(--text-primary)', padding: '80px 0' }}>
          <div className="container-lg">
            <div className="brand-story-grid">
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'var(--accent)',
                    marginBottom: 16,
                  }}
                >
                  Our Philosophy
                </p>
                <h2
                  className="font-editorial brand-story-heading"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontWeight: 400,
                    color: 'var(--bg-base)',
                    lineHeight: 1.1,
                    marginBottom: 24,
                  }}
                >
                  Formulated with
                  <em style={{ display: 'block', fontStyle: 'italic', color: 'var(--accent)' }}>
                    Precision & Purpose
                  </em>
                </h2>
                <p style={{ fontSize: 15, lineHeight: 1.8, color: 'rgba(250,247,242,0.6)', marginBottom: 36 }}>
                  Every formula begins with peer-reviewed research and ends with your skin's transformation.
                  We believe in full transparency — every active ingredient declared, every percentage proven.
                </p>
                <Link href="/quiz" className="btn-accent">
                  Take the Skin Quiz <ArrowRight size={14} />
                </Link>
              </div>

              <div className="brand-story-images">
                {[
                  'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop',
                  'https://images.unsplash.com/photo-1608248597309-45da1707ad33?q=80&w=800&auto=format&fit=crop',
                  'https://images.unsplash.com/photo-1612817288484-6f916006741a?q=80&w=800&auto=format&fit=crop',
                  'https://images.unsplash.com/photo-1617897903246-719242758050?q=80&w=800&auto=format&fit=crop',
                ].map((img, i) => (
                  <div
                    key={i}
                    style={{
                      borderRadius: 4,
                      overflow: 'hidden',
                      aspectRatio: '1',
                      transform: i % 2 === 0 ? 'translateY(-12px)' : 'translateY(12px)',
                    }}
                  >
                    <img src={img} alt="Brand story" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ NEW ARRIVALS ════════════════════════════════════════════════════════ */}
      {sectionVisibility.new_arrivals !== false && newArrivals.length > 0 && (
        <section className="section-lg" style={{ background: 'var(--bg-base)' }}>
          <div className="container-lg">
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--sage)',
                  marginBottom: 10,
                }}
              >
                Fresh From The Lab
              </p>
              <h2
                className="font-editorial section-heading"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                }}
              >
                New Formulations
              </h2>
            </div>
            <div className="new-arrivals-grid">
              {!loaded ? (
                Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} style={{
                    height: 380,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 10,
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div className="pc-skeleton" style={{ height: '70%' }} />
                    <div style={{ padding: 15 }}>
                      <div className="pc-skeleton" style={{ height: 15, width: '40%', marginBottom: 10 }} />
                      <div className="pc-skeleton" style={{ height: 20, width: '90%', marginBottom: 10 }} />
                      <div className="pc-skeleton" style={{ height: 15, width: '60%' }} />
                    </div>
                  </div>
                ))
              ) : (
                newArrivals.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* ═══ TESTIMONIALS ════════════════════════════════════════════════════════ */}
      {sectionVisibility.testimonials !== false && (
        <section className="section-md" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-default)' }}>
          <div className="container-md">
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2
                className="font-editorial section-heading"
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                }}
              >
                What Our Customers Say
              </h2>
            </div>

            <div className="testimonials-grid">
              {[
                {
                  name: 'Nusrat Rahman',
                  skin: 'Oily, Acne-Prone',
                  review: "The Niacinamide 10% serum completely transformed my skin. My pores have tightened and the stubborn blemishes are finally fading after just 3 weeks.",
                  rating: 5,
                  product: 'Niacinamide 10% Serum',
                },
                {
                  name: 'Farida Akter',
                  skin: 'Combination',
                  review: "I was skeptical about clinical skincare at first, but Beauty Glowry's Vitamin C emulsion proved me wrong. My skin tone is visibly more even now.",
                  rating: 5,
                  product: 'Vitamin C 15% Emulsion',
                },
                {
                  name: 'Shahadat Hossain',
                  skin: 'Dry, Sensitive',
                  review: "The Ceramide cream is a lifesaver. My dry patches disappeared within a week and my skin barrier feels so much stronger. Will repurchase always.",
                  rating: 5,
                  product: 'Ceramide Barrier Cream',
                },
              ].map((t, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 4,
                    padding: 28,
                  }}
                >
                  <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                    {Array.from({ length: t.rating }).map((_, si) => (
                      <Star key={si} size={13} style={{ fill: '#C9956D', color: '#C9956D' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 20, fontStyle: 'italic' }}>
                    "{t.review}"
                  </p>
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t.skin} skin</p>
                    </div>
                    <span className="badge-active">{t.product.split(' ').slice(0, 2).join(' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ SKIN QUIZ CTA ═══════════════════════════════════════════════════════ */}
      {sectionVisibility.quiz_cta !== false && (
        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            padding: '100px 0',
            background: 'var(--bg-elevated)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '120%',
              height: '120%',
              backgroundImage: 'radial-gradient(ellipse at center, rgba(201,149,109,0.08) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <div className="container-md" style={{ position: 'relative' }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--sage)',
                marginBottom: 16,
              }}
            >
              Personalized Skincare
            </p>
            <h2
              className="font-editorial"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 'clamp(36px, 5vw, 60px)',
                fontWeight: 400,
                color: 'var(--text-primary)',
                lineHeight: 1.1,
                marginBottom: 20,
              }}
            >
              Not Sure Which
              <em style={{ display: 'block', fontStyle: 'italic', color: 'var(--accent)' }}>
                Formula is Right for You?
              </em>
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 480, margin: '0 auto 40px' }}>
              Take our 5-step clinical skin assessment and receive a personalized routine
              tailored to your exact skin profile.
            </p>
            <Link href="/quiz" className="btn-primary" style={{ fontSize: 14, padding: '16px 40px' }}>
              Start Your Skin Quiz <ArrowRight size={16} />
            </Link>
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

        /* ── Hero ───────────────────────────────────────── */
        .hero-section {
          position: relative;
          min-height: 92vh;
          display: flex;
          align-items: center;
          overflow: hidden;
          background: var(--cream, #F5EFE6);
        }
        .hero-content-wrap {
          position: relative;
          z-index: 2;
        }
        .hero-content {
          max-width: 620px;
        }
        .hero-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(201,149,109,0.15);
          border: 1px solid rgba(201,149,109,0.4);
          padding: 6px 16px;
          border-radius: 2px;
          margin-bottom: 28px;
        }
        .hero-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: var(--accent, #C9956D);
          display: inline-block;
        }
        .hero-eyebrow-text {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--rose-gold-light, #DEB896);
        }
        .hero-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(42px, 7vw, 88px);
          font-weight: 400;
          line-height: 1.05;
          letter-spacing: -0.01em;
          color: #FAF7F2;
          margin-bottom: 28px;
        }
        .hero-desc {
          font-size: 16px;
          line-height: 1.75;
          color: rgba(250,247,242,0.72);
          margin-bottom: 40px;
          max-width: 480px;
        }
        .hero-cta-row {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
        }
        .hero-quiz-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 14px 28px;
          background: rgba(250,247,242,0.1);
          color: #FAF7F2;
          border: 1px solid rgba(250,247,242,0.3);
          border-radius: 2px;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          backdrop-filter: blur(8px);
          transition: all 0.25s ease;
        }
        .hero-quiz-btn:hover {
          background: rgba(250,247,242,0.2);
        }
        .hero-stats {
          display: flex;
          gap: 40px;
          margin-top: 56px;
          padding-top: 40px;
          border-top: 1px solid rgba(250,247,242,0.12);
          flex-wrap: wrap;
        }
        .hero-stat-item {}
        .hero-stat-value {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 32px;
          font-weight: 600;
          color: var(--accent, #C9956D);
          line-height: 1;
          margin-bottom: 4px;
        }
        .hero-stat-label {
          font-size: 11px;
          color: rgba(250,247,242,0.5);
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .hero-scroll-indicator {
          position: absolute;
          bottom: 32px;
          right: 48px;
          display: flex;
          align-items: center;
          gap: 10px;
          color: rgba(250,247,242,0.4);
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        /* ── Section common ─────────────────────────────── */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
          gap: 16px;
        }
        .section-eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .section-heading {
          font-size: 40px;
        }

        /* ── Trust bar ──────────────────────────────────── */
        .trust-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
        }
        .trust-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 24px 20px;
          border-right: 1px solid var(--border-default);
        }
        .trust-item:last-child {
          border-right: none;
        }

        /* ── Skin concerns ──────────────────────────────── */
        .concern-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .concern-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px 24px;
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 4px;
          text-decoration: none;
          transition: all 0.25s ease;
          position: relative;
          overflow: hidden;
        }
        .concern-icon {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px;
          color: var(--accent);
          line-height: 1;
          width: 36px;
          flex-shrink: 0;
          text-align: center;
        }

        /* ── Bestsellers ────────────────────────────────── */
        .bestsellers-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        /* ── New Arrivals ───────────────────────────────── */
        .new-arrivals-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        /* ── Brand Story ────────────────────────────────── */
        .brand-story-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }
        .brand-story-heading {
          font-size: 52px;
        }
        .brand-story-images {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* ── Testimonials ───────────────────────────────── */
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        /* ── Section header link ────────────────────────── */
        .section-header-link {
          flex-shrink: 0;
        }

        /* ═══════════════════════════════════════════════════
           TABLET — 900px
        ═══════════════════════════════════════════════════ */
        @media (max-width: 900px) {
          .trust-grid { grid-template-columns: repeat(2, 1fr); }
          .trust-item { border-right: none; border-bottom: 1px solid var(--border-default); }
          .trust-item:nth-child(odd) { border-right: 1px solid var(--border-default); }
          .trust-item:nth-last-child(-n+2) { border-bottom: none; }
          .bestsellers-grid { grid-template-columns: repeat(2, 1fr); }
          .concern-grid { grid-template-columns: repeat(2, 1fr); }
          .brand-story-grid { grid-template-columns: 1fr; gap: 40px; }
          .brand-story-heading { font-size: 38px; }
          .testimonials-grid { grid-template-columns: 1fr 1fr; }
          .section-heading { font-size: 34px; }
          .hero-stats { gap: 24px; margin-top: 40px; }
          .hero-stat-value { font-size: 26px; }
        }

        /* ═══════════════════════════════════════════════════
           MOBILE — 640px
        ═══════════════════════════════════════════════════ */
        @media (max-width: 640px) {
          .hero-section { min-height: 85svh; }
          .hero-content-wrap { padding-top: 20px; padding-bottom: 40px; }
          .hero-title { font-size: clamp(32px, 9vw, 48px); margin-bottom: 16px; }
          .hero-desc { font-size: 13px; margin-bottom: 24px; max-width: 100%; }
          .hero-eyebrow { margin-bottom: 16px; padding: 5px 12px; }
          .hero-eyebrow-text { font-size: 10px; }
          .hero-cta-row { flex-direction: column; gap: 10px; }
          .hero-cta-row a, .hero-cta-row .btn-accent { width: 100%; justify-content: center; text-align: center; }
          .hero-stats {
            gap: 0;
            margin-top: 28px;
            padding-top: 20px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            border-top: 1px solid rgba(250,247,242,0.12);
          }
          .hero-stat-item {
            padding: 12px 8px;
            border-right: 1px solid rgba(250,247,242,0.1);
            border-bottom: 1px solid rgba(250,247,242,0.1);
          }
          .hero-stat-item:nth-child(even) { border-right: none; }
          .hero-stat-item:nth-last-child(-n+2) { border-bottom: none; }
          .hero-stat-value { font-size: 20px; margin-bottom: 2px; }
          .hero-stat-label { font-size: 9px; }
          .hero-scroll-indicator { display: none; }

          .section-header { flex-direction: column; align-items: flex-start; margin-bottom: 24px; }
          .section-header-link { display: none; }
          .section-heading { font-size: 26px; }
          .section-eyebrow { margin-bottom: 6px; }

          /* Trust bar: 2x2 grid on mobile instead of long list */
          .trust-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            border: 1px solid var(--border-default);
            border-radius: 6px;
            overflow: hidden;
          }
          .trust-item {
            border-right: none !important;
            border-bottom: 1px solid var(--border-default) !important;
            padding: 16px 12px;
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
          .trust-item:nth-child(odd) { border-right: 1px solid var(--border-default) !important; }
          .trust-item:nth-last-child(-n+2) { border-bottom: none !important; }

          /* Concern grid: 2 columns on mobile */
          .concern-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .concern-item { padding: 14px 12px; gap: 10px; flex-direction: column; align-items: flex-start; }
          .concern-item > svg { display: none; }
          .concern-icon { font-size: 22px; width: 28px; }

          .bestsellers-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }
          .new-arrivals-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; }

          .brand-story-images { display: none; }
          .brand-story-heading { font-size: 28px; }

          .testimonials-grid { grid-template-columns: 1fr; }
        }

        /* ═══════════════════════════════════════════════════
           VERY SMALL — 380px
        ═══════════════════════════════════════════════════ */
        @media (max-width: 380px) {
          .concern-grid { grid-template-columns: 1fr; }
          .bestsellers-grid { grid-template-columns: repeat(2, 1fr); }
          .new-arrivals-grid { grid-template-columns: repeat(2, 1fr); }
          .trust-item { flex-direction: row; align-items: center; }
        }
      `}</style>
    </>
  );
}
