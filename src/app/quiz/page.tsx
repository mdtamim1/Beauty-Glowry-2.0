'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Sparkles, RefreshCw } from 'lucide-react';
import { products } from '../../data/products';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import { useAuthStore } from '../../store/useAuthStore';

const QUESTIONS = [
  {
    id: 'skin_type',
    question: 'What is your primary skin type?',
    subtitle: 'Be honest — this determines your entire routine',
    options: [
      { value: 'oily', label: 'Oily', desc: 'Shine appears within hours, pores visible', icon: '💧' },
      { value: 'dry', label: 'Dry', desc: 'Feels tight, occasional flaking', icon: '🌵' },
      { value: 'combination', label: 'Combination', desc: 'T-zone oily, cheeks normal/dry', icon: '⚖️' },
      { value: 'sensitive', label: 'Sensitive', desc: 'Easily irritated, prone to redness', icon: '🌸' },
      { value: 'normal', label: 'Normal', desc: 'Balanced, few issues', icon: '✨' },
    ],
  },
  {
    id: 'concern',
    question: 'What is your #1 skin concern?',
    subtitle: 'Choose the concern that bothers you most',
    options: [
      { value: 'acne', label: 'Acne & Blemishes', desc: 'Pimples, blackheads, whiteheads', icon: '⚡' },
      { value: 'aging', label: 'Anti-Aging', desc: 'Fine lines, loss of firmness', icon: '⏳' },
      { value: 'darkspots', label: 'Hyperpigmentation', desc: 'Dark spots, uneven tone', icon: '🔵' },
      { value: 'hydration', label: 'Dehydration', desc: 'Lacks moisture, dull looking', icon: '💦' },
      { value: 'brightening', label: 'Dullness', desc: 'Lack of radiance and glow', icon: '☀️' },
      { value: 'sensitive', label: 'Sensitivity', desc: 'Redness, reactive skin', icon: '🌿' },
    ],
  },
  {
    id: 'routine',
    question: 'How complex is your current routine?',
    subtitle: 'We will match recommendations to your preference',
    options: [
      { value: 'minimal', label: 'Minimal', desc: 'Cleanse + moisturize only', icon: '○' },
      { value: 'moderate', label: 'Moderate', desc: '3-5 steps, some actives', icon: '◑' },
      { value: 'full', label: 'Full Routine', desc: '6+ steps, love layering', icon: '●' },
    ],
  },
  {
    id: 'budget',
    question: 'What is your monthly skincare budget?',
    subtitle: "We have premium solutions for every range",
    options: [
      { value: 'low', label: 'Under ৳1,000', desc: 'Essentials only', icon: '💚' },
      { value: 'mid', label: '৳1,000 – ৳2,500', desc: 'Best value range', icon: '💛' },
      { value: 'high', label: '৳2,500+', desc: 'Premium formulations', icon: '🥇' },
    ],
  },
];

const CONCERN_MAP: Record<string, string[]> = {
  acne: ['Acne & Blemishes', 'Blackheads & Pores'],
  aging: ['Aging & Fine Lines'],
  darkspots: ['Hyperpigmentation & Dark Spots'],
  hydration: ['Dehydration & Dryness'],
  brightening: ['Dullness & Uneven Tone'],
  sensitive: ['Redness & Sensitivity'],
};

const SKIN_TYPE_MAP: Record<string, string[]> = {
  oily: ['Oily', 'Combination', 'Acne-Prone'],
  dry: ['Dry', 'Dehydrated'],
  combination: ['Combination', 'Normal'],
  sensitive: ['Sensitive'],
  normal: ['Normal', 'All Skin Types'],
};

export default function QuizPage() {
  const { token, updateSkinProfile } = useAuthStore();

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [dbProducts, setDbProducts] = useState<typeof products>([]);

  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setDbProducts(data); })
      .catch(err => console.error('Failed to fetch live products for quiz:', err));
  }, []);

  const currentQ = QUESTIONS[step];
  const isLastStep = step === QUESTIONS.length - 1;

  useEffect(() => {
    if (token) {
      fetch('/api/quiz/history', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => { if (data.success) setHistory(data.history || []); })
        .catch(console.error);
    }
  }, [token, completed]);

  const handleAnswer = async (value: string) => {
    const updated = { ...answers, [currentQ.id]: value };
    setAnswers(updated);
    if (isLastStep) {
      if (token) {
        try {
          await fetch('/api/quiz/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ skin_type: updated.skin_type, concern: updated.concern, routine_type: updated.routine, budget: updated.budget, answers_json: JSON.stringify(updated) })
          });
          updateSkinProfile(updated.skin_type);
        } catch (e) { console.error('Failed to sync skin quiz:', e); }
      }
      setTimeout(() => setCompleted(true), 300);
    } else {
      setTimeout(() => setStep(step + 1), 300);
    }
  };

  const getRecommendations = () => {
    const concern = answers.concern || 'acne';
    const skinType = answers.skin_type || 'oily';
    const concernTags = CONCERN_MAP[concern] || [];
    const skinTypeTags = SKIN_TYPE_MAP[skinType] || [];
    return dbProducts
      .filter(p => {
        const mc = p.concerns.some(c => concernTags.some(tag => c.includes(tag.split(' ')[0])));
        const ms = p.skinTypes.some(st => skinTypeTags.includes(st));
        return mc || ms;
      })
      .sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0))
      .slice(0, 4);
  };

  const reset = () => { setStep(0); setAnswers({}); setCompleted(false); };

  const colClass = !completed && currentQ ? (currentQ.options.length <= 3 ? 'quiz-opts-3' : 'quiz-opts-even') : '';

  return (
    <>
      <Navbar />
      <div style={{ minHeight: '90vh', background: 'var(--bg-base)', paddingBottom: 80 }}>

        {/* ── Header ──────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', padding: '64px 20px 48px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 14 }}>
            Personalized Routine Builder
          </p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(28px, 5vw, 56px)', fontWeight: 400, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: 12 }}>
            Your Skin Diagnostic
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 32px' }}>
            4 questions. 2 minutes. Your perfect clinical routine.
          </p>

          {step === 0 && !completed && history.length > 0 && (
            <div style={{ maxWidth: 480, margin: '0 auto' }}>
              <button onClick={() => setShowHistory(!showHistory)} className="btn-outline" style={{ fontSize: 12, padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                📜 {showHistory ? 'Hide History' : `View History (${history.length})`}
              </button>
              {showHistory && (
                <div style={{ marginTop: 16, background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 4, padding: 16, textAlign: 'left', maxHeight: 240, overflowY: 'auto' }}>
                  {history.map((h, i) => (
                    <div key={h.id} style={{ paddingBottom: i !== history.length - 1 ? 12 : 0, marginBottom: i !== history.length - 1 ? 12 : 0, borderBottom: i !== history.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textTransform: 'capitalize' }}>Type: {h.skin_type}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(h.created_at).toLocaleDateString()}</span>
                      </div>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Concern: <strong>{h.concern}</strong> · Routine: {h.routine_type} · Budget: {h.budget}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {!completed && (
            <div style={{ maxWidth: 480, margin: '28px auto 0', position: 'relative', padding: '0 10px' }}>
              <div style={{ position: 'absolute', top: 14, left: 24, right: 24, height: 1, background: 'var(--border-default)', zIndex: 0 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {QUESTIONS.map((_, i) => (
                  <div key={i} style={{
                    width: 28, height: 28, borderRadius: '50%', zIndex: 1, position: 'relative',
                    background: i < step ? 'var(--sage)' : i === step ? 'var(--accent)' : 'var(--bg-elevated)',
                    border: i <= step ? 'none' : '1px solid var(--border-default)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: i <= step ? '#FFF' : 'var(--text-muted)',
                    transition: 'all 0.3s ease',
                  }}>
                    {i < step ? <Check size={12} /> : i + 1}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Content ─────────────────────────────────────────── */}
        <div className="container-md" style={{ paddingTop: 48 }}>
          {completed ? (
            /* Results */
            <div className="animate-fade-up">
              <div style={{ textAlign: 'center', marginBottom: 40, padding: '0 16px' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--sage))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 12px 40px rgba(201,149,109,0.3)' }}>
                  <Sparkles size={32} style={{ color: '#FFF' }} />
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(24px, 5vw, 40px)', fontWeight: 400, color: 'var(--text-primary)', marginBottom: 12 }}>
                  Your Personalized Routine
                </h2>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 20px' }}>
                  Based on your <strong>{answers.skin_type}</strong> skin type and <strong>{answers.concern}</strong> concern.
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {Object.entries(answers).map(([key, val]) => (
                    <span key={key} style={{ fontSize: 11, padding: '4px 12px', background: 'rgba(201,149,109,0.08)', border: '1px solid rgba(201,149,109,0.25)', borderRadius: 2, color: 'var(--accent)', fontWeight: 600, textTransform: 'capitalize' }}>{val}</span>
                  ))}
                </div>
              </div>

              {/* Responsive product grid */}
              <div className="quiz-results-grid">
                {getRecommendations().map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 40, padding: '0 16px' }}>
                <button onClick={reset} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RefreshCw size={14} /> Retake Quiz
                </button>
                <Link href="/products" className="btn-primary">Shop All Products →</Link>
              </div>
            </div>
          ) : (
            /* Question */
            <div className="animate-scale-in" key={step}>
              <div style={{ textAlign: 'center', marginBottom: 36, padding: '0 16px' }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", marginBottom: 10 }}>
                  Step {step + 1} of {QUESTIONS.length}
                </p>
                <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(22px, 4vw, 38px)', fontWeight: 400, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.2 }}>
                  {currentQ.question}
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{currentQ.subtitle}</p>
              </div>

              <div className={`quiz-opts-grid ${colClass}`}>
                {currentQ.options.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(opt.value)}
                    className="quiz-opt-btn"
                    style={{
                      background: answers[currentQ.id] === opt.value ? 'rgba(201,149,109,0.08)' : 'var(--bg-surface)',
                      border: answers[currentQ.id] === opt.value ? '2px solid var(--accent)' : '1px solid var(--border-default)',
                    }}
                  >
                    <div style={{ fontSize: 26, marginBottom: 8 }}>{opt.icon}</div>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{opt.label}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>{opt.desc}</p>
                  </button>
                ))}
              </div>

              {step > 0 && (
                <div style={{ textAlign: 'center', marginTop: 28 }}>
                  <button onClick={() => setStep(step - 1)} className="btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
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
        /* Results product grid */
        .quiz-results-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 8px;
        }
        @media (max-width: 880px) {
          .quiz-results-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; }
        }
        @media (max-width: 400px) {
          .quiz-results-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
        }

        /* Quiz option grid */
        .quiz-opts-grid {
          display: grid;
          gap: 14px;
          max-width: 680px;
          margin: 0 auto;
          padding: 0 12px;
        }
        .quiz-opts-3 { grid-template-columns: repeat(3, 1fr); }
        .quiz-opts-even { grid-template-columns: repeat(2, 1fr); }

        @media (max-width: 520px) {
          .quiz-opts-3 { grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .quiz-opts-even { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        }
        @media (max-width: 360px) {
          .quiz-opts-3 { grid-template-columns: repeat(2, 1fr); }
        }

        .quiz-opt-btn {
          padding: 20px 12px;
          border-radius: 8px;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%;
        }
        .quiz-opt-btn:hover {
          border-color: var(--accent) !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(201,149,109,0.12);
        }
        @media (max-width: 480px) {
          .quiz-opt-btn { padding: 14px 8px; }
          .quiz-opt-btn p:first-of-type { font-size: 13px !important; }
          .quiz-opt-btn p:last-of-type { font-size: 10px !important; }
        }
      `}</style>
    </>
  );
}
