'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GitCompare, Trash2, ArrowLeft, Plus, ShoppingBag, Star,
  CheckCircle, AlertCircle, Sparkles, Check, AlertTriangle, User
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { products as localProducts } from '../../data/products';

export default function ComparePage() {
  const { compareList, removeFromCompare, clearCompare, addToCart } = useCartStore();
  const { user, token } = useAuthStore();
  const router = useRouter();

  // Load products list (database fallback)
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Custom diagnostic overrides (interactive inputs)
  const [customSkinType, setCustomSkinType] = useState('');
  const [customConcern, setCustomConcern] = useState('');
  const [customAllergies, setCustomAllergies] = useState('');
  const [successMsg, setSuccessMsg] = useState<Record<string, boolean>>({});

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

  // Sync profile values if logged in
  useEffect(() => {
    if (user) {
      if (user.skin_type) setCustomSkinType(user.skin_type);
      if (user.allergies) setCustomAllergies(user.allergies);
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
    
    // Parse ingredients list
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
      // Find original capitalization from first product
      const orig = (comparedItems[0].inciList || '')
        .split(',')
        .find((i: string) => i.trim().toLowerCase() === ing);
      return orig ? orig.trim() : ing;
    }).slice(0, 8); // top 8 shared
  }, [comparedItems]);

  // AI Diagnostic Advisor Rules
  const aiReport = useMemo(() => {
    if (comparedItems.length < 2) return null;

    const skin = (customSkinType || 'Normal').toLowerCase();
    const concern = (customConcern || 'Hydration').toLowerCase();
    const allergiesList = customAllergies
      .toLowerCase()
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // 1. Allergen Check
    const allergenFlags: Record<string, string[]> = {};
    comparedItems.forEach(p => {
      const flags: string[] = [];
      allergiesList.forEach(allergen => {
        const inName = p.name.toLowerCase().includes(allergen);
        const inIngredients = (p.inciList || '').toLowerCase().includes(allergen);
        if (inName || inIngredients) {
          flags.push(allergen);
        }
      });
      if (flags.length > 0) allergenFlags[p.id] = flags;
    });

    // 2. Active Ingredient Scoring for Primary Concern
    // Concerns list: Acne, Dark Spots, Hydration, Anti-aging, Barrier Repair
    const ingredientKeywords: Record<string, string[]> = {
      acne: ['salicylic', 'bha', 'tea tree', 'zinc', 'niacinamide', 'clay', 'retinol', 'willow bark'],
      'dark spots': ['vitamin c', 'niacinamide', 'alpha arbutin', 'tranexamic', 'licorice', 'kojic', 'glycolic', 'aha'],
      hydration: ['hyaluronic', 'glycerin', 'panthenol', 'squalane', 'aloe', 'sodium hyaluronate', 'honey', 'beta-glucan'],
      'anti-aging': ['retinol', 'peptide', 'adenosine', 'ginseng', 'collagen', 'coenzyme q10', 'bakuchiol'],
      'barrier repair': ['ceramide', 'panthenol', 'centella', 'cholesterol', 'allantoin', 'squalane', 'madecassoside']
    };

    const targetKeywords = ingredientKeywords[concern] || ingredientKeywords.hydration;

    const scores = comparedItems.map(p => {
      let score = 0;
      const lowerInci = (p.inciList || '').toLowerCase();
      const lowerName = p.name.toLowerCase();

      // Check key actives match
      targetKeywords.forEach(kw => {
        if (lowerInci.includes(kw) || lowerName.includes(kw)) {
          score += 2;
        }
      });

      // Boost if skin type matches product skinTypes
      const matchesSkin = p.skinTypes?.some((st: string) => 
        st.toLowerCase().includes(skin) || skin.includes(st.toLowerCase())
      );
      if (matchesSkin) score += 3;

      // Penalize if contains user allergens
      if (allergenFlags[p.id]) score -= 10;

      return { product: p, score };
    });

    // Determine winner
    const sorted = [...scores].sort((a, b) => b.score - a.score);
    const winner = sorted[0].score > -5 ? sorted[0].product : null;

    // 3. Synergy Check & Warnings
    const clashes: string[] = [];
    const synergies: string[] = [];
    
    // Check active properties
    const hasRetinol = comparedItems.some(p => p.name.toLowerCase().includes('retinol') || (p.inciList || '').toLowerCase().includes('retinol'));
    const hasAhaBha = comparedItems.some(p => p.name.toLowerCase().includes('salicylic') || p.name.toLowerCase().includes('glycolic') || (p.inciList || '').toLowerCase().includes('salicylic') || (p.inciList || '').toLowerCase().includes('glycolic'));
    const hasVitC = comparedItems.some(p => p.name.toLowerCase().includes('vitamin c') || (p.inciList || '').toLowerCase().includes('ascorbic') || (p.inciList || '').toLowerCase().includes('ascorbyl'));
    const hasNiacinamide = comparedItems.some(p => p.name.toLowerCase().includes('niacinamide') || (p.inciList || '').toLowerCase().includes('niacinamide'));
    const hasCeramide = comparedItems.some(p => p.name.toLowerCase().includes('ceramide') || (p.inciList || '').toLowerCase().includes('ceramide'));

    if (hasRetinol && hasAhaBha) {
      clashes.push('Acid + Retinol Clash: Combining chemical exfoliants (AHA/BHA) with Retinol in the same application step can lead to extreme irritation and skin barrier damage. Use AHA/BHA in the morning (with SPF) and Retinol at night.');
    }
    if (hasVitC && hasAhaBha) {
      clashes.push('Double Acid Sensitization: Pure Vitamin C (Ascorbic Acid) combined with AHA/BHA might over-exfoliate your skin. Layer with caution or alternate days.');
    }
    if (hasNiacinamide && hasAhaBha) {
      synergies.push('Sebum Control Synergy: Niacinamide + Salicylic Acid (BHA) is an excellent pairing. Salicylic acid unclogs pores while Niacinamide strengthens skin elasticity to visibly reduce pore size.');
    }
    if (hasCeramide && (hasRetinol || hasAhaBha)) {
      synergies.push('Exfoliation + Barrier Buffer: The combination of Ceramides with Retinoids or chemical exfoliants is highly recommended. Ceramides replenish skin lipids, buffer irritation, and restore the skin barrier.');
    }

    return {
      winner,
      allergenFlags,
      clashes,
      synergies,
      scores
    };
  }, [comparedItems, customSkinType, customConcern, customAllergies]);

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
      <main style={{ background: 'var(--bg-base)', minHeight: '100vh', padding: '40px 0 100px' }}>
        <div className="container-lg">
          {/* Header Link */}
          <Link href="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', marginBottom: 20 }}>
            <ArrowLeft size={14} /> Back to Catalog
          </Link>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Smart Product Comparison
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>
                Compare ingredients, concentrations, price value, and let the AI find your matching formula.
              </p>
            </div>
            {comparedItems.length > 0 && (
              <button
                onClick={clearCompare}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: '1px solid #EF4444',
                  color: '#EF4444', padding: '8px 18px', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  transition: 'background 0.2s, color 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#EF4444'; }}
              >
                <Trash2 size={13} /> Clear Comparison
              </button>
            )}
          </div>

          {comparedItems.length === 0 ? (
            /* Empty State */
            <div style={{
              textAlign: 'center', padding: '80px 20px',
              background: 'var(--bg-surface)', borderRadius: 24, border: '1px solid var(--border-default)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.02)'
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%', background: 'rgba(201, 149, 109, 0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
                margin: '0 auto 20px'
              }}>
                <GitCompare size={30} />
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                Comparison List is Empty
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 440, margin: '0 auto 24px', lineHeight: 1.5 }}>
                Select up to 3 skin serums, cleansers, or toners from the product lists to compare active ingredients, skin compatibility, and clinical results.
              </p>
              <Link href="/products" className="btn-primary" style={{ display: 'inline-block', padding: '12px 36px', borderRadius: 12, textDecoration: 'none' }}>
                Browse Products
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              {/* Dynamic comparison table */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 24,
                overflow: 'hidden',
                boxShadow: '0 12px 40px rgba(0,0,0,0.03)'
              }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 700 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
                        <th style={{ padding: '24px 20px', width: '22%', background: 'var(--bg-elevated)', borderRight: '1px solid var(--border-subtle)' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                            Comparing ({comparedItems.length}) Products
                          </span>
                        </th>
                        {comparedItems.map((p) => (
                          <th key={p.id} style={{ padding: '24px 20px', width: `${78 / comparedItems.length}%`, verticalAlign: 'top', borderRight: '1px solid var(--border-subtle)', position: 'relative' }}>
                            {/* Remove button */}
                            <button
                              onClick={() => removeFromCompare(String(p.id))}
                              style={{
                                position: 'absolute', top: 12, right: 12, background: 'none', border: 'none',
                                cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 4
                              }}
                              title="Remove product"
                            >
                              <X size={15} />
                            </button>
                            
                            {/* Product Header details */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <img
                                src={p.image}
                                alt={p.name}
                                style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 12, background: 'var(--bg-base)' }}
                              />
                              <div>
                                <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                  {p.brand}
                                </span>
                                <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '3px 0 6px', lineHeight: 1.3 }}>
                                  {p.name}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
                                  <div style={{ display: 'flex', gap: 1 }}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                      <Star key={i} size={11} style={{ fill: i < Math.round(p.rating) ? '#C9956D' : 'none', color: '#C9956D' }} />
                                    ))}
                                  </div>
                                  <span>({p.reviewCount})</span>
                                </div>
                              </div>

                              {/* Price and CTA */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 10 }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>৳{p.price.toLocaleString()}</span>
                                  {p.originalPrice > p.price && (
                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'line-through' }}>৳{p.originalPrice.toLocaleString()}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleQuickAdd(p)}
                                  style={{
                                    background: successMsg[p.id] ? '#10B981' : 'var(--accent)',
                                    color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 10,
                                    fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                                    boxShadow: '0 4px 10px rgba(201,149,109,0.25)', transition: 'background 0.2s'
                                  }}
                                >
                                  {successMsg[p.id] ? <><Check size={12} /> Added</> : <><ShoppingBag size={12} /> Add to Bag</>}
                                </button>
                              </div>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Price & Value Row */}
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '16px 20px', background: 'var(--bg-elevated)', fontWeight: 700, fontSize: 12, color: 'var(--text-secondary)', borderRight: '1px solid var(--border-subtle)' }}>Price Value</td>
                        {comparedItems.map(p => (
                          <td key={p.id} style={{ padding: '16px 20px', fontSize: 13, borderRight: '1px solid var(--border-subtle)', color: 'var(--text-primary)' }}>
                            <strong>৳{p.price}</strong> for {p.size || 'standard'} ({p.weight || 'N/A'})
                          </td>
                        ))}
                      </tr>

                      {/* Skin Type Compatibility Row */}
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '16px 20px', background: 'var(--bg-elevated)', fontWeight: 700, fontSize: 12, color: 'var(--text-secondary)', borderRight: '1px solid var(--border-subtle)' }}>Suitable Skin Types</td>
                        {comparedItems.map(p => (
                          <td key={p.id} style={{ padding: '16px 20px', fontSize: 13, borderRight: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {p.skinTypes?.map((st: string) => (
                                <span key={st} style={{ padding: '2px 8px', borderRadius: 6, background: 'var(--bg-base)', border: '1px solid var(--border-default)', fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)' }}>
                                  {st}
                                </span>
                              )) || 'N/A'}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Key Skin Concerns Row */}
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '16px 20px', background: 'var(--bg-elevated)', fontWeight: 700, fontSize: 12, color: 'var(--text-secondary)', borderRight: '1px solid var(--border-subtle)' }}>Targets Concerns</td>
                        {comparedItems.map(p => (
                          <td key={p.id} style={{ padding: '16px 20px', fontSize: 13, borderRight: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              {p.concerns?.map((co: string) => (
                                <span key={co} style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(201,149,109,0.08)', color: 'var(--accent)', fontSize: 11, fontWeight: 600 }}>
                                  {co}
                                </span>
                              )) || 'N/A'}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Active Ingredients Row */}
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '16px 20px', background: 'var(--bg-elevated)', fontWeight: 700, fontSize: 12, color: 'var(--text-secondary)', borderRight: '1px solid var(--border-subtle)' }}>Active Ingredients</td>
                        {comparedItems.map(p => (
                          <td key={p.id} style={{ padding: '16px 20px', fontSize: 13, borderRight: '1px solid var(--border-subtle)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {p.actives?.map((act: any, i: number) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--sage)' }} />
                                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                                    {act.name} <strong style={{ color: 'var(--accent)' }}>{act.concentration}{act.unit}</strong>
                                  </span>
                                </div>
                              )) || 'None listed'}
                            </div>
                          </td>
                        ))}
                      </tr>

                      {/* Clinical Benefits Summary */}
                      <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '16px 20px', background: 'var(--bg-elevated)', fontWeight: 700, fontSize: 12, color: 'var(--text-secondary)', borderRight: '1px solid var(--border-subtle)' }}>Formula Benefits</td>
                        {comparedItems.map(p => (
                          <td key={p.id} style={{ padding: '16px 20px', fontSize: 12, lineHeight: 1.5, color: 'var(--text-secondary)', borderRight: '1px solid var(--border-subtle)', verticalAlign: 'top' }}>
                            {p.description || 'No description listed.'}
                          </td>
                        ))}
                      </tr>

                      {/* Full Ingredients INCI list */}
                      <tr>
                        <td style={{ padding: '16px 20px', background: 'var(--bg-elevated)', fontWeight: 700, fontSize: 12, color: 'var(--text-secondary)', borderRight: '1px solid var(--border-subtle)' }}>Full Ingredients (INCI)</td>
                        {comparedItems.map(p => (
                          <td key={p.id} style={{ padding: '16px 20px', fontSize: 11, lineHeight: 1.6, color: 'var(--text-muted)', borderRight: '1px solid var(--border-subtle)', verticalAlign: 'top' }}>
                            <div style={{ maxHeight: 180, overflowY: 'auto', paddingRight: 8 }}>
                              {p.inciList ? (
                                p.inciList.split(',').map((ing: string, i: number) => {
                                  const trimmed = ing.trim();
                                  const isShared = sharedIngredients.some(s => s.toLowerCase() === trimmed.toLowerCase());
                                  return (
                                    <span
                                      key={i}
                                      style={{
                                        color: isShared ? 'var(--accent)' : 'inherit',
                                        fontWeight: isShared ? 700 : 'inherit',
                                        background: isShared ? 'rgba(201,149,109,0.06)' : 'none',
                                        borderRadius: 4, padding: isShared ? '0 2px' : 0
                                      }}
                                    >
                                      {trimmed}{i < p.inciList.split(',').length - 1 ? ', ' : ''}
                                    </span>
                                  );
                                })
                              ) : 'N/A'}
                            </div>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Shared Ingredients Highlight Panel */}
              {sharedIngredients.length > 0 && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(201,149,109,0.08), rgba(139,69,19,0.03))',
                  border: '1px solid rgba(201,149,109,0.18)',
                  borderRadius: 16, padding: '18px 24px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontWeight: 700, fontSize: 14, marginBottom: 8 }}>
                    <Sparkles size={16} /> Shared Active Base
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: '0 0 12px' }}>
                    These products share these key skin-conditioning and base ingredients. They will integrate harmoniously into your routine:
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {sharedIngredients.map(ing => (
                      <span key={ing} style={{ padding: '4px 10px', borderRadius: 8, background: '#fff', border: '1px solid var(--border-default)', fontSize: 11, fontWeight: 700, color: 'var(--text-primary)' }}>
                        ✓ {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Dermatologist Advisor Panel */}
              {aiReport && (
                <div style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 24, padding: 28,
                  boxShadow: '0 12px 40px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    
                    {/* Diagnostic profile Selector (Left side) */}
                    <div style={{
                      flex: '1 1 240px', background: 'var(--bg-base)', border: '1px solid var(--border-default)',
                      borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>
                        <User size={16} color="var(--accent)" /> AI Skin Profile Analyzer
                      </div>
                      
                      {user && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'rgba(201,149,109,0.08)', padding: '6px 10px', borderRadius: 8 }}>
                          ⚡ Profile synchronized with your user account.
                        </div>
                      )}

                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                          Skin Type
                        </label>
                        <select
                          value={customSkinType}
                          onChange={e => setCustomSkinType(e.target.value)}
                          style={{
                            width: '100%', padding: '10px 12px', borderRadius: 10, background: 'var(--bg-surface)',
                            border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                          }}
                        >
                          <option value="">Select skin type...</option>
                          <option value="Normal">Normal</option>
                          <option value="Dry">Dry</option>
                          <option value="Oily">Oily</option>
                          <option value="Combination">Combination</option>
                          <option value="Sensitive">Sensitive</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                          Primary Concern
                        </label>
                        <select
                          value={customConcern}
                          onChange={e => setCustomConcern(e.target.value)}
                          style={{
                            width: '100%', padding: '10px 12px', borderRadius: 10, background: 'var(--bg-surface)',
                            border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 13, outline: 'none'
                          }}
                        >
                          <option value="">Select concern...</option>
                          <option value="Hydration">Hydration & Dryness</option>
                          <option value="Acne">Acne & Pore Control</option>
                          <option value="Dark Spots">Hyperpigmentation & Brightening</option>
                          <option value="Anti-aging">Anti-aging & Fine Lines</option>
                          <option value="Barrier Repair">Skin Barrier Repair</option>
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
                          Allergies Override
                        </label>
                        <input
                          value={customAllergies}
                          onChange={e => setCustomAllergies(e.target.value)}
                          placeholder="e.g. Fragrance, Vitamin C"
                          style={{
                            width: '100%', padding: '10px 12px', borderRadius: 10, background: 'var(--bg-surface)',
                            border: '1px solid var(--border-default)', color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>
                    </div>

                    {/* AI Advisor output (Right side) */}
                    <div style={{ flex: '2 1 400px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), #8B4513)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0
                        }}>
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                            AI Dermatologist Advisor
                          </h3>
                          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Precision Diagnostic Engine</span>
                        </div>
                      </div>

                      {/* ── Allergen Alert Banner */}
                      {Object.keys(aiReport.allergenFlags).length > 0 && (
                        <div style={{
                          background: 'rgba(224,90,90,0.08)', border: '1px solid rgba(224,90,90,0.25)',
                          borderRadius: 16, padding: '16px 20px', display: 'flex', gap: 12, alignItems: 'flex-start'
                        }}>
                          <AlertTriangle size={18} style={{ color: 'var(--danger)', marginTop: 2, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>Allergen Warning Detected!</div>
                            {Object.entries(aiReport.allergenFlags).map(([pid, flags]: any) => {
                              const item = comparedItems.find(p => String(p.id) === String(pid));
                              return (
                                <div key={pid} style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                                  • <strong style={{ color: 'var(--text-primary)' }}>{item?.name}</strong> contains ingredients matching your allergy search: <strong style={{ color: 'var(--danger)' }}>{flags.join(', ')}</strong>.
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ── Exfoliant / Synergy clashes */}
                      {aiReport.clashes.map((clash, i) => (
                        <div key={i} style={{
                          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                          borderRadius: 16, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start'
                        }}>
                          <AlertCircle size={17} style={{ color: '#D97706', marginTop: 2, flexShrink: 0 }} />
                          <div style={{ fontSize: 12.5, color: '#92400E', lineHeight: 1.4 }}>
                            {clash}
                          </div>
                        </div>
                      ))}

                      {/* ── Exfoliant / Synergy matches */}
                      {aiReport.synergies.map((syn, i) => (
                        <div key={i} style={{
                          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
                          borderRadius: 16, padding: '14px 18px', display: 'flex', gap: 10, alignItems: 'flex-start'
                        }}>
                          <CheckCircle size={17} style={{ color: '#059669', marginTop: 2, flexShrink: 0 }} />
                          <div style={{ fontSize: 12.5, color: '#065F46', lineHeight: 1.4 }}>
                            {syn}
                          </div>
                        </div>
                      ))}

                      {/* ── Final Verdict / Winner Card */}
                      {aiReport.winner ? (
                        <div style={{
                          background: 'rgba(201,149,109,0.07)', border: '1px dashed var(--accent)',
                          borderRadius: 18, padding: 20, display: 'flex', gap: 16, alignItems: 'flex-start'
                        }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: '50%', background: 'rgba(201,149,109,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', flexShrink: 0
                          }}>
                            <Sparkles size={18} />
                          </div>
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 2 }}>
                              Dermatologist Verdict Winner
                            </div>
                            <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 6px' }}>
                              {aiReport.winner.name}
                            </h4>
                            <p style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                              Recommended because it has the highest concentration of active ingredients targeted at your primary concern of <strong style={{ color: 'var(--accent)' }}>{customConcern || 'Hydration'}</strong> and aligns perfectly with your <strong style={{ color: 'var(--accent)' }}>{customSkinType || 'Normal'}</strong> skin compatibility scores.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          background: 'var(--bg-base)', border: '1px solid var(--border-default)',
                          borderRadius: 18, padding: 20, textAlign: 'center'
                        }}>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                            Adjust your skin type and sensitivities in the analyzer panel to generate matching dermatologist recommendations.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <style>{`
        /* Responsive Table adjustments */
        table th {
          border-right: 1px solid var(--border-subtle);
        }
        table th:last-child, table td:last-child {
          border-right: none !important;
        }
        @media (max-width: 768px) {
          .pdp-main-grid, .pdp-related-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}

// Simple X Icon helper
function X({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );
}
