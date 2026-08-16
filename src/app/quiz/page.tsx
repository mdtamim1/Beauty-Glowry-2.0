'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Sparkles, RefreshCw, ChevronRight, Droplets, Sun, Moon, Shield, Zap, Heart, Star } from 'lucide-react';
import { products as localProducts } from '../../data/products';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import { useAuthStore } from '../../store/useAuthStore';

/* ─── Types ───────────────────────────────────────────────── */
interface Option {
  value: string;
  label: string;
  labelBn?: string;
  desc: string;
  icon: string;
  color?: string;
}
interface Question {
  id: string;
  question: string;
  questionBn: string;
  subtitle: string;
  multiSelect?: boolean;
  maxSelect?: number;
  options: Option[];
}

/* ─── Questions ───────────────────────────────────────────── */
const QUESTIONS: Question[] = [
  {
    id: 'skin_type',
    question: 'What is your primary skin type?',
    questionBn: 'আপনার ত্বকের ধরন কোনটি?',
    subtitle: 'Select the one that best describes your skin on a typical day',
    options: [
      { value: 'oily', label: 'Oily', labelBn: 'তৈলাক্ত', desc: 'Shiny face within hours, visible pores', icon: '💧', color: '#3B82F6' },
      { value: 'dry', label: 'Dry', labelBn: 'শুষ্ক', desc: 'Feels tight, flaky or rough patches', icon: '🌵', color: '#F59E0B' },
      { value: 'combination', label: 'Combination', labelBn: 'মিশ্র', desc: 'Oily T-zone, dry or normal cheeks', icon: '⚖️', color: '#8B5CF6' },
      { value: 'sensitive', label: 'Sensitive', labelBn: 'সংবেদনশীল', desc: 'Reacts easily, prone to redness & irritation', icon: '🌸', color: '#EC4899' },
      { value: 'normal', label: 'Normal', labelBn: 'স্বাভাবিক', desc: 'Balanced, rarely problematic', icon: '✨', color: '#10B981' },
    ],
  },
  {
    id: 'concerns',
    question: 'What are your main skin concerns?',
    questionBn: 'আপনার প্রধান সমস্যাগুলো কী কী?',
    subtitle: 'Select up to 3 concerns',
    multiSelect: true,
    maxSelect: 3,
    options: [
      { value: 'acne', label: 'Acne & Blemishes', labelBn: 'ব্রণ ও দাগ', desc: 'Pimples, blackheads, whiteheads', icon: '⚡', color: '#EF4444' },
      { value: 'darkspots', label: 'Dark Spots', labelBn: 'মেছতা ও কালো দাগ', desc: 'Hyperpigmentation, post-acne marks', icon: '🔵', color: '#6366F1' },
      { value: 'aging', label: 'Anti-Aging', labelBn: 'বলিরেখা', desc: 'Fine lines, wrinkles, loss of firmness', icon: '⏳', color: '#8B5CF6' },
      { value: 'hydration', label: 'Dehydration', labelBn: 'আর্দ্রতার অভাব', desc: 'Dull, lacks moisture, tight feeling', icon: '💦', color: '#3B82F6' },
      { value: 'brightening', label: 'Dullness & Glow', labelBn: 'উজ্জ্বলতা', desc: 'Lack of radiance, uneven skin tone', icon: '☀️', color: '#F59E0B' },
      { value: 'redness', label: 'Redness & Sensitivity', labelBn: 'লালচে ও জ্বালা', desc: 'Reactive skin, rosacea, irritation', icon: '🌿', color: '#10B981' },
      { value: 'pores', label: 'Enlarged Pores', labelBn: 'বড় রোমকূপ', desc: 'Visible pores, rough texture', icon: '🎯', color: '#F97316' },
      { value: 'oiliness', label: 'Excess Oil', labelBn: 'অতিরিক্ত তেল', desc: 'Shiny skin, excess sebum all day', icon: '🌊', color: '#06B6D4' },
      { value: 'dark_circles', label: 'Dark Circles', labelBn: 'ডার্ক সার্কেল', desc: 'Under-eye darkness, puffiness', icon: '👁️', color: '#64748B' },
    ],
  },
  {
    id: 'age_range',
    question: 'What is your age range?',
    questionBn: 'আপনার বয়সের পরিসীমা কত?',
    subtitle: 'Age helps us recommend the right active ingredients',
    options: [
      { value: 'teen', label: 'Under 20', labelBn: '২০ এর নিচে', desc: 'Teen skin — acne-prone, oily', icon: '🌱', color: '#10B981' },
      { value: 'twenties', label: '20 – 29', labelBn: '২০ – ২৯', desc: 'Prevention & glow focus', icon: '✨', color: '#F59E0B' },
      { value: 'thirties', label: '30 – 39', labelBn: '৩০ – ৩৯', desc: 'First signs of aging, firmness', icon: '💫', color: '#8B5CF6' },
      { value: 'forties', label: '40 – 49', labelBn: '৪০ – ৪৯', desc: 'Anti-aging, hydration priority', icon: '🌺', color: '#EC4899' },
      { value: 'fifty_plus', label: '50+', labelBn: '৫০+', desc: 'Deep repair, barrier strengthening', icon: '🌟', color: '#F97316' },
    ],
  },
  {
    id: 'environment',
    question: 'What is your daily environment like?',
    questionBn: 'আপনার দৈনন্দিন পরিবেশ কেমন?',
    subtitle: 'Climate and environment affect your skin significantly',
    options: [
      { value: 'humid', label: 'Hot & Humid', labelBn: 'গরম ও আর্দ্র', desc: 'Bangladesh weather — sweaty, oily', icon: '🌴', color: '#10B981' },
      { value: 'urban', label: 'Urban & Polluted', labelBn: 'শহর ও দূষিত', desc: 'City pollution, dust, stress', icon: '🏙️', color: '#6B7280' },
      { value: 'ac', label: 'AC Environment', labelBn: 'এসি পরিবেশ', desc: 'Indoors most of the day', icon: '❄️', color: '#3B82F6' },
      { value: 'outdoor', label: 'Sun Exposed', labelBn: 'রোদে থাকেন', desc: 'Frequent sun & outdoor exposure', icon: '☀️', color: '#F59E0B' },
    ],
  },
  {
    id: 'lifestyle',
    question: 'How is your lifestyle?',
    questionBn: 'আপনার জীবনযাপন কেমন?',
    subtitle: 'Lifestyle factors deeply impact skin health',
    options: [
      { value: 'stressed', label: 'High Stress', labelBn: 'বেশি চাপ', desc: 'Busy work, poor sleep, stress breakouts', icon: '😰', color: '#EF4444' },
      { value: 'active', label: 'Active & Sporty', labelBn: 'সক্রিয়', desc: 'Regular exercise, frequent sweating', icon: '🏃', color: '#10B981' },
      { value: 'balanced', label: 'Balanced', labelBn: 'সুষম', desc: 'Good sleep, moderate activity', icon: '🧘', color: '#8B5CF6' },
      { value: 'unhealthy', label: 'Irregular Habits', labelBn: 'অনিয়মিত', desc: 'Late nights, poor diet, dehydration', icon: '🍕', color: '#F97316' },
    ],
  },
  {
    id: 'routine',
    question: 'How complex is your current routine?',
    questionBn: 'আপনি কতটা ধাপের রুটিন চান?',
    subtitle: 'We match recommendations to your preference',
    options: [
      { value: 'minimal', label: 'Minimal', labelBn: 'সহজ', desc: 'Cleanse + moisturize only', icon: '○', color: '#10B981' },
      { value: 'moderate', label: 'Moderate', labelBn: 'মাঝারি', desc: '3–5 steps, some actives', icon: '◑', color: '#F59E0B' },
      { value: 'full', label: 'Full Routine', labelBn: 'সম্পূর্ণ', desc: '6+ steps, love layering serums', icon: '●', color: '#8B5CF6' },
    ],
  },
  {
    id: 'budget',
    question: 'What is your monthly skincare budget?',
    questionBn: 'মাসে স্কিনকেয়ারে কত টাকা খরচ করতে পারবেন?',
    subtitle: 'We have premium solutions for every range',
    options: [
      { value: 'low', label: 'Under ৳1,000', labelBn: '৳১,০০০ এর নিচে', desc: 'Essentials only', icon: '💚', color: '#10B981' },
      { value: 'mid', label: '৳1,000 – ৳2,500', labelBn: '৳১,০০০ – ৳২,৫০০', desc: 'Best value range', icon: '💛', color: '#F59E0B' },
      { value: 'high', label: '৳2,500+', labelBn: '৳২,৫০০+', desc: 'Premium clinical formulations', icon: '💎', color: '#8B5CF6' },
    ],
  },
];

/* ─── Mapping Tables ──────────────────────────────────────── */
const CONCERN_TO_PRODUCT_CONCERN: Record<string, string[]> = {
  acne:        ['Acne', 'Blemish', 'Pore', 'Clarifying', 'Niacinamide'],
  darkspots:   ['Dark Spot', 'Hyperpigmentation', 'Brightening', 'Vitamin C', 'Uneven'],
  aging:       ['Anti-Aging', 'Fine Line', 'Firmness', 'Retinol', 'Collagen'],
  hydration:   ['Hydration', 'Moisture', 'Dehydration', 'Hyaluronic'],
  brightening: ['Brightening', 'Glow', 'Dullness', 'Radiance', 'Vitamin C'],
  redness:     ['Redness', 'Sensitivity', 'Soothing', 'Calm', 'Barrier'],
  pores:       ['Pore', 'Texture', 'Blackhead', 'Enlarged'],
  oiliness:    ['Oil', 'Sebum', 'Mattifying', 'Shine', 'Niacinamide'],
  dark_circles:['Dark Circle', 'Eye', 'Periorbital'],
};

const SKIN_TYPE_MAP: Record<string, string[]> = {
  oily:        ['Oily', 'Combination', 'Acne-Prone'],
  dry:         ['Dry', 'Dehydrated', 'Normal'],
  combination: ['Combination', 'Normal', 'Oily'],
  sensitive:   ['Sensitive', 'Normal'],
  normal:      ['Normal', 'All Skin Types'],
};

/* ─── Skin Profile Builder ────────────────────────────────── */
const getSkinProfile = (answers: Record<string, string | string[]>) => {
  const st = answers.skin_type as string || 'normal';
  const concerns = (answers.concerns as string[]) || [];
  const age = answers.age_range as string || 'twenties';
  const env = answers.environment as string || 'humid';
  const routine = answers.routine as string || 'moderate';

  const profileLabels: Record<string, string> = {
    oily: 'Oily Skin', dry: 'Dry Skin', combination: 'Combination Skin',
    sensitive: 'Sensitive Skin', normal: 'Normal Skin',
  };

  const envNote: Record<string, string> = {
    humid: 'Lightweight, non-comedogenic formulas work best for you.',
    urban: 'Antioxidants and pollution defense are your priority.',
    ac: 'Focus on barrier repair and deep hydration.',
    outdoor: 'SPF is non-negotiable. Antioxidant serums are essential.',
  };

  const ageNote: Record<string, string> = {
    teen: 'Focus on oil control and acne prevention.',
    twenties: 'Prevention with antioxidants and hydration.',
    thirties: 'Introduce retinol, peptides, and SPF.',
    forties: 'Prioritize firmness, hydration, and collagen support.',
    fifty_plus: 'Deep repair with rich moisturizers and barrier support.',
  };

  return {
    skinTypeLabel: profileLabels[st] || 'Normal Skin',
    envNote: envNote[env] || '',
    ageNote: ageNote[age] || '',
    routineSteps: routine === 'minimal' ? 2 : routine === 'moderate' ? 4 : 6,
  };
};

/* ─── Product Scorer ──────────────────────────────────────── */
const scoreProduct = (
  p: any,
  skinType: string,
  concerns: string[],
  budget: string
): number => {
  let score = 0;

  // Skin type match
  const skinTags = SKIN_TYPE_MAP[skinType] || [];
  if ((p.skinTypes || []).some((st: string) => skinTags.some(t => st.toLowerCase().includes(t.toLowerCase())))) {
    score += 4;
  }
  if ((p.skinTypes || []).some((st: string) => st.toLowerCase().includes('all'))) {
    score += 2;
  }

  // Concern match
  concerns.forEach(concern => {
    const keywords = CONCERN_TO_PRODUCT_CONCERN[concern] || [];
    const pConcerns = (p.concerns || []).join(' ').toLowerCase();
    const pName = (p.name || '').toLowerCase();
    const pDesc = (p.description || '').toLowerCase();
    keywords.forEach(kw => {
      if (pConcerns.includes(kw.toLowerCase()) || pName.includes(kw.toLowerCase()) || pDesc.includes(kw.toLowerCase())) {
        score += 3;
      }
    });
  });

  // Budget filter (soft)
  const price = Number(p.price) || 0;
  if (budget === 'low' && price <= 1000) score += 2;
  else if (budget === 'mid' && price > 1000 && price <= 2500) score += 2;
  else if (budget === 'high' && price > 2500) score += 2;

  // Bestseller bonus
  if (p.isBestseller) score += 1;

  return score;
};

/* ─── Main Component ──────────────────────────────────────── */
export default function QuizPage() {
  const { token, updateSkinProfile } = useAuthStore();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [completed, setCompleted] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    fetch('/api/products?includeInactive=false')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setDbProducts(data); else setDbProducts(localProducts as any); })
      .catch(() => setDbProducts(localProducts as any));
  }, []);

  useEffect(() => {
    if (token) {
      fetch('/api/quiz/history', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (data.success) setHistory(data.history || []); })
        .catch(console.error);
    }
  }, [token, completed]);

  const currentQ = QUESTIONS[step];
  const totalSteps = QUESTIONS.length;
  const progressPct = (step / totalSteps) * 100;
  const isMulti = currentQ?.multiSelect === true;
  const selectedMulti: string[] = isMulti ? ((answers[currentQ.id] as string[]) || []) : [];

  /* Toggle multi-select */
  const toggleMulti = (value: string) => {
    const max = currentQ.maxSelect || 3;
    const current = (answers[currentQ.id] as string[]) || [];
    let next: string[];
    if (current.includes(value)) {
      next = current.filter(v => v !== value);
    } else if (current.length < max) {
      next = [...current, value];
    } else {
      next = current; // max reached
    }
    setAnswers(prev => ({ ...prev, [currentQ.id]: next }));
  };

  /* Next step or finish */
  const handleNext = async () => {
    if (isMulti && selectedMulti.length === 0) return;
    const isLastStep = step === totalSteps - 1;

    if (isLastStep) {
      setIsSubmitting(true);
      if (token) {
        try {
          const skinType = answers.skin_type as string || '';
          const concerns = (answers.concerns as string[]) || [];
          await fetch('/api/quiz/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              skin_type: skinType,
              concern: concerns[0] || '',
              routine_type: answers.routine as string || '',
              budget: answers.budget as string || '',
              answers_json: JSON.stringify(answers),
            }),
          });
          updateSkinProfile(skinType);
        } catch (e) { console.error('Failed to save quiz:', e); }
      }
      setIsSubmitting(false);
      setAnimating(true);
      setTimeout(() => { setCompleted(true); setAnimating(false); }, 300);
    } else {
      setAnimating(true);
      setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 250);
    }
  };

  /* Single-select answer */
  const handleSingleAnswer = (value: string) => {
    setAnswers(prev => ({ ...prev, [currentQ.id]: value }));
    const isLastStep = step === totalSteps - 1;
    setTimeout(() => {
      if (isLastStep) handleNext();
      else { setAnimating(true); setTimeout(() => { setStep(s => s + 1); setAnimating(false); }, 250); }
    }, 200);
  };

  /* Recommendations */
  const recommendations = useMemo(() => {
    if (!completed) return [];
    const skinType = answers.skin_type as string || 'normal';
    const concerns = (answers.concerns as string[]) || [];
    const budget = answers.budget as string || 'mid';

    return [...dbProducts]
      .map(p => ({ ...p, _score: scoreProduct(p, skinType, concerns, budget) }))
      .filter(p => p._score > 0)
      .sort((a, b) => b._score - a._score)
      .slice(0, 6);
  }, [completed, answers, dbProducts]);

  const profile = useMemo(() => getSkinProfile(answers), [answers]);

  const reset = () => { setStep(0); setAnswers({}); setCompleted(false); setAnimating(false); };

  const currentAnswer = answers[currentQ?.id];
  const canProceedMulti = isMulti && selectedMulti.length > 0;

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: 80 }}>

        {/* ── Hero Header ───────────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '56px 20px 0', background: 'linear-gradient(180deg, var(--bg-surface) 0%, var(--bg-base) 100%)', borderBottom: '1px solid var(--border-default)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', background: 'rgba(201,149,109,0.1)', padding: '4px 14px', borderRadius: 20, display: 'inline-block', marginBottom: 16 }}>
            ✦ Personalized Skin Diagnostic
          </span>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 10 }}>
            {completed ? 'Your Skin Profile' : 'Skin Quiz'}
          </h1>
          {!completed && (
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto' }}>
              {totalSteps} questions · 2 minutes · Personalized product routine
            </p>
          )}

          {/* History Button */}
          {step === 0 && !completed && history.length > 0 && (
            <div style={{ maxWidth: 480, margin: '16px auto 0' }}>
              <button onClick={() => setShowHistory(!showHistory)} className="btn-outline" style={{ fontSize: 12, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                📜 {showHistory ? 'Hide History' : `Past Results (${history.length})`}
              </button>
              {showHistory && (
                <div style={{ marginTop: 12, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 8, padding: 16, textAlign: 'left', maxHeight: 200, overflowY: 'auto' }}>
                  {history.map((h, i) => (
                    <div key={h.id} style={{ paddingBottom: i !== history.length - 1 ? 12 : 0, marginBottom: i !== history.length - 1 ? 12 : 0, borderBottom: i !== history.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textTransform: 'capitalize' }}>{h.skin_type} skin</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(h.created_at).toLocaleDateString('en-BD')}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Concern: <strong>{h.concern}</strong> · Budget: {h.budget}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {!completed && (
            <div style={{ maxWidth: 520, margin: '28px auto 0', padding: '0 20px 32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
                  Step {step + 1} of {totalSteps}
                </span>
                <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700 }}>{Math.round(progressPct)}%</span>
              </div>
              {/* Track */}
              <div style={{ height: 4, background: 'var(--border-default)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progressPct}%`, background: 'linear-gradient(90deg, var(--accent), var(--sage))', borderRadius: 4, transition: 'width 0.4s cubic-bezier(0.16,1,0.3,1)' }} />
              </div>
              {/* Step dots */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                {QUESTIONS.map((_, i) => (
                  <div key={i} style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: i < step ? 'var(--sage)' : i === step ? 'var(--accent)' : 'var(--bg-elevated)',
                    border: i <= step ? 'none' : '1px solid var(--border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: i <= step ? '#FFF' : 'var(--text-muted)',
                    transition: 'all 0.3s ease',
                  }}>
                    {i < step ? <Check size={10} /> : i + 1}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Main Content ───────────────────────────────────── */}
        <div className="container-md" style={{ paddingTop: 48, paddingBottom: 40 }}>
          {completed ? (
            /* ── Result Screen ─────────────────────────────── */
            <div className="animate-fade-up">

              {/* Skin Profile Card */}
              <div style={{ maxWidth: 700, margin: '0 auto 48px', background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, overflow: 'hidden' }}>
                {/* Profile Header */}
                <div style={{ background: 'linear-gradient(135deg, rgba(201,149,109,0.15), rgba(134,162,130,0.1))', padding: '32px 28px', borderBottom: '1px solid var(--border-default)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--sage))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(201,149,109,0.3)', flexShrink: 0 }}>
                      <Sparkles size={26} style={{ color: '#FFF' }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' }}>Your Skin Profile</p>
                      <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                        {profile.skinTypeLabel}
                      </h2>
                    </div>
                  </div>

                  {/* Concern Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {((answers.concerns as string[]) || []).map(c => {
                      const opt = QUESTIONS[1].options.find(o => o.value === c);
                      return opt ? (
                        <span key={c} style={{ fontSize: 12, padding: '5px 12px', background: `${opt.color}18`, border: `1px solid ${opt.color}40`, borderRadius: 20, color: opt.color, fontWeight: 600 }}>
                          {opt.icon} {opt.label}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>

                {/* Profile Details Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 0 }}>
                  {[
                    { icon: <Shield size={16} />, label: 'Skin Type', value: profile.skinTypeLabel },
                    { icon: <Sun size={16} />, label: 'Environment', value: QUESTIONS[3].options.find(o => o.value === answers.environment)?.label || '—' },
                    { icon: <Zap size={16} />, label: 'Routine', value: QUESTIONS[5].options.find(o => o.value === answers.routine)?.label || '—' },
                    { icon: <Heart size={16} />, label: 'Budget', value: QUESTIONS[6].options.find(o => o.value === answers.budget)?.label || '—' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '16px 20px', borderRight: i < 3 ? '1px solid var(--border-subtle)' : 'none', borderTop: '1px solid var(--border-subtle)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--accent)', marginBottom: 4 }}>
                        {item.icon}
                        <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>{item.label}</span>
                      </div>
                      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Skin Notes */}
                <div style={{ padding: '16px 20px 20px', background: 'var(--bg-base)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {profile.envNote && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, display: 'flex', gap: 8 }}>
                      <span style={{ color: 'var(--accent)', flexShrink: 0 }}>🌏</span> {profile.envNote}
                    </p>
                  )}
                  {profile.ageNote && (
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0, display: 'flex', gap: 8 }}>
                      <span style={{ color: 'var(--sage)', flexShrink: 0 }}>💡</span> {profile.ageNote}
                    </p>
                  )}
                </div>
              </div>

              {/* Recommended Products */}
              {recommendations.length > 0 && (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 28 }}>
                    <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 400, color: 'var(--text-primary)', marginBottom: 6 }}>
                      Your Personalized Picks
                    </h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
                      Matched to your skin type, concerns & budget
                    </p>
                  </div>
                  <div className="quiz-results-grid">
                    {recommendations.map(p => <ProductCard key={p.id} product={p} />)}
                  </div>
                </>
              )}

              {recommendations.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border-default)', maxWidth: 500, margin: '0 auto' }}>
                  <p style={{ fontSize: 15 }}>No products found yet. Check back soon as we add more!</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 40 }}>
                <button onClick={reset} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RefreshCw size={14} /> Retake Quiz
                </button>
                <Link href="/products" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  Shop All Products <ChevronRight size={14} />
                </Link>
              </div>
            </div>

          ) : (
            /* ── Question Screen ───────────────────────────── */
            <div key={step} style={{ opacity: animating ? 0 : 1, transform: animating ? 'translateY(10px)' : 'translateY(0)', transition: 'all 0.25s ease' }}>
              {/* Question Text */}
              <div style={{ textAlign: 'center', marginBottom: 36, padding: '0 16px' }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 400, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.2 }}>
                  {currentQ.question}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  {currentQ.questionBn}
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>{currentQ.subtitle}</p>
                {isMulti && (
                  <p style={{ fontSize: 12, color: 'var(--accent)', marginTop: 6, fontWeight: 600 }}>
                    {selectedMulti.length}/{currentQ.maxSelect} selected
                  </p>
                )}
              </div>

              {/* Options Grid */}
              <div className={`quiz-opts-grid ${currentQ.options.length <= 3 ? 'quiz-opts-3' : currentQ.options.length <= 5 ? 'quiz-opts-even' : 'quiz-opts-multi'}`}>
                {currentQ.options.map(opt => {
                  const isSelected = isMulti
                    ? selectedMulti.includes(opt.value)
                    : currentAnswer === opt.value;
                  const isMaxed = isMulti && selectedMulti.length >= (currentQ.maxSelect || 3) && !isSelected;

                  return (
                    <button
                      key={opt.value}
                      onClick={() => isMulti ? toggleMulti(opt.value) : handleSingleAnswer(opt.value)}
                      disabled={isMaxed}
                      className="quiz-opt-btn"
                      style={{
                        background: isSelected ? `${opt.color || 'var(--accent)'}14` : 'var(--bg-surface)',
                        border: isSelected ? `2px solid ${opt.color || 'var(--accent)'}` : '1px solid var(--border-default)',
                        opacity: isMaxed ? 0.4 : 1,
                        cursor: isMaxed ? 'not-allowed' : 'pointer',
                        position: 'relative',
                      }}
                    >
                      {isSelected && (
                        <span style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', background: opt.color || 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Check size={10} color="#fff" />
                        </span>
                      )}
                      <div style={{ fontSize: isMulti ? 22 : 26, marginBottom: 8 }}>{opt.icon}</div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: isSelected ? (opt.color || 'var(--accent)') : 'var(--text-primary)', marginBottom: 3, lineHeight: 1.2 }}>
                        {opt.label}
                      </p>
                      {opt.labelBn && (
                        <p style={{ fontSize: 10, color: isSelected ? (opt.color || 'var(--accent)') : 'var(--text-muted)', marginBottom: 3, fontWeight: 500 }}>
                          {opt.labelBn}
                        </p>
                      )}
                      <p style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.4 }}>{opt.desc}</p>
                    </button>
                  );
                })}
              </div>

              {/* Multi-select Next Button */}
              {isMulti && (
                <div style={{ textAlign: 'center', marginTop: 28 }}>
                  <button
                    onClick={handleNext}
                    disabled={!canProceedMulti || isSubmitting}
                    className="btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: canProceedMulti ? 1 : 0.5 }}
                  >
                    Continue <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {/* Back Button */}
              {step > 0 && (
                <div style={{ textAlign: 'center', marginTop: 20 }}>
                  <button onClick={() => setStep(s => s - 1)} className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <ArrowLeft size={14} /> Back
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />

      <style>{`
        .quiz-results-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 8px;
          max-width: 900px;
          margin-left: auto;
          margin-right: auto;
        }
        @media (max-width: 880px) { .quiz-results-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; } }
        @media (max-width: 480px) { .quiz-results-grid { grid-template-columns: repeat(2, 1fr); gap: 10px; } }

        .quiz-opts-grid {
          display: grid;
          gap: 12px;
          max-width: 720px;
          margin: 0 auto;
          padding: 0 12px;
        }
        .quiz-opts-3     { grid-template-columns: repeat(3, 1fr); }
        .quiz-opts-even  { grid-template-columns: repeat(5, 1fr); }
        .quiz-opts-multi { grid-template-columns: repeat(3, 1fr); }

        @media (max-width: 640px) {
          .quiz-opts-3     { grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .quiz-opts-even  { grid-template-columns: repeat(2, 1fr); }
          .quiz-opts-multi { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        }
        @media (max-width: 380px) {
          .quiz-opts-3 { grid-template-columns: repeat(2, 1fr); }
        }

        .quiz-opt-btn {
          padding: 18px 10px;
          border-radius: 12px;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%;
        }
        .quiz-opt-btn:hover:not(:disabled) {
          border-color: var(--accent) !important;
          transform: translateY(-3px);
          box-shadow: 0 8px 28px rgba(201,149,109,0.15);
        }
        .quiz-opt-btn:active:not(:disabled) { transform: translateY(-1px); }

        @media (max-width: 480px) {
          .quiz-opt-btn { padding: 12px 6px; }
        }
      `}</style>
    </>
  );
}
