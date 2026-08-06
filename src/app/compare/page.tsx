'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GitCompare, Trash2, ArrowLeft, ShoppingBag, Star, Check, Sparkles, X, User, Award, ShieldAlert
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { products as localProducts } from '../../data/products';

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare, addToCart } = useCartStore();
  const { user } = useAuthStore();
  const router = useRouter();

  // Load products list (database fallback)
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Success indicator for bag additions
  const [successMsg, setSuccessMsg] = useState<Record<string, boolean>>({});

  // Dynamic Skin Profile Matching
  const [userSkinType, setUserSkinType] = useState<string>('');

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDbProducts(data);
        } else {
          setDbProducts(localProducts);
        }
        setLoading(false);
      })
      .catch(() => {
        setDbProducts(localProducts);
        setLoading(false);
      });
  }, []);

  // Initialize skin profile from user storage
  useEffect(() => {
    if (user?.skin_type) {
      setUserSkinType(user.skin_type);
    }
  }, [user]);

  // Resolve compared items
  const comparedItems = useMemo(() => {
    return compareList
      .map(id => dbProducts.find(p => String(p.id) === String(id)))
      .filter(Boolean);
  }, [compareList, dbProducts]);

  // Extract shared ingredients
  const sharedIngredients = useMemo(() => {
    if (comparedItems.length < 2) return [];
    
    const parseIngs = (inci: string) => {
      if (!inci) return [];
      return inci
        .split(',')
        .map((i: string) => i.trim().toLowerCase())
        .filter((i: string) => i.length > 0);
    };

    const firstList = parseIngs(comparedItems[0].inciList || '');
    if (firstList.length === 0) return [];

    return firstList.filter((ing: string) => {
      return comparedItems.every((p: any) => {
        const list = parseIngs(p.inciList || '');
        return list.includes(ing);
      });
    }).map((ing: string) => {
      const orig = (comparedItems[0].inciList || '')
        .split(',')
        .find((i: string) => i.trim().toLowerCase() === ing);
      return orig ? orig.trim() : ing;
    }).slice(0, 8); // top 8 shared
  }, [comparedItems]);

  // Calculate price value per 10ml / 10g
  const valueMetrics = useMemo(() => {
    return comparedItems.map(p => {
      const sizeStr = p.size || '30ml';
      const numMatch = sizeStr.match(/\d+/);
      const sizeNum = numMatch ? Number(numMatch[0]) : 30;
      const pricePerTen = Math.round((p.price / sizeNum) * 10);
      return { id: p.id, pricePerTen };
    });
  }, [comparedItems]);

  // Find the best value product
  const bestValueId = useMemo(() => {
    if (valueMetrics.length < 2) return null;
    const sorted = [...valueMetrics].sort((a, b) => a.pricePerTen - b.pricePerTen);
    return sorted[0]?.id;
  }, [valueMetrics]);

  // Calculate Compatibility Percentage based on selected skin type
  const compatibilityScores = useMemo(() => {
    if (!userSkinType) return {};
    
    const result: Record<string, { score: number; label: string; color: string }> = {};
    
    comparedItems.forEach(p => {
      const pSkinTypes = p.skinTypes || [];
      const isSensitive = userSkinType.toLowerCase() === 'sensitive';
      
      let score = 70; // baseline
      
      // Exact Match
      if (pSkinTypes.some((st: string) => st.toLowerCase() === userSkinType.toLowerCase())) {
        score = 95;
      } 
      // All Skin Types Match
      else if (pSkinTypes.some((st: string) => st.toLowerCase() === 'all skin types')) {
        score = 90;
      } 
      // Sensitive safety check
      else if (isSensitive && pSkinTypes.some((st: string) => st.toLowerCase() === 'sensitive')) {
        score = 88;
      }
      // Mismatched
      else if (
        (userSkinType.toLowerCase() === 'oily' && pSkinTypes.includes('Dry')) ||
        (userSkinType.toLowerCase() === 'dry' && pSkinTypes.includes('Oily'))
      ) {
        score = 55; // Low compatibility
      }
      
      // Determine label and color
      let label = 'Compatible 👍';
      let color = '#EAB308'; // Yellow
      
      if (score >= 90) {
        label = 'Perfect Match 🌟';
        color = '#10B981'; // Green
      } else if (score >= 80) {
        label = 'High Match ✅';
        color = '#06B6D4'; // Teal
      } else if (score <= 60) {
        label = 'Low Compatibility ⚠️';
        color = '#EF4444'; // Red
      }
      
      result[p.id] = { score, label, color };
    });
    
    return result;
  }, [comparedItems, userSkinType]);

  const handleQuickAdd = (p: any) => {
    addToCart(p);
    setSuccessMsg(prev => ({ ...prev, [p.id]: true }));
    setTimeout(() => {
      setSuccessMsg(prev => ({ ...prev, [p.id]: false }));
    }, 2000);
  };

  return (
    <>
      <Navbar />
      <main className="compare-main">
        <div className="container-lg">
          {/* Header Link */}
          <Link href="/products" className="compare-back-link">
            <ArrowLeft size={14} /> Back to Catalog
          </Link>

          <div className="compare-header-row">
            <div>
              <span className="compare-badge">
                <GitCompare size={12} /> SCIENTIFIC COMPARE
              </span>
              <h1 className="compare-heading">Smart Product Comparison</h1>
              <p className="compare-subtitle">
                Compare active concentrations, formulas, and calculate AI compatibility for your skin regimen.
              </p>
            </div>
            {comparedItems.length > 0 && (
              <button onClick={clearCompare} className="compare-clear-btn">
                <Trash2 size={13} /> Clear List
              </button>
            )}
          </div>

          {comparedItems.length === 0 ? (
            /* Empty State */
            <div className="compare-empty-card">
              <div className="compare-empty-icon-wrap">
                <GitCompare size={32} />
              </div>
              <h2>Comparison List is Empty</h2>
              <p>
                Select up to 3 formulations from the product catalog to compare active ingredients, compatibility, and pricing side-by-side.
              </p>
              <Link href="/products" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
                Browse Formulations
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              
              {/* ── Skin Profile Dynamic Match Selector ── */}
              <div className="compare-skin-selector-panel">
                <div className="selector-title">
                  <User size={15} style={{ color: 'var(--accent)' }} />
                  <span>Personalize Match Score:</span>
                </div>
                <div className="selector-inputs">
                  {['Normal', 'Dry', 'Oily', 'Combination', 'Sensitive'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setUserSkinType(prev => prev === type ? '' : type)}
                      className={`skin-tag-btn ${userSkinType === type ? 'active' : ''}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Grid Comparison Table ── */}
              <div className="compare-grid-card">
                <div className="compare-custom-table" style={{ '--cols': comparedItems.length } as any}>
                  
                  {/* Header Row: Product Info */}
                  <div className="compare-grid-row header-row">
                    <div className="compare-grid-cell label-cell">
                      <span className="cell-label">Formulations</span>
                    </div>
                    {comparedItems.map((p) => {
                      const isBestValue = p.id === bestValueId;
                      return (
                        <div key={p.id} className="compare-grid-cell product-cell">
                          {/* Remove X button */}
                          <button
                            onClick={() => removeFromCompare(String(p.id))}
                            className="compare-remove-item"
                            title="Remove product"
                          >
                            <X size={15} />
                          </button>

                          {/* Best Value Ribbon */}
                          {isBestValue && (
                            <div className="best-value-ribbon">
                              <Award size={10} /> BEST VALUE
                            </div>
                          )}

                          <img src={p.image} alt={p.name} className="product-cell-img" />
                          <div className="product-cell-info">
                            <span className="product-brand-tag">{p.brandInfo?.name || p.brand}</span>
                            <h3 className="product-title">{p.name}</h3>
                            <div className="product-rating">
                              <div style={{ display: 'flex', gap: 1 }}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} size={10} style={{ fill: i < Math.round(p.rating) ? 'var(--accent)' : 'none', color: 'var(--accent)' }} />
                                ))}
                              </div>
                              <span>({p.reviewCount})</span>
                            </div>

                            <div className="product-purchase-row">
                              <div className="price-block">
                                <span className="current-price">৳{p.price.toLocaleString()}</span>
                                {p.originalPrice > p.price && (
                                  <span className="old-price">৳{p.originalPrice.toLocaleString()}</span>
                                )}
                              </div>
                              <button onClick={() => handleQuickAdd(p)} className={`buy-btn ${successMsg[p.id] ? 'success' : ''}`}>
                                {successMsg[p.id] ? <Check size={11} /> : <ShoppingBag size={11} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Row 1: AI Compatibility Meter */}
                  <div className="compare-grid-row">
                    <div className="compare-grid-cell label-cell">Compatibility Score</div>
                    {comparedItems.map(p => {
                      const match = compatibilityScores[p.id];
                      return (
                        <div key={p.id} className="compare-grid-cell text-cell">
                          {match ? (
                            <div className="compatibility-gauge-wrapper">
                              <div className="gauge-bar-outer">
                                <div
                                  className="gauge-bar-inner"
                                  style={{ width: `${match.score}%`, background: match.color }}
                                />
                              </div>
                              <span className="gauge-score" style={{ color: match.color }}>
                                {match.score}% · {match.label}
                              </span>
                            </div>
                          ) : (
                            <span className="gauge-placeholder">Select skin type above</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Row 2: Price Value */}
                  <div className="compare-grid-row">
                    <div className="compare-grid-cell label-cell">Price & Size</div>
                    {comparedItems.map(p => {
                      const metric = valueMetrics.find(vm => vm.id === p.id);
                      return (
                        <div key={p.id} className="compare-grid-cell text-cell">
                          <span className="unit-value">৳{p.price} for {p.size || '30ml'}</span>
                          {metric && (
                            <span className="unit-rate">৳{metric.pricePerTen} / 10ml</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Row 3: Skin Compatibility */}
                  <div className="compare-grid-row">
                    <div className="compare-grid-cell label-cell">Suitable Skin Types</div>
                    {comparedItems.map(p => (
                      <div key={p.id} className="compare-grid-cell text-cell">
                        <div className="compare-badges-flex">
                          {p.skinTypes?.map((st: string) => (
                            <span key={st} className="compatibility-badge">
                              {st}
                            </span>
                          )) || <span className="value-none">N/A</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Row 4: Skin Concerns */}
                  <div className="compare-grid-row">
                    <div className="compare-grid-cell label-cell">Targets Concerns</div>
                    {comparedItems.map(p => (
                      <div key={p.id} className="compare-grid-cell text-cell">
                        <div className="compare-badges-flex">
                          {p.concerns?.map((co: string) => (
                            <span key={co} className="concern-badge">
                              {co}
                            </span>
                          )) || <span className="value-none">N/A</span>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Row 5: Active Ingredients */}
                  <div className="compare-grid-row">
                    <div className="compare-grid-cell label-cell">Active Ingredients</div>
                    {comparedItems.map(p => (
                      <div key={p.id} className="compare-grid-cell text-cell">
                        <div className="compare-actives-list">
                          {p.actives && p.actives.length > 0 ? (
                            p.actives.map((act: any, i: number) => (
                              <div key={i} className="active-item">
                                <span className="active-dot" />
                                <span className="active-text">
                                  {act.name} <strong>{act.concentration}{act.unit}</strong>
                                </span>
                              </div>
                            ))
                          ) : (
                            <span className="value-none">Generic base formula</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Row 6: Description */}
                  <div className="compare-grid-row">
                    <div className="compare-grid-cell label-cell">Formula Benefits</div>
                    {comparedItems.map(p => (
                      <div key={p.id} className="compare-grid-cell desc-cell">
                        <p>{p.description || 'No description listed.'}</p>
                      </div>
                    ))}
                  </div>

                  {/* Row 7: INCI Full list */}
                  <div className="compare-grid-row">
                    <div className="compare-grid-cell label-cell">Full Ingredients (INCI)</div>
                    {comparedItems.map(p => (
                      <div key={p.id} className="compare-grid-cell inci-cell">
                        <div className="inci-viewport">
                          {p.inciList ? (
                            p.inciList.split(',').map((ing: string, i: number) => {
                              const trimmed = ing.trim();
                              const isShared = sharedIngredients.some(s => s.toLowerCase() === trimmed.toLowerCase());
                              return (
                                <span
                                  key={i}
                                  className={isShared ? 'shared-ingredient' : ''}
                                >
                                  {trimmed}{i < p.inciList.split(',').length - 1 ? ', ' : ''}
                                </span>
                              );
                            })
                          ) : (
                            <span className="value-none">N/A</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>

              {/* Shared Ingredients Highlight Panel */}
              {sharedIngredients.length > 0 && (
                <div className="compare-shared-panel">
                  <div className="shared-panel-title">
                    <Sparkles size={16} /> Shared Active Base
                  </div>
                  <p className="shared-panel-desc">
                    These formulations share these key skin-conditioning and base ingredients. They will integrate harmoniously into your routine:
                  </p>
                  <div className="shared-badges-group">
                    {sharedIngredients.map(ing => (
                      <span key={ing} className="shared-badge">
                        ✓ {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </main>
      <Footer />

      <style>{`
        /* Page layout */
        .compare-main {
          background: var(--bg-base);
          min-height: 100vh;
          padding: 40px 0 100px;
        }

        .compare-back-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          fontSize: 13px;
          color: var(--text-muted);
          text-decoration: none;
          margin-bottom: 24px;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        .compare-back-link:hover {
          color: var(--accent);
        }

        .compare-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 32px;
          gap: 20px;
        }

        .compare-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--accent);
          background: rgba(201, 149, 109, 0.08);
          padding: 5px 12px;
          border-radius: 99px;
          border: 1px solid rgba(201, 149, 109, 0.15);
          margin-bottom: 12px;
        }

        .compare-heading {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(28px, 4vw, 42px);
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1.1;
          margin: 0;
        }

        .compare-subtitle {
          color: var(--text-muted);
          font-size: 14px;
          margin-top: 6px;
        }

        .compare-clear-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
          padding: 8px 18px;
          border-radius: 99px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .compare-clear-btn:hover {
          border-color: #EF4444;
          color: #EF4444;
          background: rgba(239, 68, 68, 0.04);
        }

        /* Empty state card */
        .compare-empty-card {
          text-align: center;
          padding: 80px 20px;
          background: var(--bg-surface);
          border-radius: 20px;
          border: 1px solid var(--border-default);
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
        }

        .compare-empty-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(201, 149, 109, 0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent);
          margin: 0 auto 20px;
          border: 1px solid rgba(201, 149, 109, 0.12);
        }

        .compare-empty-card h2 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 24px;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .compare-empty-card p {
          color: var(--text-muted);
          font-size: 14px;
          max-width: 420px;
          margin: 0 auto 24px;
          line-height: 1.5;
        }

        /* Skin type matcher selector */
        .compare-skin-selector-panel {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 16px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .selector-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .selector-inputs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .skin-tag-btn {
          padding: 6px 14px;
          border-radius: 99px;
          border: 1px solid var(--border-default);
          background: transparent;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .skin-tag-btn:hover {
          border-color: var(--text-secondary);
          color: var(--text-primary);
        }

        .skin-tag-btn.active {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
          box-shadow: 0 4px 12px rgba(201,149,109,0.25);
        }

        /* Grid Card Comparison layout */
        .compare-grid-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 8px 30px rgba(0,0,0,0.03);
        }

        .compare-custom-table {
          display: flex;
          flex-direction: column;
          min-width: 600px;
        }

        .compare-grid-row {
          display: grid;
          grid-template-columns: 200px repeat(var(--cols), 1fr);
          border-bottom: 1px solid var(--border-subtle);
        }
        .compare-grid-row:last-child {
          border-bottom: none;
        }

        .compare-grid-cell {
          padding: 16px 20px;
          border-right: 1px solid var(--border-subtle);
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .compare-grid-cell:last-child {
          border-right: none;
        }

        .compare-grid-cell.label-cell {
          background: var(--bg-elevated);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text-muted);
          justify-content: center;
        }

        /* Product header row specifically */
        .header-row {
          align-items: stretch;
        }
        .header-row .compare-grid-cell {
          justify-content: flex-start;
        }

        .compare-remove-item {
          position: absolute;
          top: 14px;
          right: 14px;
          background: var(--bg-base);
          border: 1px solid var(--border-default);
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: var(--text-muted);
          transition: all 0.2s ease;
          z-index: 5;
        }
        .compare-remove-item:hover {
          color: #EF4444;
          border-color: #EF4444;
          background: rgba(239,68,68,0.05);
        }

        .best-value-ribbon {
          position: absolute;
          top: 14px;
          left: 14px;
          background: linear-gradient(135deg, #D4AF37, #C5A028);
          color: #fff;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.1em;
          padding: 4px 8px;
          border-radius: 4px;
          box-shadow: 0 4px 10px rgba(197,160,40,0.3);
          display: flex;
          align-items: center;
          gap: 3px;
          z-index: 4;
        }

        .product-cell {
          position: relative;
        }

        .product-cell-img {
          width: 100%;
          height: 150px;
          object-fit: cover;
          border-radius: 12px;
          background: var(--bg-base);
          border: 1px solid var(--border-default);
          margin-bottom: 12px;
        }

        .product-cell-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .product-brand-tag {
          font-size: 9px;
          font-weight: 800;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .product-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.3;
          margin: 3px 0 6px;
        }

        .product-rating {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-muted);
        }

        .product-purchase-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 12px;
          gap: 8px;
        }

        .price-block {
          display: flex;
          flex-direction: column;
        }

        .current-price {
          font-size: 16px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .old-price {
          font-size: 11px;
          color: var(--text-muted);
          text-decoration: line-through;
        }

        .buy-btn {
          background: var(--accent);
          color: #fff;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: 0 4px 10px rgba(201,149,109,0.2);
        }
        .buy-btn:hover {
          background: var(--accent-hover);
        }
        .buy-btn.success {
          background: #10B981;
          box-shadow: 0 4px 10px rgba(16,185,129,0.2);
        }

        /* Compatibility Gauge */
        .compatibility-gauge-wrapper {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }

        .gauge-bar-outer {
          width: 100%;
          height: 5px;
          background: var(--border-default);
          border-radius: 99px;
          overflow: hidden;
        }

        .gauge-bar-inner {
          height: 100%;
          border-radius: 99px;
          transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .gauge-score {
          font-size: 11.5px;
          font-weight: 700;
        }

        .gauge-placeholder {
          font-size: 11px;
          font-style: italic;
          color: var(--text-muted);
        }

        /* Price unit metrics */
        .unit-value {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .unit-rate {
          font-size: 10.5px;
          color: var(--text-muted);
          margin-top: 2px;
        }

        /* Badges list styling */
        .compare-badges-flex {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .compatibility-badge {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-base);
          border: 1px solid var(--border-default);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .concern-badge {
          font-size: 10.5px;
          font-weight: 600;
          color: var(--accent);
          background: rgba(201,149,109,0.06);
          border: 1px solid rgba(201,149,109,0.12);
          padding: 2px 8px;
          border-radius: 6px;
        }

        .value-none {
          font-size: 11px;
          color: var(--text-muted);
        }

        /* Actives List */
        .compare-actives-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .active-item {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .active-dot {
          width: 5px;
          height: 5px;
          background: var(--sage);
          border-radius: 50%;
          flex-shrink: 0;
        }

        .active-text {
          font-size: 11.5px;
          color: var(--text-secondary);
        }
        .active-text strong {
          color: var(--accent);
        }

        /* Description and INCI cells */
        .compare-grid-cell.desc-cell p {
          font-size: 12px;
          line-height: 1.5;
          color: var(--text-secondary);
          margin: 0;
        }

        .compare-grid-cell.inci-cell {
          vertical-align: top;
        }

        .inci-viewport {
          max-height: 140px;
          overflow-y: auto;
          font-size: 11px;
          line-height: 1.6;
          color: var(--text-muted);
          padding-right: 6px;
        }

        .shared-ingredient {
          color: var(--accent);
          font-weight: 700;
          background: rgba(201,149,109,0.06);
          border-radius: 4px;
          padding: 0 2px;
        }

        /* Shared base panel */
        .compare-shared-panel {
          background: linear-gradient(135deg, rgba(201,149,109,0.06), rgba(139,157,119,0.03));
          border: 1px solid rgba(201,149,109,0.15);
          border-radius: 16px;
          padding: 18px 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.01);
        }

        .shared-panel-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13.5px;
          font-weight: 700;
          color: var(--accent);
          margin-bottom: 6px;
        }

        .shared-panel-desc {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0 0 12px;
          line-height: 1.5;
        }

        .shared-badges-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .shared-badge {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-primary);
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          padding: 4px 12px;
          border-radius: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        }

        /* ── MOBILE RESPONSIVE OVERRIDES ────────────────────────────────────── */
        @media (max-width: 768px) {
          .compare-main {
            padding: 24px 0 64px;
          }

          .compare-header-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            margin-bottom: 24px;
          }

          .compare-clear-btn {
            width: 100%;
            justify-content: center;
          }

          .compare-skin-selector-panel {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
            padding: 14px 16px;
          }

          /* Collapse table rows into stacked grid layouts */
          .compare-custom-table {
            min-width: 100%;
          }

          .compare-grid-row {
            grid-template-columns: repeat(var(--cols), 1fr);
          }

          .compare-grid-cell {
            padding: 10px 12px;
            font-size: 12px;
          }

          /* Force label cell to be a full-width header block spanning all columns */
          .compare-grid-cell.label-cell {
            grid-column: 1 / -1;
            border-right: none;
            border-bottom: 1px solid var(--border-subtle);
            padding: 8px 12px;
            font-size: 10px;
            text-align: left;
            align-items: flex-start;
            background: var(--bg-elevated);
          }

          /* Product images sizes */
          .product-cell-img {
            height: 90px;
            margin-bottom: 8px;
          }

          .product-title {
            font-size: 13px;
            line-height: 1.25;
            margin-bottom: 4px;
          }

          .product-rating {
            font-size: 9.5px;
          }

          .product-purchase-row {
            margin-top: 8px;
          }

          .current-price {
            font-size: 14px;
          }

          .buy-btn {
            width: 28px;
            height: 28px;
            border-radius: 6px;
          }

          .compatibility-badge, .concern-badge {
            font-size: 9.5px;
            padding: 2px 6px;
          }

          .active-text {
            font-size: 10.5px;
          }

          .compare-grid-cell.desc-cell p {
            font-size: 11px;
            line-height: 1.45;
          }

          .inci-viewport {
            max-height: 100px;
            font-size: 10px;
          }

          .best-value-ribbon {
            top: 8px;
            left: 8px;
            font-size: 7px;
            padding: 2px 5px;
          }

          .compare-remove-item {
            top: 8px;
            right: 8px;
            width: 20px;
            height: 20px;
          }
        }
      `}</style>
    </>
  );
}
