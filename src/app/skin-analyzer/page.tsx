'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Camera, Upload, Sparkles, Check, AlertCircle, RefreshCw,
  ShoppingBag, Star, ShieldAlert, Heart, Info, ArrowRight, Home, Trash2
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import { useCartStore } from '../../store/useCartStore';
import { products as localProducts } from '../../data/products';

// Diagnostic concern translations and styling mappings
const CONCERN_CONFIG: Record<string, { label: string; iconColor: string; bg: string; border: string }> = {
  acne: { label: 'Acne (ব্রণ)', iconColor: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)' },
  darkSpots: { label: 'Dark Spots (মেছতা/দাগ)', iconColor: '#C9956D', bg: 'rgba(201, 149, 109, 0.1)', border: 'rgba(201, 149, 109, 0.25)' },
  oiliness: { label: 'Oiliness (তৈলাক্ততা)', iconColor: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)' },
  redness: { label: 'Redness (লালচে ভাব)', iconColor: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)', border: 'rgba(220, 38, 38, 0.25)' },
  fineLines: { label: 'Fine Lines (বলিরেখা)', iconColor: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)', border: 'rgba(139, 92, 246, 0.25)' },
  pores: { label: 'Pores Visibility (রোমকূপ)', iconColor: '#10B981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)' },
  hydration: { label: 'Skin Hydration (আর্দ্রতা)', iconColor: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', border: 'rgba(59, 130, 246, 0.25)' },
  darkCircles: { label: 'Dark Circles (ডার্ক সার্কেল)', iconColor: '#6B7280', bg: 'rgba(107, 114, 128, 0.1)', border: 'rgba(107, 114, 128, 0.25)' },
  barrier: { label: 'Skin Barrier (ব্যারিয়ার)', iconColor: '#14B8A6', bg: 'rgba(20, 184, 166, 0.1)', border: 'rgba(20, 184, 166, 0.25)' }
};

export default function SkinAnalyzerPage() {
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const { addToCart } = useCartStore();

  // Webcam & Upload States
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [hoveredMarker, setHoveredMarker] = useState<string | null>(null);
  const [cartSuccess, setCartSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Load database products
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setDbProducts(data);
        else setDbProducts(localProducts);
      })
      .catch(() => setDbProducts(localProducts));
  }, []);

  // Shutdown camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError('');
    setIsCameraActive(true);
    setCapturedImage(null);
    setResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 640 }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (e: any) {
      console.error('Camera access failed:', e);
      setError('Could not access front camera. Please select file upload instead.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    
    // Create canvas matching video square dimensions
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror horizontal coordinates to look normal
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setCapturedImage(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError('');
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size too large. Please select a photo smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCapturedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    setError('');
    try {
      const res = await fetch('/api/skin-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: capturedImage })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Diagnostic scan failed.');
      }
      setResult(data);
    } catch (e: any) {
      setError(e.message || 'Server error. Failed to analyze skin.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Resolve matching recommended database products
  const recommendedRoutineProducts = useMemo(() => {
    if (!result || !result.routineRecommendations) return { am: [], pm: [] };

    const amCategories = result.routineRecommendations.am || [];
    const pmCategories = result.routineRecommendations.pm || [];

    // Skin type and concerns from AI result
    const skinType: string = result.skinType || (result.analysis.oiliness.score > 60 ? 'Oily' : result.analysis.hydration.score < 50 ? 'Dry' : 'Normal');
    const concernTags: string[] = result.concernTags || [];

    // Score each product by relevance to the customer's skin analysis
    const scoreProduct = (p: any): number => {
      let score = 0;
      const pSkinTypes: string[] = (p.skinTypes || []).map((s: string) => s.toLowerCase());
      const pConcerns: string[] = (p.concerns || []).map((s: string) => s.toLowerCase());

      // +3 if skin type matches
      if (pSkinTypes.some(st => st.includes(skinType.toLowerCase()) || skinType.toLowerCase().includes(st) || st === 'all skin types')) {
        score += 3;
      }

      // +2 for each concern tag that matches product concerns
      concernTags.forEach(tag => {
        const tagLower = tag.toLowerCase();
        if (pConcerns.some(c => c.includes(tagLower.split(' ')[0]) || tagLower.includes(c.split(' ')[0]))) {
          score += 2;
        }
      });

      // +1 for featured/bestseller products
      if (p.isBestseller || p.isFeatured) score += 1;

      return score;
    };

    const resolveProductsForCategories = (categoriesList: string[]) => {
      const selected: any[] = [];
      const usedIds = new Set<any>();

      categoriesList.forEach(category => {
        // Match by category name
        const matches = dbProducts.filter((p: any) => {
          const catName = (p.category?.name || p.category || '').toLowerCase();
          return catName === category.toLowerCase();
        });

        if (matches.length > 0) {
          // Sort by relevance score descending
          const sorted = [...matches].sort((a, b) => scoreProduct(b) - scoreProduct(a));
          const best = sorted.find(p => !usedIds.has(p.id)) || sorted[0];
          if (best && !usedIds.has(best.id)) {
            selected.push(best);
            usedIds.add(best.id);
          }
        }
      });
      return selected;
    };

    return {
      am: resolveProductsForCategories(amCategories),
      pm: resolveProductsForCategories(pmCategories)
    };
  }, [result, dbProducts]);

  const handleAddAllToCart = () => {
    const all = [...recommendedRoutineProducts.am, ...recommendedRoutineProducts.pm];
    const uniqueIds = Array.from(new Set(all.map(p => p.id)));
    
    uniqueIds.forEach(id => {
      const prod = all.find(p => p.id === id);
      if (prod) addToCart(prod);
    });

    setCartSuccess(true);
    setTimeout(() => setCartSuccess(false), 3000);
  };

  return (
    <>
      <Navbar />
      <main style={{ background: 'var(--bg-base)', minHeight: '100vh', padding: '40px 0 100px' }}>
        <div className="container-lg">
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(201,149,109,0.12)', padding: '4px 12px', borderRadius: 20 }}>
              Clinical Skin Scanner
            </span>
            <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 700, color: 'var(--text-primary)', margin: '12px 0 6px' }}>
              AI Face Skin Analyzer
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 540, margin: '0 auto', lineHeight: 1.5 }}>
              Take a selfie or upload a photo to analyze pore congestion, dark spot indices, barrier damage, and construct a personalized skincare routine.
            </p>
          </div>

          {error && (
            <div style={{ maxWidth: 640, margin: '0 auto 24px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 10, alignItems: 'center', color: '#EF4444', fontSize: 14 }}>
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            /* Stage 1: Capture or Upload */
            <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 24,
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.02)',
                aspectRatio: '1/1',
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}>
                {isCameraActive ? (
                  /* Camera Feed */
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                  />
                ) : capturedImage ? (
                  /* Image Preview */
                  <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                    <img src={capturedImage} alt="Captured preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    {isAnalyzing && (
                      /* Laser Scan Animation overlay */
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.3)',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          height: 4,
                          background: 'linear-gradient(to bottom, #10B981, rgba(16,185,129,0.3))',
                          boxShadow: '0 0 15px #10B981, 0 0 5px rgba(16,185,129,0.8)',
                          animation: 'scanner-laser 1.8s infinite ease-in-out'
                        }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.4)', fontFamily: "'DM Mono', monospace" }}>
                          AI SCANNING COMPLEXION...
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Empty state placeholder */
                  <div style={{ textAlign: 'center', padding: 40 }}>
                    <Camera size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Select front camera or upload portrait photo</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12 }}>
                {!isCameraActive ? (
                  <>
                    <button
                      onClick={startCamera}
                      style={{
                        flex: 1, padding: '14px 0', borderRadius: 14, border: 'none', background: 'var(--accent)',
                        color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: '0 6px 20px rgba(201,149,109,0.3)', transition: 'transform 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Camera size={18} /> Take Selfie
                    </button>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isAnalyzing}
                      style={{
                        flex: 1, padding: '14px 0', borderRadius: 14, border: '1px solid var(--border-default)', background: 'var(--bg-surface)',
                        color: 'var(--text-primary)', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                    >
                      <Upload size={18} /> Upload Photo
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                  </>
                ) : (
                  <>
                    <button
                      onClick={capturePhoto}
                      style={{
                        flex: 2, padding: '14px 0', borderRadius: 14, border: 'none', background: '#10B981',
                        color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        boxShadow: '0 6px 20px rgba(16,185,129,0.3)'
                      }}
                    >
                      Capture Photo
                    </button>
                    <button
                      onClick={stopCamera}
                      style={{
                        flex: 1, padding: '14px 0', borderRadius: 14, border: '1px solid var(--border-default)', background: 'var(--bg-surface)',
                        color: 'var(--text-muted)', fontSize: 14, fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>

              {capturedImage && !isAnalyzing && (
                <button
                  onClick={runAnalysis}
                  style={{
                    width: '100%', padding: '16px 0', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 6px 22px rgba(16,185,129,0.3)', letterSpacing: '0.03em'
                  }}
                >
                  <Sparkles size={18} /> START SKIN DIAGNOSIS
                </button>
              )}
            </div>
          ) : (
            /* Stage 2: Diagnostic Dashboard Results */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              {/* Reset button bar */}
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <button
                  onClick={() => { setResult(null); setCapturedImage(null); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid var(--border-default)',
                    color: 'var(--text-muted)', padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <RefreshCw size={13} /> Retake / Upload New Selfie
                </button>
              </div>

              {/* Main diagnostics layout */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 30 }} className="pdp-main-grid">
                
                {/* Left Side: Selfie image with overlay pointers */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                    borderRadius: 24, padding: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
                  }}>
                    <div style={{ position: 'relative', aspectRatio: '1/1', borderRadius: 16, overflow: 'hidden', background: '#333' }}>
                      <img src={capturedImage || ''} alt="Analyzed Selfie" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      {/* Render markers */}
                      {Object.entries(result.analysis).map(([key, data]: any) => {
                        if (!data.coords) return null;
                        const config = CONCERN_CONFIG[key] || { iconColor: '#fff' };
                        const isHovered = hoveredMarker === key;

                        return (
                          <div
                            key={key}
                            style={{
                              position: 'absolute',
                              left: `${data.coords[0]}%`,
                              top: `${data.coords[1]}%`,
                              transform: 'translate(-50%, -50%)',
                              zIndex: isHovered ? 100 : 20,
                              cursor: 'pointer'
                            }}
                            onMouseEnter={() => setHoveredMarker(key)}
                            onMouseLeave={() => setHoveredMarker(null)}
                          >
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: isHovered ? config.iconColor : 'rgba(255,255,255,0.7)',
                              border: `2px solid ${isHovered ? '#fff' : config.iconColor}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                              transition: 'all 0.2s',
                              transform: isHovered ? 'scale(1.15)' : 'scale(1)'
                            }}>
                              <span style={{ fontSize: 9, fontWeight: 800, color: isHovered ? '#fff' : config.iconColor }}>
                                !
                              </span>
                            </div>
                            
                            {/* Hover info tooltip */}
                            {isHovered && (
                              <div style={{
                                position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
                                background: '#120e0b', color: '#fff', padding: '6px 12px', borderRadius: 8,
                                fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', pointerEvents: 'none',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)'
                              }}>
                                {config.label}: {data.score}%
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Diagnostic details highlight card */}
                  <div style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                    borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', gap: 8
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                      Overall Health Score
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 36, fontWeight: 900, fontFamily: "'Cormorant Garamond', serif", color: 'var(--accent)' }}>
                        {result.overallRating}/100
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Complexion Index</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, borderTop: '1px solid var(--border-subtle)', paddingTop: 10, marginTop: 4 }}>
                      {result.overallComment}
                    </p>
                  </div>
                </div>

                {/* Right Side: Severity bars index */}
                <div style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                  borderRadius: 24, padding: 24, display: 'flex', flexDirection: 'column', gap: 20,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
                }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Skin Condition Analysis
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {Object.entries(result.analysis).map(([key, data]: any) => {
                      const cfg = CONCERN_CONFIG[key] || { label: key, iconColor: '#C9956D', bg: 'rgba(201,149,109,0.1)', border: 'rgba(201,149,109,0.25)' };
                      const isHovered = hoveredMarker === key;

                      return (
                        <div
                          key={key}
                          onMouseEnter={() => setHoveredMarker(key)}
                          onMouseLeave={() => setHoveredMarker(null)}
                          style={{
                            padding: '12px 14px', borderRadius: 16,
                            background: isHovered ? cfg.bg : 'var(--bg-base)',
                            border: `1.5px solid ${isHovered ? cfg.iconColor : 'transparent'}`,
                            transition: 'all 0.25s ease',
                            display: 'flex', flexDirection: 'column', gap: 8
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)' }}>{cfg.label}</span>
                            <span style={{ fontSize: 12, fontWeight: 800, color: cfg.iconColor }}>{data.score}%</span>
                          </div>
                          
                          {/* Progress bar */}
                          <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'var(--border-subtle)', overflow: 'hidden' }}>
                            <div style={{
                              width: `${data.score}%`, height: '100%', borderRadius: 3,
                              background: cfg.iconColor, transition: 'width 0.8s ease-out'
                            }} />
                          </div>
                          
                          <p style={{ fontSize: 11, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                            {data.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Bottom Recommended Skincare Routine */}
              <div style={{
                background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                borderRadius: 24, padding: 32, boxShadow: '0 12px 40px rgba(0,0,0,0.03)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                      Your Recommended Skincare Routine
                    </h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
                      Formulated dynamically from your diagnostic parameters using our premium database.
                    </p>
                  </div>
                  
                  <button
                    onClick={handleAddAllToCart}
                    style={{
                      background: cartSuccess ? '#10B981' : 'var(--accent)',
                      color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 12,
                      fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                      boxShadow: '0 6px 15px rgba(201,149,109,0.3)', transition: 'background 0.2s'
                    }}
                  >
                    {cartSuccess ? <><Check size={15} /> Routine Added to Bag</> : <><ShoppingBag size={15} /> Add Routine to Cart</>}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }} className="pdp-main-grid">
                  {/* AM Routine */}
                  <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 20, padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                      <span style={{ fontSize: 20 }}>☀️</span>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Morning (AM) Routine</h4>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {recommendedRoutineProducts.am.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No recommendations suited for AM.</p>
                      ) : (
                        recommendedRoutineProducts.am.map((product, idx) => (
                          <div key={product.id} style={{ display: 'flex', gap: 14, padding: 12, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', fontFamily: "'DM Mono', monospace" }}>0{idx + 1}</span>
                            <img src={product.image} alt={product.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.08em' }}>{product.category}</span>
                              <Link href={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
                                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {product.name}
                                </div>
                              </Link>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>৳{product.price}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* PM Routine */}
                  <div style={{ background: 'var(--bg-base)', border: '1px solid var(--border-default)', borderRadius: 20, padding: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                      <span style={{ fontSize: 20 }}>🌙</span>
                      <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Evening (PM) Routine</h4>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {recommendedRoutineProducts.pm.length === 0 ? (
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No recommendations suited for PM.</p>
                      ) : (
                        recommendedRoutineProducts.pm.map((product, idx) => (
                          <div key={product.id} style={{ display: 'flex', gap: 14, padding: 12, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', fontFamily: "'DM Mono', monospace" }}>0{idx + 1}</span>
                            <img src={product.image} alt={product.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span style={{ fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', color: 'var(--accent)', letterSpacing: '0.08em' }}>{product.category}</span>
                              <Link href={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
                                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                  {product.name}
                                </div>
                              </Link>
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>৳{product.price}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )}
        </div>
      </main>
      <Footer />
      <style>{`
        @keyframes scanner-laser {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @media (max-width: 768px) {
          .pdp-main-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
