'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, MessageSquare, Star, Filter, Trash2, HelpCircle } from 'lucide-react';
import { getAuthHeaders } from '../utils';

const C = {
  surface: '#1A1A17', elevated: '#222220', border: 'rgba(255,255,255,0.07)',
  text: '#F0EBE3', textSec: '#B0A8A0', muted: '#7A7470',
  accent: '#C9956D', success: '#4CAF82', warning: '#F0A54B', danger: '#E05A5A', info: '#60A5FA',
};

type ReviewStatus = 'Pending' | 'Approved' | 'Rejected';

interface Review {
  id: string; productName: string; userName: string; email: string;
  rating: number; comment: string; status: ReviewStatus; date: string; reply?: string;
}

interface Qna {
  id: string; productName: string; userName: string; email: string;
  question: string; answer?: string; answeredBy?: string; date: string;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map((s) => (
        <Star key={s} size={13} style={{ fill: s <= rating ? C.accent : 'none', color: s <= rating ? C.accent : C.border }} />
      ))}
    </div>
  );
}

const STATUS_STYLE: Record<ReviewStatus, { bg: string; color: string; label: string }> = {
  Pending: { bg: `rgba(122,116,112,0.15)`, color: C.muted, label: 'Pending' },
  Approved: { bg: `rgba(76,175,130,0.15)`, color: C.success, label: 'Approved' },
  Rejected: { bg: `rgba(224,90,90,0.15)`, color: C.danger, label: 'Rejected' },
};

export default function AdminReviews() {
  const [activeTab, setActiveTab] = useState<'reviews' | 'qnas'>('reviews');
  
  // Reviews State
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewFilter, setReviewFilter] = useState<ReviewStatus | 'All'>('All');
  const [replyingToReview, setReplyingToReview] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // QnA State
  const [qnas, setQnas] = useState<Qna[]>([]);
  const [qnaFilter, setQnaFilter] = useState<'All' | 'Unanswered' | 'Answered'>('All');
  const [answeringQna, setAnsweringQna] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');

  const [loading, setLoading] = useState(true);

  // Fetch reviews & qnas
  const loadData = async () => {
    setLoading(true);
    try {
      const [reviewsRes, qnasRes] = await Promise.all([
        fetch('/api/admin/reviews'),
        fetch('/api/admin/qnas')
      ]);

      if (reviewsRes.ok) {
        const data = await reviewsRes.json();
        if (Array.isArray(data)) setReviews(data);
      }

      if (qnasRes.ok) {
        const data = await qnasRes.json();
        if (Array.isArray(data)) setQnas(data);
      }
    } catch (e) {
      console.error('Failed to load reviews and QnAs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Review Handlers
  const handleReviewStatus = async (id: string, status: ReviewStatus) => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleReviewReply = async (id: string) => {
    if (!replyText.trim()) return;
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id, reply: replyText }),
      });
      if (res.ok) {
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, reply: replyText, status: 'Approved' } : r)));
        setReplyingToReview(null);
        setReplyText('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // QnA Handlers
  const handleQnaAnswer = async (id: string) => {
    if (!answerText.trim()) return;
    
    // Read session moderator name
    let adminName = 'Store Representative';
    const sessionStr = localStorage.getItem('bg_admin_session');
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session.name) adminName = session.name;
      } catch (e) {}
    }

    try {
      const res = await fetch('/api/admin/qnas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ id, answer: answerText, answeredBy: adminName }),
      });
      if (res.ok) {
        setQnas((prev) => prev.map((q) => (q.id === id ? { ...q, answer: answerText, answeredBy: adminName } : q)));
        setAnsweringQna(null);
        setAnswerText('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteQna = async (id: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      const res = await fetch(`/api/admin/qnas?id=${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setQnas((prev) => prev.filter((q) => q.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Review Filtering
  const filteredReviews = reviews.filter((r) => reviewFilter === 'All' || r.status === reviewFilter);
  const reviewCounts = {
    All: reviews.length,
    Pending: reviews.filter((r) => r.status === 'Pending').length,
    Approved: reviews.filter((r) => r.status === 'Approved').length,
    Rejected: reviews.filter((r) => r.status === 'Rejected').length,
  };

  // QnA Filtering
  const filteredQnas = qnas.filter((q) => {
    if (qnaFilter === 'Unanswered') return !q.answer;
    if (qnaFilter === 'Answered') return !!q.answer;
    return true;
  });
  const qnaCounts = {
    All: qnas.length,
    Unanswered: qnas.filter((q) => !q.answer).length,
    Answered: qnas.filter((q) => !!q.answer).length,
  };

  if (loading && reviews.length === 0 && qnas.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 10 }}>
        <style>{`
          @keyframes shimmer {
            0% { background-position: -400px 0; }
            100% { background-position: 400px 0; }
          }
          .rv-skel {
            border-radius: 6px;
            background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%);
            background-size: 400px 100%;
            animation: shimmer 1.4s infinite;
          }
        `}</style>
        {/* Header skeleton */}
        <div>
          <div className="rv-skel" style={{ width: 200, height: 26, marginBottom: 10 }} />
          <div className="rv-skel" style={{ width: 280, height: 14 }} />
        </div>
        {/* Tab bar skeleton */}
        <div style={{ display: 'flex', gap: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
          <div className="rv-skel" style={{ width: 120, height: 32, borderRadius: 8 }} />
          <div className="rv-skel" style={{ width: 160, height: 32, borderRadius: 8 }} />
        </div>
        {/* Filter chips skeleton */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[80, 100, 100, 100].map((w, i) => (
            <div key={i} className="rv-skel" style={{ width: w, height: 28, borderRadius: 20 }} />
          ))}
        </div>
        {/* Cards skeleton */}
        {[1,2,3].map((i) => (
          <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column', gap: 12, opacity: 1 - i * 0.2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div className="rv-skel" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="rv-skel" style={{ width: 120, height: 13 }} />
                  <div className="rv-skel" style={{ width: 80, height: 10 }} />
                </div>
              </div>
              <div className="rv-skel" style={{ width: 70, height: 22, borderRadius: 20 }} />
            </div>
            <div className="rv-skel" style={{ width: '90%', height: 13 }} />
            <div className="rv-skel" style={{ width: '70%', height: 13 }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div className="rv-skel" style={{ width: 80, height: 28, borderRadius: 6 }} />
              <div className="rv-skel" style={{ width: 80, height: 28, borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>Moderation Centre</h1>
        <p style={{ fontSize: 13, color: C.muted }}>Manage store reviews and answer customer questions.</p>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
        <button
          onClick={() => setActiveTab('reviews')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: `2.5px solid ${activeTab === 'reviews' ? C.accent : 'transparent'}`,
            color: activeTab === 'reviews' ? C.accent : C.muted,
            fontSize: 13,
            fontWeight: 700,
            padding: '8px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          ⭐ Product Reviews ({reviewCounts.Pending} Pending)
        </button>
        <button
          onClick={() => setActiveTab('qnas')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: `2.5px solid ${activeTab === 'qnas' ? C.accent : 'transparent'}`,
            color: activeTab === 'qnas' ? C.accent : C.muted,
            fontSize: 13,
            fontWeight: 700,
            padding: '8px 16px',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          ❓ Product Q&A ({qnaCounts.Unanswered} Unanswered)
        </button>
      </div>

      {/* ══ REVIEWS MODERATION TAB ════════════════════════════════════════════ */}
      {activeTab === 'reviews' && (
        <>
          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setReviewFilter(s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                  background: reviewFilter === s ? (s === 'All' ? C.accent : STATUS_STYLE[s as ReviewStatus]?.color + '20') : C.surface,
                  border: `1px solid ${reviewFilter === s ? (s === 'All' ? C.accent : STATUS_STYLE[s as ReviewStatus]?.color + '50') : C.border}`,
                  borderRadius: 7, fontSize: 12, fontWeight: 600,
                  color: reviewFilter === s ? (s === 'All' ? '#fff' : STATUS_STYLE[s as ReviewStatus]?.color) : C.muted,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {s}
                <span style={{ fontSize: 10, minWidth: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit' }}>
                  {reviewCounts[s]}
                </span>
              </button>
            ))}
          </div>

          {/* Reviews List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredReviews.length === 0 ? (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '60px 20px', textAlign: 'center', color: C.muted }}>
                <Filter size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ fontSize: 14 }}>No reviews in this category</p>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div
                  key={review.id}
                  style={{
                    background: C.surface, border: `1px solid ${review.status === 'Pending' ? 'rgba(240,165,75,0.25)' : C.border}`,
                    borderRadius: 10, overflow: 'hidden',
                  }}
                >
                  {/* Review Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, #8B7050)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {review.userName.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{review.userName}</p>
                        <p style={{ fontSize: 11, color: C.muted, marginBottom: 6 }}>{review.email} · {review.date}</p>
                        <StarRating rating={review.rating} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                          background: STATUS_STYLE[review.status].bg, color: STATUS_STYLE[review.status].color,
                          border: `1px solid ${STATUS_STYLE[review.status].color}40`,
                        }}
                      >
                        {STATUS_STYLE[review.status].label}
                      </span>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', borderRadius: 6 }}
                        onMouseEnter={(e) => e.currentTarget.style.background = `${C.danger}15`}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Review Body */}
                  <div style={{ padding: '16px 22px' }}>
                    <p style={{ fontSize: 11, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                      Re: {review.productName}
                    </p>
                    <p style={{ fontSize: 14, color: C.textSec, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 16 }}>
                      "{review.comment}"
                    </p>

                    {/* Existing Reply */}
                    {review.reply && (
                      <div
                        style={{
                          background: `${C.accent}08`, border: `1px solid ${C.accent}25`,
                          borderRadius: 8, padding: '12px 16px', marginBottom: 16, marginLeft: 20,
                        }}
                      >
                        <p style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 6 }}>↳ Store Reply</p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>{review.reply}</p>
                      </div>
                    )}

                    {/* Reply Form */}
                    {replyingToReview === review.id && (
                      <div style={{ marginBottom: 16 }}>
                        <textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Write a professional reply..."
                          rows={3}
                          autoFocus
                          style={{
                            width: '100%', padding: '10px 14px', background: C.elevated,
                            border: `1px solid ${C.accent}`, borderRadius: 8, fontSize: 13,
                            color: C.text, fontFamily: "'DM Sans', sans-serif", resize: 'none', outline: 'none', marginBottom: 10,
                          }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleReviewReply(review.id)}
                            style={{ padding: '7px 16px', background: C.accent, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <Check size={13} /> Post Reply
                          </button>
                          <button
                            onClick={() => { setReplyingToReview(null); setReplyText(''); }}
                            style={{ padding: '7px 14px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, color: C.muted, cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {review.status !== 'Approved' && (
                        <button
                          onClick={() => handleReviewStatus(review.id, 'Approved')}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: `${C.success}15`, border: `1px solid ${C.success}40`, borderRadius: 7, fontSize: 12, fontWeight: 600, color: C.success, cursor: 'pointer' }}
                        >
                          <Check size={13} /> Approve
                        </button>
                      )}
                      {review.status !== 'Rejected' && (
                        <button
                          onClick={() => handleReviewStatus(review.id, 'Rejected')}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: `${C.danger}15`, border: `1px solid ${C.danger}40`, borderRadius: 7, fontSize: 12, fontWeight: 600, color: C.danger, cursor: 'pointer' }}
                        >
                          <X size={13} /> Reject
                        </button>
                      )}
                      {!review.reply && replyingToReview !== review.id && (
                        <button
                          onClick={() => { setReplyingToReview(review.id); setReplyText(''); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}
                        >
                          <MessageSquare size={13} /> Reply
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ══ QNA MODERATION TAB ═══════════════════════════════════════════════ */}
      {activeTab === 'qnas' && (
        <>
          {/* QnA Filter Tabs */}
          <div style={{ display: 'flex', gap: 8 }}>
            {(['All', 'Unanswered', 'Answered'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setQnaFilter(s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                  background: qnaFilter === s ? C.accent : C.surface,
                  border: `1px solid ${qnaFilter === s ? C.accent : C.border}`,
                  borderRadius: 7, fontSize: 12, fontWeight: 600,
                  color: qnaFilter === s ? '#fff' : C.muted,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {s}
                <span style={{ fontSize: 10, minWidth: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit' }}>
                  {qnaCounts[s]}
                </span>
              </button>
            ))}
          </div>

          {/* QnA List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredQnas.length === 0 ? (
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '60px 20px', textAlign: 'center', color: C.muted }}>
                <HelpCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ fontSize: 14 }}>No questions found in this category</p>
              </div>
            ) : (
              filteredQnas.map((q) => (
                <div
                  key={q.id}
                  style={{
                    background: C.surface, border: `1px solid ${!q.answer ? 'rgba(240,165,75,0.25)' : C.border}`,
                    borderRadius: 10, overflow: 'hidden',
                  }}
                >
                  {/* QnA Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <div style={{ width: 42, height: 42, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, #8B7050)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {q.userName.charAt(0)}
                      </div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{q.userName}</p>
                        <p style={{ fontSize: 11, color: C.muted }}>{q.email} · {q.date}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                          background: q.answer ? `rgba(76,175,130,0.15)` : `rgba(240,165,75,0.15)`,
                          color: q.answer ? C.success : C.warning,
                          border: `1px solid ${q.answer ? C.success : C.warning}40`,
                        }}
                      >
                        {q.answer ? 'Answered' : 'Unanswered'}
                      </span>
                      <button
                        onClick={() => handleDeleteQna(q.id)}
                        style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center', borderRadius: 6 }}
                        onMouseEnter={(e) => e.currentTarget.style.background = `${C.danger}15`}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* QnA Body */}
                  <div style={{ padding: '16px 22px' }}>
                    <p style={{ fontSize: 11, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                      Question Re: {q.productName}
                    </p>
                    <p style={{ fontSize: 14, color: C.text, fontWeight: 600, lineHeight: 1.6, marginBottom: 16 }}>
                      "{q.question}"
                    </p>

                    {/* Answer Block */}
                    {q.answer && (
                      <div
                        style={{
                          background: `rgba(76,175,130,0.04)`, border: `1px solid rgba(76,175,130,0.15)`,
                          borderRadius: 8, padding: '12px 16px', marginBottom: 16, marginLeft: 20,
                        }}
                      >
                        <p style={{ fontSize: 11, fontWeight: 700, color: C.success, marginBottom: 6 }}>
                          ↳ Answered by {q.answeredBy || 'Store Representative'}
                        </p>
                        <p style={{ fontSize: 13, color: C.textSec, lineHeight: 1.6 }}>{q.answer}</p>
                      </div>
                    )}

                    {/* Answer Form */}
                    {answeringQna === q.id && (
                      <div style={{ marginBottom: 16 }}>
                        <textarea
                          value={answerText}
                          onChange={(e) => setAnswerText(e.target.value)}
                          placeholder="Write a helpful response..."
                          rows={3}
                          autoFocus
                          style={{
                            width: '100%', padding: '10px 14px', background: C.elevated,
                            border: `1px solid ${C.accent}`, borderRadius: 8, fontSize: 13,
                            color: C.text, fontFamily: "'DM Sans', sans-serif", resize: 'none', outline: 'none', marginBottom: 10,
                          }}
                        />
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => handleQnaAnswer(q.id)}
                            style={{ padding: '7px 16px', background: C.accent, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                          >
                            <Check size={13} /> Post Answer
                          </button>
                          <button
                            onClick={() => { setAnsweringQna(null); setAnswerText(''); }}
                            style={{ padding: '7px 14px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, color: C.muted, cursor: 'pointer' }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action Row */}
                    {!q.answer && answeringQna !== q.id && (
                      <div>
                        <button
                          onClick={() => { setAnsweringQna(q.id); setAnswerText(''); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}
                        >
                          <MessageSquare size={13} /> Reply / Answer Question
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
