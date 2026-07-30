'use client';

import React, { useState } from 'react';
import {
  Tag, Zap, Image as ImageIcon, ToggleLeft, ToggleRight,
  Plus, Trash2, Edit2, Check, X, Clock, Save, ChevronDown
} from 'lucide-react';

const C = {
  surface: '#1A1A17', elevated: '#222220', border: 'rgba(255,255,255,0.07)',
  text: '#F0EBE3', textSec: '#B0A8A0', muted: '#7A7470',
  accent: '#C9956D', success: '#4CAF82', warning: '#F0A54B', danger: '#E05A5A',
};

interface Coupon {
  code: string; type: 'percentage' | 'flat'; value: number;
  minOrder: number; isActive: boolean; usedCount: number; expires?: string;
}

interface HeroSlide {
  id: number; title: string; subtitle: string; cta: string; image: string; isActive: boolean;
}

interface Section {
  key: string; label: string; isVisible: boolean;
}

const INITIAL_COUPONS: Coupon[] = [
  { code: 'GLOWRY10', type: 'percentage', value: 10, minOrder: 1000, isActive: true, usedCount: 42 },
  { code: 'BARRIER300', type: 'flat', value: 300, minOrder: 2500, isActive: true, usedCount: 18 },
  { code: 'WELCOME5', type: 'percentage', value: 5, minOrder: 500, isActive: false, usedCount: 89 },
  { code: 'FLASH20', type: 'percentage', value: 20, minOrder: 1500, isActive: false, usedCount: 5, expires: '2026-08-01' },
];

const INITIAL_SLIDES: HeroSlide[] = [
  { id: 1, title: 'Science Meets Luxury Skin', subtitle: 'Clinically formulated for measurable results.', cta: 'Shop Now', image: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?q=80&w=1600', isActive: true },
  { id: 2, title: 'New: Ceramide Barrier Cream', subtitle: 'Restore your skin barrier with bio-identical lipids.', cta: 'Discover', image: 'https://images.unsplash.com/photo-1608248597309-45da1707ad33?q=80&w=1600', isActive: true },
];

const INITIAL_SECTIONS: Section[] = [
  { key: 'trust', label: 'Trust Bar (Free Delivery, etc.)', isVisible: true },
  { key: 'concerns', label: 'Skin Concerns Grid', isVisible: true },
  { key: 'bestsellers', label: 'Bestsellers Section', isVisible: true },
  { key: 'brand_story', label: 'Brand Story Banner', isVisible: true },
  { key: 'new_arrivals', label: 'New Arrivals Section', isVisible: true },
  { key: 'testimonials', label: 'Customer Testimonials', isVisible: true },
  { key: 'quiz_cta', label: 'Skin Quiz CTA Banner', isVisible: true },
];

type ActiveTab = 'coupons' | 'flash' | 'hero' | 'sections';

function TabBtn({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
        background: active ? `${C.accent}18` : 'transparent',
        border: `1px solid ${active ? `${C.accent}50` : C.border}`,
        borderRadius: 8, fontSize: 13, fontWeight: active ? 700 : 500,
        color: active ? C.accent : C.muted, cursor: 'pointer', transition: 'all 0.15s',
      }}
    >
      {icon} {label}
    </button>
  );
}

export default function AdminMarketing() {
  const [tab, setTab] = useState<ActiveTab>('coupons');
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [slides, setSlides] = useState<HeroSlide[]>(INITIAL_SLIDES);
  const [sections, setSections] = useState<Section[]>(INITIAL_SECTIONS);

  // Flash Sale State
  const [flashActive, setFlashActive] = useState(false);
  const [flashDiscount, setFlashDiscount] = useState(20);
  const [flashLabel, setFlashLabel] = useState('Flash Sale!');
  const [flashEndDate, setFlashEndDate] = useState('2026-08-01T23:59');

  // Coupon Modal
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponForm, setCouponForm] = useState<Coupon>({ code: '', type: 'percentage', value: 10, minOrder: 500, isActive: true, usedCount: 0 });

  // Hero Slide Modal
  const [showSlideModal, setShowSlideModal] = useState(false);
  const [slideForm, setSlideForm] = useState<HeroSlide>({ id: 0, title: '', subtitle: '', cta: 'Shop Now', image: '', isActive: true });
  const [editSlideId, setEditSlideId] = useState<number | null>(null);

  // Coupon handlers
  const addCoupon = () => {
    if (!couponForm.code) return;
    setCoupons((prev) => [...prev, { ...couponForm, code: couponForm.code.toUpperCase() }]);
    setShowCouponModal(false);
    setCouponForm({ code: '', type: 'percentage', value: 10, minOrder: 500, isActive: true, usedCount: 0 });
  };
  const toggleCoupon = (code: string) => setCoupons((prev) => prev.map((c) => c.code === code ? { ...c, isActive: !c.isActive } : c));
  const deleteCoupon = (code: string) => setCoupons((prev) => prev.filter((c) => c.code !== code));

  // Slide handlers
  const saveSlide = () => {
    if (!slideForm.title || !slideForm.image) return;
    if (editSlideId) {
      setSlides((prev) => prev.map((s) => s.id === editSlideId ? { ...slideForm, id: editSlideId } : s));
    } else {
      setSlides((prev) => [...prev, { ...slideForm, id: Date.now() }]);
    }
    setShowSlideModal(false);
    setEditSlideId(null);
    setSlideForm({ id: 0, title: '', subtitle: '', cta: 'Shop Now', image: '', isActive: true });
  };
  const deleteSlide = (id: number) => setSlides((prev) => prev.filter((s) => s.id !== id));
  const toggleSlide = (id: number) => setSlides((prev) => prev.map((s) => s.id === id ? { ...s, isActive: !s.isActive } : s));
  const editSlide = (slide: HeroSlide) => { setSlideForm(slide); setEditSlideId(slide.id); setShowSlideModal(true); };

  // Section toggle
  const toggleSection = (key: string) => setSections((prev) => prev.map((s) => s.key === key ? { ...s, isVisible: !s.isVisible } : s));

  const inputStyle = {
    width: '100%', padding: '10px 12px', background: C.elevated, border: `1px solid ${C.border}`,
    borderRadius: 7, fontSize: 13, color: C.text, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>Marketing</h1>
        <p style={{ fontSize: 13, color: C.muted }}>Manage coupons, promotions, and homepage content</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <TabBtn active={tab === 'coupons'} icon={<Tag size={14} />} label="Coupons" onClick={() => setTab('coupons')} />
        <TabBtn active={tab === 'flash'} icon={<Zap size={14} />} label="Flash Sale" onClick={() => setTab('flash')} />
        <TabBtn active={tab === 'hero'} icon={<ImageIcon size={14} />} label="Hero Banners" onClick={() => setTab('hero')} />
        <TabBtn active={tab === 'sections'} icon={<ToggleRight size={14} />} label="Page Sections" onClick={() => setTab('sections')} />
      </div>

      {/* ══ COUPONS ════════════════════════════════════════════════════ */}
      {tab === 'coupons' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: C.muted }}>{coupons.filter((c) => c.isActive).length} active coupons</p>
            <button
              onClick={() => setShowCouponModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: C.accent, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: `0 4px 16px rgba(201,149,109,0.25)` }}
            >
              <Plus size={14} /> New Coupon
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {coupons.map((c) => (
              <div
                key={c.code}
                style={{
                  display: 'grid', gridTemplateColumns: '160px 1fr auto auto auto',
                  alignItems: 'center', gap: 16, padding: '16px 22px',
                  background: C.surface, border: `1px solid ${c.isActive ? `${C.success}30` : C.border}`,
                  borderRadius: 10, transition: 'border-color 0.2s',
                }}
              >
                <div>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 700, color: C.accent, letterSpacing: '0.08em' }}>{c.code}</p>
                  {c.expires && <p style={{ fontSize: 10, color: C.warning, marginTop: 2 }}>Expires {c.expires}</p>}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, padding: '3px 10px', background: C.elevated, borderRadius: 4, color: C.textSec }}>
                    {c.type === 'percentage' ? `${c.value}% off` : `৳${c.value} off`}
                  </span>
                  <span style={{ fontSize: 12, padding: '3px 10px', background: C.elevated, borderRadius: 4, color: C.muted }}>
                    Min ৳{c.minOrder.toLocaleString()}
                  </span>
                  <span style={{ fontSize: 12, padding: '3px 10px', background: C.elevated, borderRadius: 4, color: C.muted }}>
                    Used: {c.usedCount}×
                  </span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: c.isActive ? `${C.success}15` : C.elevated, color: c.isActive ? C.success : C.muted, border: `1px solid ${c.isActive ? C.success + '30' : C.border}` }}>
                  {c.isActive ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={() => toggleCoupon(c.code)}
                  style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, cursor: 'pointer', color: c.isActive ? C.success : C.muted, transition: 'all 0.15s' }}
                >
                  {c.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                </button>
                <button
                  onClick={() => deleteCoupon(c.code)}
                  style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, cursor: 'pointer', color: C.muted, transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.danger; e.currentTarget.style.color = C.danger; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Coupon Modal */}
          {showCouponModal && (
            <>
              <div onClick={() => setShowCouponModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.7)' }} />
              <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 100, width: 440, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: '0 40px 100px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>New Coupon</h3>
                  <button onClick={() => setShowCouponModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={18} /></button>
                </div>
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Coupon Code', key: 'code', placeholder: 'e.g. GLOWRY20', type: 'text' },
                    { label: 'Discount Value', key: 'value', placeholder: '10', type: 'number' },
                    { label: 'Minimum Order (৳)', key: 'minOrder', placeholder: '1000', type: 'number' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>{field.label}</label>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={(couponForm as any)[field.key]}
                        onChange={(e) => setCouponForm({ ...couponForm, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value })}
                        style={inputStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                      />
                    </div>
                  ))}
                  <div>
                    <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Discount Type</label>
                    <select
                      value={couponForm.type}
                      onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value as any })}
                      style={{ ...inputStyle }}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="flat">Flat Amount (৳)</option>
                    </select>
                  </div>
                </div>
                <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setShowCouponModal(false)} style={{ padding: '9px 18px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.muted, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={addCoupon} style={{ padding: '9px 22px', background: C.accent, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>
                    <Check size={13} style={{ display: 'inline', marginRight: 6 }} /> Add Coupon
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ FLASH SALE ═════════════════════════════════════════════════ */}
      {tab === 'flash' && (
        <div style={{ maxWidth: 560 }}>
          <div style={{ background: C.surface, border: `1px solid ${flashActive ? `${C.warning}40` : C.border}`, borderRadius: 10, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Zap size={20} style={{ color: C.warning }} />
                <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Flash Sale</h2>
              </div>
              <button
                onClick={() => setFlashActive(!flashActive)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                  background: flashActive ? `${C.warning}15` : C.elevated,
                  border: `1px solid ${flashActive ? `${C.warning}40` : C.border}`,
                  borderRadius: 8, fontSize: 13, fontWeight: 700,
                  color: flashActive ? C.warning : C.muted, cursor: 'pointer',
                }}
              >
                {flashActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                {flashActive ? 'Sale Active' : 'Sale Inactive'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>Banner Label</label>
                <input type="text" value={flashLabel} onChange={(e) => setFlashLabel(e.target.value)} style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)} onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>Discount % (applied on all products)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input type="range" min={5} max={60} step={5} value={flashDiscount} onChange={(e) => setFlashDiscount(Number(e.target.value))} style={{ flex: 1, accentColor: C.warning }} />
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, fontWeight: 700, color: C.warning, minWidth: 50 }}>{flashDiscount}%</span>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>Sale Ends</label>
                <div style={{ position: 'relative' }}>
                  <Clock size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
                  <input type="datetime-local" value={flashEndDate} onChange={(e) => setFlashEndDate(e.target.value)} style={{ ...inputStyle, paddingLeft: 36, colorScheme: 'dark' }} onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)} onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
                </div>
              </div>

              {flashActive && (
                <div style={{ padding: '14px 16px', background: `${C.warning}10`, border: `1px solid ${C.warning}30`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Zap size={14} style={{ color: C.warning }} />
                  <p style={{ fontSize: 13, color: C.warning }}>Flash sale is LIVE! {flashLabel} — {flashDiscount}% off all products until {flashEndDate}.</p>
                </div>
              )}

              <button
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: C.accent, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', alignSelf: 'flex-start' }}
              >
                <Save size={14} /> Save Flash Sale
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ HERO BANNERS ═══════════════════════════════════════════════ */}
      {tab === 'hero' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <p style={{ fontSize: 13, color: C.muted }}>{slides.length} hero slides configured</p>
            <button
              onClick={() => { setSlideForm({ id: 0, title: '', subtitle: '', cta: 'Shop Now', image: '', isActive: true }); setEditSlideId(null); setShowSlideModal(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', background: C.accent, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
            >
              <Plus size={14} /> Add Slide
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {slides.map((slide) => (
              <div key={slide.id} style={{ display: 'flex', gap: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', alignItems: 'stretch' }}>
                <div style={{ width: 160, flexShrink: 0, background: C.elevated, overflow: 'hidden' }}>
                  <img src={slide.image} alt={slide.title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 100 }} />
                </div>
                <div style={{ flex: 1, padding: '16px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 6 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{slide.title}</p>
                  <p style={{ fontSize: 12, color: C.muted }}>{slide.subtitle}</p>
                  <p style={{ fontSize: 11, color: C.accent }}>CTA: "{slide.cta}"</p>
                  <span style={{ fontSize: 10, fontWeight: 700, display: 'inline-block', padding: '2px 8px', borderRadius: 4, background: slide.isActive ? `${C.success}15` : C.elevated, color: slide.isActive ? C.success : C.muted, border: `1px solid ${slide.isActive ? C.success + '30' : C.border}`, alignSelf: 'flex-start' }}>
                    {slide.isActive ? 'Visible' : 'Hidden'}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 20px', justifyContent: 'center' }}>
                  <button onClick={() => toggleSlide(slide.id)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, cursor: 'pointer', color: slide.isActive ? C.success : C.muted }}>
                    {slide.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                  </button>
                  <button onClick={() => editSlide(slide)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, cursor: 'pointer', color: C.muted }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => deleteSlide(slide.id)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, cursor: 'pointer', color: C.muted }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.danger; e.currentTarget.style.color = C.danger; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Slide Modal */}
          {showSlideModal && (
            <>
              <div onClick={() => setShowSlideModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.7)' }} />
              <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 100, width: 520, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: '0 40px 100px rgba(0,0,0,0.6)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 24px', borderBottom: `1px solid ${C.border}` }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{editSlideId ? 'Edit Slide' : 'New Slide'}</h3>
                  <button onClick={() => setShowSlideModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}><X size={18} /></button>
                </div>
                <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Headline', key: 'title', placeholder: 'Science Meets Luxury Skin' },
                    { label: 'Subtitle', key: 'subtitle', placeholder: 'Clinically formulated for measurable results.' },
                    { label: 'CTA Button Text', key: 'cta', placeholder: 'Shop Now' },
                    { label: 'Background Image URL', key: 'image', placeholder: 'https://images.unsplash.com/...' },
                  ].map((field) => (
                    <div key={field.key}>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>{field.label}</label>
                      <input type="text" placeholder={field.placeholder} value={(slideForm as any)[field.key]} onChange={(e) => setSlideForm({ ...slideForm, [field.key]: e.target.value })} style={inputStyle} onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)} onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
                    </div>
                  ))}
                  {slideForm.image && (
                    <div style={{ height: 100, borderRadius: 7, overflow: 'hidden', border: `1px solid ${C.border}` }}>
                      <img src={slideForm.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
                <div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button onClick={() => setShowSlideModal(false)} style={{ padding: '9px 18px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.muted, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={saveSlide} style={{ padding: '9px 22px', background: C.accent, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Save size={13} /> {editSlideId ? 'Save Changes' : 'Add Slide'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ══ PAGE SECTIONS ══════════════════════════════════════════════ */}
      {tab === 'sections' && (
        <div style={{ maxWidth: 560 }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '16px 22px', borderBottom: `1px solid ${C.border}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>Homepage Sections</h3>
              <p style={{ fontSize: 12, color: C.muted }}>Toggle visibility of homepage sections</p>
            </div>
            {sections.map((s, i) => (
              <div
                key={s.key}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 22px',
                  borderBottom: i < sections.length - 1 ? `1px solid ${C.border}` : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 2 }}>{s.label}</p>
                  <p style={{ fontSize: 11, color: s.isVisible ? C.success : C.muted }}>
                    {s.isVisible ? '● Visible on homepage' : '○ Hidden'}
                  </p>
                </div>
                <button
                  onClick={() => toggleSection(s.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
                    background: s.isVisible ? `${C.success}15` : C.elevated,
                    border: `1px solid ${s.isVisible ? `${C.success}40` : C.border}`,
                    borderRadius: 7, fontSize: 12, fontWeight: 600,
                    color: s.isVisible ? C.success : C.muted, cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {s.isVisible ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  {s.isVisible ? 'Visible' : 'Hidden'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
