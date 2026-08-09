'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Check, Shield, Lock,
  MapPin, Phone, User, Mail, ChevronDown, Tag, Truck,
} from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { locations } from '../../data/products';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

type Step = 'info' | 'shipping' | 'confirm';

/* ─── small helpers ──────────────────────────────────────────────────── */
const Label = ({ children }: { children: React.ReactNode }) => (
  <span style={{
    display: 'block', fontSize: 11, fontWeight: 700,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    color: 'var(--text-muted)', marginBottom: 8,
  }}>
    {children}
  </span>
);

const Field = ({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) => (
  <div style={{ position: 'relative' }}>
    {icon && (
      <span style={{
        position: 'absolute', left: 14, top: '50%',
        transform: 'translateY(-50%)', color: 'var(--text-muted)',
        pointerEvents: 'none', zIndex: 1,
      }}>
        {icon}
      </span>
    )}
    {children}
  </div>
);

/* ─── main component ─────────────────────────────────────────────────── */
function CheckoutContent() {
  const searchParams   = useSearchParams();
  const isBuyNow       = searchParams.get('mode') === 'buynow';
  const { cart, clearCart, buyNow, clearBuyNow } = useCartStore();
  const checkoutItems  = isBuyNow && buyNow ? [buyNow] : cart;

  const [step, setStep]           = useState<Step>('info');
  const [placed, setPlaced]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderError, setOrderError]   = useState('');

  const [couponCode, setCouponCode]       = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError]     = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [storeConfig, setStoreConfig]     = useState<any>(null);

  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    district: 'Dhaka', thana: '', area: '', address: '', notes: '',
    paymentMethod: 'cod',
  });
  const update = (f: string, v: string) => setForm(p => ({ ...p, [f]: v }));

  const [geocodeData, setGeocodeData] = useState<Record<string, Record<string, string[]>>>({});

  useEffect(() => {
    fetch('/api/admin/store-config')
      .then(r => r.json())
      .then(d => { if (d) setStoreConfig(d); })
      .catch(() => {});

    fetch('/bangladesh-geocode.json')
      .then(r => r.json())
      .then(d => setGeocodeData(d))
      .catch(err => console.error('Failed to load geocode data:', err));
  }, []);

  const districtsList = Object.keys(geocodeData).length > 0
    ? Object.keys(geocodeData).sort()
    : Object.keys(locations);

  const thanas = geocodeData[form.district]
    ? Object.keys(geocodeData[form.district]).sort()
    : (locations[form.district] || []);

  const unions = geocodeData[form.district]?.[form.thana] || [];

  /* pricing */
  const subtotal = checkoutItems.reduce((acc, item) => {
    const price = item.variant?.price ?? item.product.price;
    return acc + price * item.quantity;
  }, 0);

  const getShipping = () => {
    if (checkoutItems.some(i => i.product.isFreeDelivery)) return 0;
    if (!storeConfig) return 80;
    const def = Number(storeConfig.defaultShippingFee || 80);
    if (form.district && Array.isArray(storeConfig.zones)) {
      const dl = form.district.toLowerCase();
      const z  = storeConfig.zones.find((z: any) =>
        z.districts?.toLowerCase().split(',').map((d: any) => d.trim()).includes(dl)
      );
      if (z) return Number(z.fee);
    }
    return def;
  };
  const shipping = getShipping();
  const total    = Math.max(0, subtotal + shipping - couponDiscount);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true); setCouponError('');
    try {
      const res  = await fetch('/api/coupons/validate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), orderAmount: subtotal }),
      });
      const data = await res.json();
      setCouponLoading(false);
      if (!res.ok) { setCouponError(data.error || 'Invalid coupon'); return; }
      setCouponApplied(true); setCouponDiscount(data.discountAmount);
    } catch { setCouponLoading(false); setCouponError('Connection failed.'); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true); setOrderError('');
    try {
      const payload = {
        name: form.name, phone: form.phone, email: form.email,
        division: form.district, district: form.district,
        thana: form.thana, area: form.area,
        address: form.address, notes: form.notes,
        paymentMethod:
          form.paymentMethod === 'bkash' ? 'bKash' :
          form.paymentMethod === 'nagad'  ? 'Nagad'  : 'COD',
        items: checkoutItems,
        subtotal, shipping, total, discount: couponDiscount,
      };
      const res  = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit order');
      if (data.success) {
        setOrderNumber(data.orderId); setPlaced(true);
        isBuyNow ? clearBuyNow() : clearCart();
      }
    } catch (err: any) {
      console.error(err);
      setOrderError(err.message || 'Order submission failed. Please try again.');
    } finally { setSubmitting(false); }
  };

  const steps: { key: Step; label: string; icon: string }[] = [
    { key: 'info',     label: 'Your Info', icon: '①' },
    { key: 'shipping', label: 'Delivery',  icon: '②' },
    { key: 'confirm',  label: 'Confirm',   icon: '③' },
  ];
  const stepIdx = steps.findIndex(s => s.key === step);

  /* ── ORDER SUCCESS ──────────────────────────────────────────────────── */
  if (placed) return (
    <>
      <Navbar />
      <div className="co-success">
        <div className="co-success-icon">
          <Check size={36} color="#fff" />
        </div>
        <h1 className="co-success-title">Order Confirmed!</h1>
        {orderNumber && (
          <p className="co-success-num">Order #{orderNumber}</p>
        )}
        <p className="co-success-msg">
          Thank you, <strong>{form.name}</strong>. Your order is received.<br />
          We'll call you at <strong>{form.phone}</strong> within 24 hours.
        </p>
        <div className="co-success-actions">
          <Link href="/products" className="btn-primary">Continue Shopping <ArrowRight size={14} /></Link>
          <Link href="/account" className="btn-ghost">View Orders</Link>
        </div>
      </div>
      <Footer />
    </>
  );

  /* ── EMPTY CART ─────────────────────────────────────────────────────── */
  if (checkoutItems.length === 0) return (
    <>
      <Navbar />
      <div className="co-empty">
        <span style={{ fontSize: 48 }}>🛒</span>
        <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, marginBottom: 8 }}>
          Your cart is empty
        </h2>
        <Link href="/products" className="btn-primary">Browse Products</Link>
      </div>
      <Footer />
    </>
  );

  /* ── ORDER SUMMARY PANEL (reused on desktop sidebar + mobile top) ─── */
  const SummaryPanel = () => (
    <div className="co-summary">
      <div className="co-summary-head">
        <span className="co-summary-title">Order Summary</span>
        <span className="co-summary-count">{checkoutItems.length} item{checkoutItems.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="co-summary-items">
        {checkoutItems.map(item => {
          const price = item.variant?.price ?? item.product.price;
          return (
            <div key={item.id} className="co-summary-item">
              <div className="co-summary-img-wrap">
                <img src={item.product.image} alt={item.product.name} className="co-summary-img" />
                <span className="co-summary-qty">{item.quantity}</span>
              </div>
              <div className="co-summary-item-info">
                <p className="co-summary-item-name">{item.product.name}</p>
                {item.variant?.label && (
                  <p className="co-summary-item-variant">{item.variant.label}</p>
                )}
              </div>
              <span className="co-summary-item-price">৳{(price * item.quantity).toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      {/* Coupon */}
      <div className="co-coupon-wrap">
        <div className="co-coupon-row">
          <Tag size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Coupon code"
            value={couponCode}
            onChange={e => setCouponCode(e.target.value.toUpperCase())}
            disabled={couponApplied || couponLoading}
            className="co-coupon-input"
          />
          <button
            type="button"
            className={couponApplied ? 'co-coupon-btn co-coupon-btn--remove' : 'co-coupon-btn'}
            onClick={couponApplied
              ? () => { setCouponApplied(false); setCouponDiscount(0); setCouponCode(''); setCouponError(''); }
              : handleApplyCoupon
            }
            disabled={couponLoading || (!couponCode.trim() && !couponApplied)}
          >
            {couponLoading ? '…' : couponApplied ? 'Remove' : 'Apply'}
          </button>
        </div>
        {couponError   && <p className="co-coupon-err">⚠ {couponError}</p>}
        {couponApplied && <p className="co-coupon-ok">✓ −৳{couponDiscount.toLocaleString()} saved!</p>}
      </div>

      {/* Totals */}
      <div className="co-totals">
        <div className="co-total-row">
          <span>Subtotal</span>
          <span>৳{subtotal.toLocaleString()}</span>
        </div>
        <div className="co-total-row">
          <span>Shipping</span>
          <span style={{ color: shipping === 0 ? 'var(--sage)' : undefined }}>
            {shipping === 0 ? 'FREE' : `৳${shipping}`}
          </span>
        </div>
        {couponApplied && (
          <div className="co-total-row" style={{ color: 'var(--sage-dark)' }}>
            <span>Coupon</span>
            <span>−৳{couponDiscount.toLocaleString()}</span>
          </div>
        )}
        <div className="co-total-final">
          <span>Total</span>
          <span className="co-total-amount">৳{total.toLocaleString()}</span>
        </div>
      </div>

      {/* Trust */}
      <div className="co-trust">
        <Shield size={13} style={{ color: 'var(--sage)', flexShrink: 0 }} />
        <span>Secured by SSL · 7-day return policy</span>
      </div>
    </div>
  );

  /* ── MAIN RENDER ────────────────────────────────────────────────────── */
  return (
    <>
      <Navbar />

      <div className="co-page">
        {/* ── Progress bar ─────────────────────── */}
        <div className="co-progress-bar-track">
          <div
            className="co-progress-bar-fill"
            style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
          />
        </div>

        {/* ── Steps header ─────────────────────── */}
        <div className="co-header">
          <Link href="/products" className="co-back-link">
            <ArrowLeft size={16} /> Shop
          </Link>
          <div className="co-steps">
            {steps.map((s, i) => (
              <div
                key={s.key}
                className={`co-step ${step === s.key ? 'co-step--active' : ''} ${i < stepIdx ? 'co-step--done' : ''}`}
              >
                <div className="co-step-dot">
                  {i < stepIdx ? <Check size={12} /> : i + 1}
                </div>
                <span className="co-step-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div style={{ width: 80 }} />
        </div>

        {/* ── Body ─────────────────────────────── */}
        <div className="co-body">

          {/* MOBILE: summary shown above form */}
          <div className="co-summary-mobile">
            <SummaryPanel />
          </div>

          {/* LEFT: form */}
          <div className="co-form-wrap">

            {/* Step: INFO */}
            {step === 'info' && (
              <div className="co-card animate-fade-up">
                <h2 className="co-card-title">Contact Info</h2>
                <div className="co-field-stack">
                  <div>
                    <Label>Full Name *</Label>
                    <Field icon={<User size={15} />}>
                      <input
                        type="text" required
                        placeholder="Your full name"
                        value={form.name}
                        onChange={e => update('name', e.target.value)}
                        className="co-input co-input--icon"
                      />
                    </Field>
                  </div>
                  <div className="co-row-2">
                    <div>
                      <Label>Phone *</Label>
                      <Field icon={<Phone size={15} />}>
                        <input
                          type="tel" required
                          placeholder="01XXXXXXXXX"
                          value={form.phone}
                          onChange={e => update('phone', e.target.value)}
                          className="co-input co-input--icon"
                        />
                      </Field>
                    </div>
                    <div>
                      <Label>Email (optional)</Label>
                      <Field icon={<Mail size={15} />}>
                        <input
                          type="email"
                          placeholder="you@email.com"
                          value={form.email}
                          onChange={e => update('email', e.target.value)}
                          className="co-input co-input--icon"
                        />
                      </Field>
                    </div>
                  </div>
                </div>
                <div className="co-nav">
                  <div />
                  <button
                    type="button" className="co-btn-next"
                    disabled={!form.name || !form.phone}
                    onClick={() => setStep('shipping')}
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step: SHIPPING */}
            {step === 'shipping' && (
              <div className="co-card animate-fade-up">
                <h2 className="co-card-title">Delivery Details</h2>
                <div className="co-field-stack">
                  <div className="co-row-2">
                    <div>
                      <Label>District *</Label>
                      <div className="co-select-wrap">
                        <select
                          required value={form.district}
                          onChange={e => { update('district', e.target.value); update('thana', ''); update('area', ''); }}
                          className="co-input co-select"
                        >
                          {districtsList.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <ChevronDown size={14} className="co-select-icon" />
                      </div>
                    </div>
                    <div>
                      <Label>Thana / Upazila *</Label>
                      <div className="co-select-wrap">
                        <select
                          required value={form.thana}
                          onChange={e => { update('thana', e.target.value); update('area', ''); }}
                          disabled={!form.district}
                          className="co-input co-select"
                        >
                          <option value="">Select Thana</option>
                          {thanas.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <ChevronDown size={14} className="co-select-icon" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label>Area / Union *</Label>
                    {unions.length > 0 ? (
                      <div className="co-select-wrap">
                        <select
                          required value={form.area}
                          onChange={e => update('area', e.target.value)}
                          disabled={!form.thana}
                          className="co-input co-select"
                        >
                          <option value="">Select Area / Union</option>
                          {unions.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                        <ChevronDown size={14} className="co-select-icon" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        required
                        placeholder="Block / Village / Union name"
                        value={form.area}
                        onChange={e => update('area', e.target.value)}
                        className="co-input"
                      />
                    )}
                  </div>
                  <div>
                    <Label>Full Address *</Label>
                    <Field icon={<MapPin size={15} />}>
                      <textarea
                        required rows={3}
                        placeholder="House no, Road, Area..."
                        value={form.address}
                        onChange={e => update('address', e.target.value)}
                        className="co-input co-input--icon co-textarea"
                      />
                    </Field>
                  </div>
                  <div>
                    <Label>Order Notes</Label>
                    <input
                      type="text"
                      placeholder="Any special instructions (optional)"
                      value={form.notes}
                      onChange={e => update('notes', e.target.value)}
                      className="co-input"
                    />
                  </div>
                </div>

                {/* Shipping cost preview */}
                {form.district && (
                  <div className="co-shipping-preview">
                    <Truck size={14} style={{ color: 'var(--accent)' }} />
                    <span>Delivery to {form.district}: <strong>
                      {shipping === 0 ? 'FREE' : `৳${shipping}`}
                    </strong></span>
                  </div>
                )}

                {/* Payment Method */}
                <div className="co-payment-section">
                  <Label>Payment Method</Label>
                  <div className="co-payment-grid">
                    {[
                      { value: 'cod',   label: 'Cash on Delivery', icon: '💵', desc: 'Pay when delivered' },
                      { value: 'bkash', label: 'bKash / Nagad',    icon: '📱', desc: 'Mobile banking' },
                      { value: 'card',  label: 'Card',             icon: '💳', desc: 'SSL encrypted' },
                    ].map(m => (
                      <button
                        key={m.value} type="button"
                        className={`co-pay-btn ${form.paymentMethod === m.value ? 'co-pay-btn--active' : ''}`}
                        onClick={() => update('paymentMethod', m.value)}
                      >
                        <span className="co-pay-icon">{m.icon}</span>
                        <div className="co-pay-info">
                          <span className="co-pay-label">{m.label}</span>
                          <span className="co-pay-desc">{m.desc}</span>
                        </div>
                        {form.paymentMethod === m.value && (
                          <div className="co-pay-check"><Check size={11} color="#fff" /></div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="co-nav">
                  <button type="button" className="co-btn-back" onClick={() => setStep('info')}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="button" className="co-btn-next"
                    disabled={!form.district || !form.thana || !form.address}
                    onClick={() => setStep('confirm')}
                  >
                    Review Order <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Step: CONFIRM */}
            {step === 'confirm' && (
              <div className="co-card animate-fade-up">
                <h2 className="co-card-title">Review & Confirm</h2>

                {/* Delivery summary box */}
                <div className="co-confirm-box">
                  <div className="co-confirm-row">
                    <User size={14} style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <p className="co-confirm-name">{form.name}</p>
                      <p className="co-confirm-detail">{form.phone}{form.email ? ` · ${form.email}` : ''}</p>
                    </div>
                    <button type="button" className="co-confirm-edit" onClick={() => setStep('info')}>Edit</button>
                  </div>
                  <div className="co-confirm-divider" />
                  <div className="co-confirm-row">
                    <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                    <div>
                      <p className="co-confirm-detail">{form.address}</p>
                      <p className="co-confirm-detail">{form.area ? `${form.area}, ` : ''}{form.thana}, {form.district}</p>
                    </div>
                    <button type="button" className="co-confirm-edit" onClick={() => setStep('shipping')}>Edit</button>
                  </div>
                  <div className="co-confirm-divider" />
                  <div className="co-confirm-row">
                    <span style={{ fontSize: 16 }}>
                      {form.paymentMethod === 'cod' ? '💵' : form.paymentMethod === 'bkash' ? '📱' : '💳'}
                    </span>
                    <p className="co-confirm-detail">
                      {form.paymentMethod === 'cod' ? 'Cash on Delivery' :
                       form.paymentMethod === 'bkash' ? 'bKash / Nagad' : 'Card Payment'}
                    </p>
                    <button type="button" className="co-confirm-edit" onClick={() => setStep('shipping')}>Edit</button>
                  </div>
                </div>

                {/* SSL note */}
                <div className="co-ssl-notice">
                  <Lock size={13} style={{ color: 'var(--sage)', flexShrink: 0 }} />
                  <span>Your information is protected with 256-bit SSL encryption</span>
                </div>

                {/* Error banner */}
                {orderError && (
                  <div className="co-order-error">
                    ⚠ {orderError}
                  </div>
                )}

                <div className="co-nav">
                  <button type="button" className="co-btn-back" onClick={() => setStep('shipping')}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <form onSubmit={handleSubmit}>
                    <button
                      type="submit"
                      className="co-btn-place"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <span className="co-spinner" />
                      ) : (
                        <>Place Order — ৳{total.toLocaleString()} <Check size={16} /></>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          {/* DESKTOP: summary sidebar */}
          <div className="co-summary-desktop">
            <SummaryPanel />
          </div>
        </div>
      </div>

      <Footer />

      <style>{`
        /* ══ PAGE SHELL ══════════════════════════════════════════════════ */
        .co-page {
          background: var(--bg-base);
          min-height: 100vh;
          padding-bottom: 80px;
        }

        /* ── Progress bar */
        .co-progress-bar-track {
          height: 3px;
          background: var(--border-default);
        }
        .co-progress-bar-fill {
          height: 100%;
          background: var(--accent);
          transition: width 0.5s cubic-bezier(0.16,1,0.3,1);
        }

        /* ── Header */
        .co-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid var(--border-default);
          background: var(--bg-surface);
          position: sticky;
          top: 0;
          z-index: 20;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }
        .co-back-link {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; font-weight: 600;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.2s;
        }
        .co-back-link:hover { color: var(--text-primary); }

        /* ── Steps */
        .co-steps {
          display: flex; align-items: center; gap: 0;
        }
        .co-step {
          display: flex; align-items: center; gap: 7px;
          padding: 6px 10px; border-radius: 99px;
          font-size: 12px; font-weight: 600;
          color: var(--text-muted);
          position: relative;
        }
        .co-step + .co-step::before {
          content: '';
          position: absolute; left: -12px;
          width: 16px; height: 1px;
          background: var(--border-default);
        }
        .co-step--active { color: var(--accent); }
        .co-step--done   { color: var(--text-muted); }
        .co-step-dot {
          width: 24px; height: 24px; border-radius: 50%;
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700;
          flex-shrink: 0;
          transition: all 0.25s ease;
        }
        .co-step--active .co-step-dot {
          background: var(--accent);
          border-color: var(--accent);
          color: #fff;
        }
        .co-step--done .co-step-dot {
          background: rgba(201,149,109,0.15);
          border-color: rgba(201,149,109,0.3);
          color: var(--accent);
        }
        .co-step-label { white-space: nowrap; }

        /* ── Body layout */
        .co-body {
          max-width: 1140px;
          margin: 0 auto;
          padding: 32px 20px 0;
          display: grid;
          grid-template-columns: 1fr 360px;
          grid-template-areas: "form summary";
          gap: 32px;
          align-items: start;
        }
        .co-form-wrap       { grid-area: form; }
        .co-summary-desktop { grid-area: summary; position: sticky; top: 80px; }
        .co-summary-mobile  { display: none; }

        /* ── Card (form section) */
        .co-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 16px;
          padding: 28px 28px 24px;
        }
        .co-card-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 26px; font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 24px;
        }

        /* ── Form fields */
        .co-field-stack { display: flex; flex-direction: column; gap: 18px; }
        .co-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

        .co-input {
          width: 100%; box-sizing: border-box;
          padding: 13px 14px;
          background: var(--bg-base);
          border: 1px solid var(--border-default);
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: var(--text-primary);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          -webkit-appearance: none;
        }
        .co-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(201,149,109,0.12);
        }
        .co-input--icon { padding-left: 40px; }
        .co-textarea { resize: none; padding-top: 13px !important; }

        .co-select-wrap { position: relative; }
        .co-select { cursor: pointer; padding-right: 36px; }
        .co-select-icon {
          position: absolute; right: 12px; top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted); pointer-events: none;
        }

        /* ── Shipping preview */
        .co-shipping-preview {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 16px; margin-top: 6px;
          background: rgba(201,149,109,0.06);
          border: 1px solid rgba(201,149,109,0.2);
          border-radius: 10px;
          font-size: 13px; color: var(--text-secondary);
        }
        .co-shipping-preview strong { color: var(--accent); font-weight: 700; }

        /* ── Payment */
        .co-payment-section { margin-top: 24px; }
        .co-payment-grid { display: flex; flex-direction: column; gap: 10px; }
        .co-pay-btn {
          display: flex; align-items: center; gap: 14px;
          padding: 14px 16px;
          background: var(--bg-base);
          border: 1.5px solid var(--border-default);
          border-radius: 12px;
          cursor: pointer; text-align: left;
          transition: all 0.2s ease; width: 100%;
        }
        .co-pay-btn:hover { border-color: rgba(201,149,109,0.4); }
        .co-pay-btn--active {
          background: rgba(201,149,109,0.06);
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(201,149,109,0.1);
        }
        .co-pay-icon { font-size: 22px; flex-shrink: 0; }
        .co-pay-info { display: flex; flex-direction: column; flex: 1; }
        .co-pay-label { font-size: 14px; font-weight: 600; color: var(--text-primary); }
        .co-pay-desc  { font-size: 12px; color: var(--text-muted); }
        .co-pay-check {
          width: 22px; height: 22px; border-radius: 50%;
          background: var(--accent);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* ── Navigation */
        .co-nav {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 28px; gap: 12px;
        }
        .co-btn-next, .co-btn-place {
          display: flex; align-items: center; gap: 8px;
          padding: 14px 28px;
          background: var(--accent);
          color: #fff;
          border: none; border-radius: 10px;
          font-size: 14px; font-weight: 700;
          letter-spacing: 0.02em;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .co-btn-next:hover, .co-btn-place:hover {
          background: var(--accent-hover, #b8845e);
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(201,149,109,0.3);
        }
        .co-btn-next:disabled, .co-btn-place:disabled {
          opacity: 0.5; cursor: not-allowed; transform: none;
        }
        .co-btn-place {
          padding: 15px 24px; font-size: 15px;
          background: linear-gradient(135deg, #c9956d 0%, #a87650 100%);
        }
        .co-btn-back {
          display: flex; align-items: center; gap: 6px;
          padding: 12px 18px;
          background: none;
          border: 1px solid var(--border-default);
          border-radius: 10px;
          font-size: 13px; font-weight: 600;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }
        .co-btn-back:hover { color: var(--text-primary); border-color: var(--text-secondary); }

        /* Spinner */
        .co-spinner {
          width: 18px; height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: co-spin 0.7s linear infinite;
        }
        @keyframes co-spin { to { transform: rotate(360deg); } }

        /* ── Confirm */
        .co-confirm-box {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: 12px;
          overflow: hidden; margin-bottom: 20px;
        }
        .co-confirm-row {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 16px 20px;
        }
        .co-confirm-divider { height: 1px; background: var(--border-default); }
        .co-confirm-name   { font-size: 15px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
        .co-confirm-detail { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
        .co-confirm-edit {
          margin-left: auto; background: none; border: none;
          font-size: 12px; font-weight: 700; color: var(--accent);
          cursor: pointer; flex-shrink: 0; padding: 4px;
          transition: opacity 0.2s;
        }
        .co-confirm-edit:hover { opacity: 0.7; }

        .co-ssl-notice {
          display: flex; align-items: center; gap: 8px;
          padding: 11px 14px; margin-bottom: 20px;
          background: rgba(139,157,119,0.07);
          border: 1px solid rgba(139,157,119,0.2);
          border-radius: 8px;
          font-size: 12px; color: var(--sage-dark);
        }
        .co-order-error {
          padding: 12px 16px; margin-bottom: 16px;
          background: rgba(220,53,69,0.07);
          border: 1px solid rgba(220,53,69,0.25);
          border-radius: 8px;
          font-size: 13px; color: #c53030; font-weight: 500;
        }

        /* ══ ORDER SUMMARY PANEL ══════════════════════════════════════════ */
        .co-summary {
          background: var(--bg-surface);
          border: 1px solid var(--border-default);
          border-radius: 16px;
          overflow: hidden;
        }
        .co-summary-head {
          display: flex; justify-content: space-between; align-items: center;
          padding: 18px 20px;
          background: var(--bg-elevated);
          border-bottom: 1px solid var(--border-default);
        }
        .co-summary-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
        .co-summary-count { font-size: 12px; color: var(--text-muted); }

        .co-summary-items {
          padding: 16px 20px;
          display: flex; flex-direction: column; gap: 14px;
          max-height: 280px; overflow-y: auto;
          scrollbar-width: thin;
        }
        .co-summary-item {
          display: flex; align-items: center; gap: 12px;
        }
        .co-summary-img-wrap {
          position: relative; flex-shrink: 0;
        }
        .co-summary-img {
          width: 52px; height: 52px;
          border-radius: 10px; object-fit: cover;
          border: 1px solid var(--border-default);
        }
        .co-summary-qty {
          position: absolute; top: -6px; right: -6px;
          width: 18px; height: 18px; border-radius: 50%;
          background: var(--text-primary); color: var(--bg-base);
          font-size: 10px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
        }
        .co-summary-item-info { flex: 1; min-width: 0; }
        .co-summary-item-name {
          font-size: 13px; font-weight: 600; color: var(--text-primary);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .co-summary-item-variant { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
        .co-summary-item-price {
          font-family: 'DM Mono', monospace;
          font-size: 13px; font-weight: 600;
          color: var(--text-primary); flex-shrink: 0;
        }

        /* Coupon */
        .co-coupon-wrap { padding: 14px 20px; border-top: 1px dashed var(--border-default); }
        .co-coupon-row {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg-base);
          border: 1px solid var(--border-default);
          border-radius: 8px;
          padding: 4px 12px;
        }
        .co-coupon-input {
          flex: 1; border: none; background: transparent;
          font-family: 'DM Mono', monospace;
          font-size: 12px; letter-spacing: 0.08em;
          color: var(--text-primary); outline: none;
          padding: 8px 0;
        }
        .co-coupon-input::placeholder { color: var(--text-muted); }
        .co-coupon-btn {
          font-size: 11px; font-weight: 800;
          letter-spacing: 0.06em; text-transform: uppercase;
          padding: 6px 12px; border-radius: 6px;
          border: 1px solid var(--accent);
          background: var(--accent); color: #fff;
          cursor: pointer; flex-shrink: 0;
          transition: all 0.2s;
        }
        .co-coupon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .co-coupon-btn--remove {
          background: none; color: var(--text-muted);
          border-color: var(--border-default);
        }
        .co-coupon-err { font-size: 11px; color: #c53030; margin-top: 6px; }
        .co-coupon-ok  { font-size: 11px; color: var(--sage-dark); margin-top: 6px; font-weight: 600; }

        /* Totals */
        .co-totals { padding: 16px 20px; border-top: 1px solid var(--border-default); display: flex; flex-direction: column; gap: 10px; }
        .co-total-row {
          display: flex; justify-content: space-between;
          font-size: 13px; color: var(--text-secondary);
        }
        .co-total-final {
          display: flex; justify-content: space-between; align-items: baseline;
          padding-top: 12px; border-top: 1px solid var(--border-default);
          font-size: 15px; font-weight: 700; color: var(--text-primary);
        }
        .co-total-amount {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 26px; font-weight: 600; color: var(--accent);
        }

        /* Trust */
        .co-trust {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 20px;
          border-top: 1px solid var(--border-default);
          font-size: 11px; color: var(--text-muted);
        }

        /* ══ SUCCESS + EMPTY ══════════════════════════════════════════════ */
        .co-success {
          min-height: 80vh; display: flex; flex-direction: column;
          align-items: center; justify-content: flex-start;
          text-align: center; padding: 80px 20px 40px;
          background: var(--bg-base);
        }
        .co-success-icon {
          width: 80px; height: 80px; border-radius: 50%;
          background: linear-gradient(135deg, #8b9d77, #6a825a);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 28px;
          box-shadow: 0 16px 48px rgba(139,157,119,0.3);
          animation: co-pop 0.5s cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes co-pop { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .co-success-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 40px; font-weight: 400; color: var(--text-primary);
          margin-bottom: 10px;
        }
        .co-success-num {
          font-size: 16px; font-weight: 700; color: var(--accent); margin-bottom: 16px;
          font-family: 'DM Mono', monospace;
        }
        .co-success-msg {
          font-size: 15px; color: var(--text-secondary);
          line-height: 1.7; max-width: 440px; margin-bottom: 36px;
        }
        .co-success-actions { display: flex; gap: 12px; flex-wrap: wrap; justify-content: center; }

        .co-empty {
          min-height: 60vh; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 16px; text-align: center; padding: 40px 20px;
          background: var(--bg-base);
        }

        /* ══ MOBILE RESPONSIVE ════════════════════════════════════════════ */
        @media (max-width: 800px) {
          .co-body {
            grid-template-columns: 1fr;
            grid-template-areas:
              "summary"
              "form";
            padding: 16px 12px 0;
            gap: 16px;
          }
          .co-summary-desktop { display: none; }
          .co-summary-mobile  { display: block; }
        }

        @media (max-width: 600px) {
          .co-header { padding: 14px 16px; }
          .co-step-label { display: none; }
          .co-step { padding: 4px 6px; }
          .co-step + .co-step::before { width: 10px; left: -8px; }
          .co-card { padding: 20px 16px 18px; border-radius: 12px; }
          .co-card-title { font-size: 22px; margin-bottom: 18px; }
          .co-row-2 { grid-template-columns: 1fr; gap: 14px; }
          .co-nav { flex-direction: column-reverse; }
          .co-btn-next, .co-btn-back, .co-btn-place { width: 100%; justify-content: center; }
          .co-pay-btn { padding: 12px 14px; gap: 10px; }
          .co-pay-icon { font-size: 18px; }
          .co-success-title { font-size: 30px; }
          .co-summary-items { max-height: 220px; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-up { animation: fadeUp 0.35s cubic-bezier(0.16,1,0.3,1); }
      `}</style>
    </>
  );
}

export default function CheckoutPage() {
  return (
    <React.Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg-base)' }} />}>
      <CheckoutContent />
    </React.Suspense>
  );
}
