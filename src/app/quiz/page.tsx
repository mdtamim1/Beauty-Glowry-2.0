'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Check, Sparkles, RefreshCw } from 'lucide-react';
import { products, skinConcerns } from '../../data/products';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';

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
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);

  const currentQ = QUESTIONS[step];
  const isLastStep = step === QUESTIONS.length - 1;
  const progress = ((step) / QUESTIONS.length) * 100;

  const handleAnswer = (value: string) => {
    const updated = { ...answers, [currentQ.id]: value };
    setAnswers(updated);

    if (isLastStep) {
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

    return products
      .filter((p) => {
        const matchesConcern = p.concerns.some((c) => concernTags.some((tag) => c.includes(tag.split(' ')[0])));
        const matchesSkin = p.skinTypes.some((st) => skinTypeTags.includes(st));
        return matchesConcern || matchesSkin;
      })
      .sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0))
      .slice(0, 4);
  };

  const reset = () => {
    setStep(0);
    setAnswers({});
    setCompleted(false);
  };

  return (
    <>
      <Navbar />

      <div style={{ minHeight: '90vh', background: 'var(--bg-base)', paddingBottom: 80 }}>
        {/* Header */}
        <div
          style={{
            textAlign: 'center',
            padding: '64px 20px 0',
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-default)',
            paddingBottom: 48,
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
              marginBottom: 14,
            }}
          >
            Personalized Routine Builder
          </p>
          <h1
            className="font-editorial"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(36px, 5vw, 56px)',
              fontWeight: 400,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
              marginBottom: 12,
            }}
          >
            Your Skin Diagnostic
          </h1>
          <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 480, margin: '0 auto 32px' }}>
            4 questions. 2 minutes. Your perfect clinical routine.
          </p>

          {!completed && (
            <>
              {/* Progress Bar */}
              <div
                style={{ width: '100%', maxWidth: 480, margin: '0 auto', position: 'relative' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  {QUESTIONS.map((_, i) => (
                    <div
                      key={i}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: i < step ? 'var(--sage)' : i === step ? 'var(--accent)' : 'var(--bg-elevated)',
                        border: i <= step ? 'none' : '1px solid var(--border-default)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        color: i <= step ? '#FFF' : 'var(--text-muted)',
                        transition: 'all 0.3s ease',
                        zIndex: 1,
                      }}
                    >
                      {i < step ? <Check size={12} /> : i + 1}
                    </div>
                  ))}
                  <div
                    style={{
                      position: 'absolute',
                      top: 14,
                      left: 14,
                      right: 14,
                      height: 1,
                      background: 'var(--border-default)',
                      zIndex: 0,
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Quiz Content */}
        <div className="container-md" style={{ paddingTop: 56 }}>
          {completed ? (
            // Results
            <div className="animate-fade-up">
              <div style={{ textAlign: 'center', marginBottom: 56 }}>
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--accent), var(--sage))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px',
                    boxShadow: '0 12px 40px rgba(201,149,109,0.3)',
                  }}
                >
                  <Sparkles size={32} style={{ color: '#FFF' }} />
                </div>
                <h2
                  className="font-editorial"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 40,
                    fontWeight: 400,
                    color: 'var(--text-primary)',
                    marginBottom: 12,
                  }}
                >
                  Your Personalized Routine
                </h2>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 440, margin: '0 auto 32px' }}>
                  Based on your {answers.skin_type} skin type and {answers.concern} concern,
                  these formulations are clinically matched for you.
                </p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {Object.entries(answers).map(([key, val]) => (
                    <span
                      key={key}
                      style={{
                        fontSize: 12,
                        padding: '6px 14px',
                        background: 'rgba(201,149,109,0.08)',
                        border: '1px solid rgba(201,149,109,0.25)',
                        borderRadius: 2,
                        color: 'var(--accent)',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {val}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 48 }}>
                {getRecommendations().map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                <button onClick={reset} className="btn-outline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RefreshCw size={14} /> Retake Quiz
                </button>
                <Link href="/products" className="btn-primary">
                  Shop All Products <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            // Question
            <div className="animate-scale-in" key={step}>
              <div style={{ textAlign: 'center', marginBottom: 48 }}>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace", marginBottom: 12 }}>
                  Step {step + 1} of {QUESTIONS.length}
                </p>
                <h2
                  className="font-editorial"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: 38,
                    fontWeight: 400,
                    color: 'var(--text-primary)',
                    marginBottom: 10,
                    lineHeight: 1.2,
                  }}
                >
                  {currentQ.question}
                </h2>
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{currentQ.subtitle}</p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: currentQ.options.length <= 3 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
                  gap: 16,
                  maxWidth: 640,
                  margin: '0 auto',
                }}
              >
                {currentQ.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(opt.value)}
                    style={{
                      padding: '24px 20px',
                      background: answers[currentQ.id] === opt.value ? 'rgba(201,149,109,0.08)' : 'var(--bg-surface)',
                      border: answers[currentQ.id] === opt.value ? '1px solid var(--accent)' : '1px solid var(--border-default)',
                      borderRadius: 4,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                    onMouseEnter={(e) => {
                      if (answers[currentQ.id] !== opt.value) {
                        e.currentTarget.style.borderColor = 'var(--accent)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (answers[currentQ.id] !== opt.value) {
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }
                    }}
                  >
                    <div style={{ fontSize: 28, marginBottom: 12 }}>{opt.icon}</div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{opt.label}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{opt.desc}</p>
                  </button>
                ))}
              </div>

              {step > 0 && (
                <div style={{ textAlign: 'center', marginTop: 32 }}>
                  <button
                    onClick={() => setStep(step - 1)}
                    className="btn-ghost"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}
