'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Calendar, Package, ArrowRight } from 'lucide-react';
import { brands, products } from '../../../data/products';
import ProductCard from '../../../components/ProductCard';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';

export default function BrandDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [dbBrands, setDbBrands] = useState<any[]>([]);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then(r => r.json()),
      fetch('/api/brands').then(r => r.json()),
    ])
      .then(([prods, brnds]) => {
        if (Array.isArray(prods)) setDbProducts(prods);
        if (Array.isArray(brnds)) setDbBrands(brnds);
        setLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load data for brand page:', err);
        setLoaded(true);
      });
  }, []);

  const activeBrands = dbBrands.length > 0 ? dbBrands : brands;
  const rawBrand = activeBrands.find((b) => b.id === slug || b.slug === slug);

  const brand = rawBrand ? {
    id: rawBrand.id,
    name: rawBrand.name,
    tagline: rawBrand.tagline || (brands.find(b => b.id === rawBrand.id)?.tagline) || 'Clinical Skincare',
    description: rawBrand.description || (brands.find(b => b.id === rawBrand.id)?.description) || '',
    logo: rawBrand.logo || (brands.find(b => b.id === rawBrand.id)?.logo) || '✦',
    coverImage: (brands.find(b => b.id === rawBrand.id)?.coverImage) || rawBrand.coverImage || 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=1600&auto=format&fit=crop',
    country: (brands.find(b => b.id === rawBrand.id)?.country) || rawBrand.country || 'International',
    founded: (brands.find(b => b.id === rawBrand.id)?.founded) || rawBrand.founded || '2024',
    accentColor: (brands.find(b => b.id === rawBrand.id)?.accentColor) || rawBrand.accentColor || '#C9956D',
  } : null;

  const brandProducts = dbProducts.filter((p) => p.brand === brand?.id);

  if (!loaded) {
    return (
      <>
        <Navbar />
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)' }}>
          <p style={{ color: 'var(--text-muted)' }}>Loading collection...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!brand) {
    return (
      <>
        <Navbar />
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            background: 'var(--bg-base)',
          }}
        >
          <h2
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 36,
              color: 'var(--text-primary)',
            }}
          >
            Brand not found
          </h2>
          <Link href="/brands" className="btn-primary">
            All Brands <ArrowRight size={14} />
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      {/* ── Brand Hero ─────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'relative',
          height: 'clamp(320px, 45vw, 480px)',
          overflow: 'hidden',
          background: '#111',
        }}
      >
        {/* Cover image */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${brand.coverImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.35)',
          }}
        />

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom, transparent 30%, rgba(26,26,24,0.9) 100%)`,
          }}
        />

        {/* Back button */}
        <div className="container-lg" style={{ position: 'relative', zIndex: 2, paddingTop: 100 }}>
          <Link
            href="/brands"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: 'rgba(250,247,242,0.6)',
              textDecoration: 'none',
              textTransform: 'uppercase',
              transition: 'color 0.2s',
              marginBottom: 32,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#FAF7F2')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(250,247,242,0.6)')}
          >
            <ArrowLeft size={14} /> All Brands
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 24 }}>
            {/* Logo circle */}
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `${brand.accentColor}28`,
                border: `2px solid ${brand.accentColor}80`,
                backdropFilter: 'blur(16px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                flexShrink: 0,
              }}
            >
              {brand.logo}
            </div>

            <div>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: brand.accentColor,
                  marginBottom: 8,
                }}
              >
                {brand.tagline}
              </p>
              <h1
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 'clamp(32px, 5vw, 52px)',
                  fontWeight: 400,
                  color: '#FAF7F2',
                  lineHeight: 1.05,
                  marginBottom: 12,
                }}
              >
                {brand.name}
              </h1>
              <div style={{ display: 'flex', gap: 20 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(250,247,242,0.55)' }}>
                  <MapPin size={12} /> {brand.country}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(250,247,242,0.55)' }}>
                  <Calendar size={12} /> Est. {brand.founded}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'rgba(250,247,242,0.55)' }}>
                  <Package size={12} /> {brandProducts.length} formulations
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Brand Info Strip ───────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-default)',
          padding: '28px 0',
        }}
      >
        <div className="container-lg">
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, maxWidth: 680 }}>
            {brand.description}
          </p>
        </div>
      </div>

      {/* ── Products ──────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg-base)', paddingTop: 48, paddingBottom: 100 }}>
        <div className="container-lg">
          {/* Header row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 32,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 'clamp(24px, 4vw, 36px)',
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                  marginBottom: 4,
                }}
              >
                {brand.name} Collection
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {brandProducts.length} formulation{brandProducts.length !== 1 ? 's' : ''} available
              </p>
            </div>
            <Link
              href="/brands"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <ArrowLeft size={13} /> All Brands
            </Link>
          </div>

          {/* Accent divider */}
          <div
            style={{
              height: 2,
              width: 48,
              background: brand.accentColor,
              borderRadius: 2,
              marginBottom: 36,
            }}
          />

          {!loaded ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Loading collection...</p>
            </div>
          ) : brandProducts.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 20px',
                border: '1px dashed var(--border-default)',
                borderRadius: 10,
              }}
            >
              <Package size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px', opacity: 0.4 }} />
              <h3
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 26,
                  color: 'var(--text-primary)',
                  marginBottom: 8,
                }}
              >
                No products yet
              </h3>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 28 }}>
                This brand's formulations will appear here once listed.
              </p>
              <Link href="/products" className="btn-primary">
                Browse All Products <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="brand-products-grid">
              {brandProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Browse more CTA */}
          {brandProducts.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 56 }}>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
                Looking for products from other brands?
              </p>
              <Link href="/brands" className="btn-ghost">
                <ArrowLeft size={14} /> View All Brands
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />

      <style>{`
        .brand-products-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        @media (max-width: 1024px) {
          .brand-products-grid { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 768px) {
          .brand-products-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
        }
        @media (max-width: 420px) {
          .brand-products-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        }
      `}</style>
    </>
  );
}
