'use client';

import React, { useState } from 'react';
import { Check, X, MessageSquare, Star, Flag, Filter } from 'lucide-react';

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

const INITIAL_REVIEWS: Review[] = [
  { id: 'r1', productName: 'Niacinamide 10% + Zinc 1% Serum', userName: 'Nusrat Fariha', email: 'nusrat@gmail.com', rating: 5, comment: 'Absolutely loved the results! My pores are visibly tighter and the formula absorbs so well. Will definitely repurchase!', status: 'Pending', date: '2026-07-29' },
  { id: 'r2', productName: 'Ceramide 3% Barrier Cream', userName: 'Rakibul Hasan', email: 'rakib@gmail.com', rating: 4, comment: 'Great cream for my compromised skin barrier. Healed the flakiness within a week. Slightly heavier than expected, but works beautifully.', status: 'Approved', date: '2026-07-28', reply: 'Thank you for your wonderful review, Rakibul! We are thrilled it helped restore your barrier.' },
  { id: 'r3', productName: 'Salicylic Acid 2% Exfoliator', userName: 'Adiba Islam', email: 'adiba@yahoo.com', rating: 2, comment: 'A bit too strong for my dry cheeks, caused some irritation. Maybe okay for oilier skin types.', status: 'Pending', date: '2026-07-27' },
  { id: 'r4', productName: 'Vitamin C 15% + Ferulic Emulsion', userName: 'Shahadat Hossain', email: 'shahadat@gmail.com', rating: 5, comment: 'Game changer for dark spots! My hyperpigmentation has faded noticeably after 3 weeks of consistent use.', status: 'Approved', date: '2026-07-26' },
  { id: 'r5', productName: 'Centella Asiatica 84% Essence', userName: 'Mitu Akter', email: 'mitu@gmail.com', rating: 3, comment: 'Decent product but packaging could be improved. The essence is a bit watery for my taste.', status: 'Rejected', date: '2026-07-25' },
  { id: 'r6', productName: 'HA 2% + B5 Hydration Serum', userName: 'Faruk Ahmed', email: 'faruk@outlook.com', rating: 5, comment: 'Best hydrating serum I have ever used! Plumped my skin instantly.', status: 'Pending', date: '2026-07-29' },
];

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
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS);
  const [filter, setFilter] = useState<ReviewStatus | 'All'>('All');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const filtered = reviews.filter((r) => filter === 'All' || r.status === filter);
  const counts = {
    All: reviews.length,
    Pending: reviews.filter((r) => r.status === 'Pending').length,
    Approved: reviews.filter((r) => r.status === 'Approved').length,
    Rejected: reviews.filter((r) => r.status === 'Rejected').length,
  };

  const updateStatus = (id: string, status: ReviewStatus) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
  };

  const submitReply = (id: string) => {
    if (!replyText.trim()) return;
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, reply: replyText, status: 'Approved' } : r)));
    setReplyingTo(null);
    setReplyText('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>Review Moderation</h1>
        <p style={{ fontSize: 13, color: C.muted }}>{counts.Pending} reviews pending approval</p>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 8 }}>
        {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              background: filter === s ? (s === 'All' ? C.accent : STATUS_STYLE[s as ReviewStatus]?.color + '20') : C.surface,
              border: `1px solid ${filter === s ? (s === 'All' ? C.accent : STATUS_STYLE[s as ReviewStatus]?.color + '50') : C.border}`,
              borderRadius: 7, fontSize: 12, fontWeight: 600,
              color: filter === s ? (s === 'All' ? '#fff' : STATUS_STYLE[s as ReviewStatus]?.color) : C.muted,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {s}
            <span style={{ fontSize: 10, minWidth: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'inherit' }}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '60px 20px', textAlign: 'center', color: C.muted }}>
            <Filter size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: 14 }}>No reviews in this category</p>
          </div>
        ) : (
          filtered.map((review) => (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                      background: STATUS_STYLE[review.status].bg, color: STATUS_STYLE[review.status].color,
                      border: `1px solid ${STATUS_STYLE[review.status].color}40`,
                    }}
                  >
                    {STATUS_STYLE[review.status].label}
                  </span>
                </div>
              </div>

              {/* Review Body */}
              <div style={{ padding: '16px 22px' }}>
                <p style={{ fontSize: 12, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
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
                {replyingTo === review.id && (
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
                        onClick={() => submitReply(review.id)}
                        style={{ padding: '7px 16px', background: C.accent, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        <Check size={13} /> Post Reply
                      </button>
                      <button
                        onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        style={{ padding: '7px 14px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, color: C.muted, cursor: 'pointer' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {review.status !== 'Approved' && (
                    <button
                      onClick={() => updateStatus(review.id, 'Approved')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: `${C.success}15`, border: `1px solid ${C.success}40`, borderRadius: 7, fontSize: 12, fontWeight: 600, color: C.success, cursor: 'pointer' }}
                    >
                      <Check size={13} /> Approve
                    </button>
                  )}
                  {review.status !== 'Rejected' && (
                    <button
                      onClick={() => updateStatus(review.id, 'Rejected')}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: `${C.danger}15`, border: `1px solid ${C.danger}40`, borderRadius: 7, fontSize: 12, fontWeight: 600, color: C.danger, cursor: 'pointer' }}
                    >
                      <X size={13} /> Reject
                    </button>
                  )}
                  {!review.reply && replyingTo !== review.id && (
                    <button
                      onClick={() => { setReplyingTo(review.id); setReplyText(''); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, color: C.textSec, cursor: 'pointer' }}
                    >
                      <MessageSquare size={13} /> Reply
                    </button>
                  )}
                  {review.rating <= 2 && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.warning }}>
                      <Flag size={11} /> Low rating — review carefully
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
