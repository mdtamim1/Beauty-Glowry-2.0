'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, Shield, Lock, MapPin, Phone, User, Mail } from 'lucide-react';
import { useCartStore } from '../../store/useCartStore';
import { locations } from '../../data/products';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

type Step = 'info' | 'shipping' | 'confirm';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const isBuyNow = searchParams.get('mode') === 'buynow';
  const { cart, clearCart, buyNow, clearBuyNow } = useCartStore();

  // In buyNow mode use buyNow item; otherwise use cart
  const checkoutItems = isBuyNow && buyNow ? [buyNow] : cart;

  const [step, setStep] = useState<Step>('info');
  const [placed, setPlaced] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), orderAmount: subtotal }),
      });
      const data = await res.json();
      setCouponLoading(false);
      if (!res.ok) {
        setCouponError(data.error || 'Failed to apply coupon');
        setCouponApplied(false);
        setCouponDiscount(0);
        return;
      }
      setCouponApplied(true);
      setCouponDiscount(data.discountAmount);
    } catch (e) {
      setCouponLoading(false);
      setCouponError('Connection failed.');
    }
  };

  const [storeConfig, setStoreConfig] = useState<any>(null);

  useEffect(() => {
    fetch('/api/admin/store-config')
      .then((res) => res.json())
      .then((data) => {
        if (data) setStoreConfig(data);
      })
      .catch((err) => console.error('Failed to load store config in checkout:', err));
  }, []);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    division: '',
    district: '',
    address: '',
    notes: '',
    paymentMethod: 'cod',
  });

  const subtotal = checkoutItems.reduce((acc, item) => {
    const price = item.variant?.price ?? item.product.price;
    return acc + price * item.quantity;
  }, 0);

  const getShippingFee = () => {
    if (!storeConfig) {
      return 120; // Fallback default shipping fee
    }

    const defaultFee = Number(storeConfig.defaultShippingFee || 120);

    // If district is set, try matching zones
    if (form.district && Array.isArray(storeConfig.zones)) {
      const selectedDistrict = form.district.toLowerCase();
      
      const matchedZone = storeConfig.zones.find((z: any) => {
        if (!z.districts) return false;
        const districtList = z.districts.toLowerCase().split(',').map((d: any) => d.trim());
        return districtList.includes(selectedDistrict) || z.districts.toLowerCase().includes(selectedDistrict);
      });

      if (matchedZone) {
        return Number(matchedZone.fee);
      }
    }

    // Default zone matching by Division name (e.g. if division is Dhaka, use zone 1, else zone 2)
    if (form.division && Array.isArray(storeConfig.zones)) {
      const divisionName = form.division.toLowerCase();
      const matchedZone = storeConfig.zones.find((z: any) => 
        z.name.toLowerCase().includes(divisionName) || 
        (divisionName === 'dhaka' && z.name.toLowerCase().includes('dhaka'))
      );

      if (matchedZone) {
        return Number(matchedZone.fee);
      }
    }

    return defaultFee;
  };

  const shipping = getShippingFee();
  const total = Math.max(0, subtotal + shipping - couponDiscount);

  const update = (field: string, val: string) => setForm((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const orderPayload = {
        name: form.name,
        phone: form.phone,
        email: form.email,
        division: form.division,
        district: form.district,
        address: form.address,
        notes: form.notes,
        paymentMethod: form.paymentMethod === 'bkash' ? 'bKash' : form.paymentMethod === 'nagad' ? 'Nagad' : 'COD',
        items: checkoutItems,
        subtotal,
        shipping,
        total,
        discount: couponDiscount,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        throw new Error('Failed to submit order');
      }

      const data = await res.json();
      if (data.success) {
        setOrderNumber(data.orderId);
        setPlaced(true);
        if (isBuyNow) {
          clearBuyNow();
        } else {
          clearCart();
        }
      }
    } catch (err) {
      console.error(err);
      alert('Order submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps: { key: Step; label: string }[] = [
    { key: 'info', label: 'Your Info' },
    { key: 'shipping', label: 'Delivery' },
    { key: 'confirm', label: 'Confirm' },
  ];

  if (placed) {
    return (
      <>
        <Navbar />
        <div
          style={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--bg-base)',
          }}
        >
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--sage), var(--sage-hover))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 32,
              boxShadow: '0 16px 48px rgba(139,157,119,0.3)',
            }}
          >
            <Check size={40} style={{ color: '#FFF' }} />
          </div>
          <h1
            className="font-editorial"
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: 48,
              fontWeight: 400,
              color: 'var(--text-primary)',
              marginBottom: 12,
            }}
          >
            Order Confirmed!
          </h1>
          {orderNumber && (
            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--accent)', marginBottom: 20 }}>
              Order Number: {orderNumber}
            </p>
          )}
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8, maxWidth: 480 }}>
            Thank you, {form.name || 'valued customer'}. Your order has been received and is being prepared.
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 40 }}>
            You will receive a confirmation call at {form.phone || 'your number'} within 24 hours.
          </p>
          <Link href="/products" className="btn-primary" style={{ pointerEvents: submitting ? 'none' : 'auto' }}>
            Continue Shopping <ArrowRight size={14} />
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <>
        <Navbar />
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
            background: 'var(--bg-base)',
          }}
        >
          <h2
            className="font-editorial"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 32, color: 'var(--text-primary)' }}
          >
            Your Cart is Empty
          </h2>
          <Link href="/products" className="btn-primary">Browse Products</Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div style={{ background: 'var(--bg-base)', minHeight: '80vh', paddingBottom: 80 }}>
        {/* Header */}
        <div
          style={{
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-default)',
            padding: '48px 0 40px',
            textAlign: 'center',
          }}
        >
          <h1
            className="font-editorial"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 44, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 28 }}
          >
            Secure Checkout
          </h1>

          {/* Steps */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0 }}>
            {steps.map((s, i) => (
              <React.Fragment key={s.key}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 16px',
                    borderRadius: 2,
                    background: step === s.key ? 'rgba(201,149,109,0.08)' : 'transparent',
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: '50%',
                      background: steps.indexOf({ key: step, label: '' } as any) > i || step === s.key
                        ? 'var(--accent)' : 'var(--bg-elevated)',
                      border: '1px solid',
                      borderColor: step === s.key ? 'var(--accent)' : 'var(--border-default)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: step === s.key ? '#FFF' : 'var(--text-muted)',
                    }}
                  >
                    {i + 1}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: step === s.key ? 700 : 400, color: step === s.key ? 'var(--accent)' : 'var(--text-muted)' }}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ width: 32, height: 1, background: 'var(--border-default)' }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="container-lg" style={{ paddingTop: 40 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems: 'flex-start' }}>

            {/* Left: Form */}
            <form onSubmit={handleSubmit}>
              {step === 'info' && (
                <div className="animate-fade-up">
                  <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 28 }}>
                    Contact Information
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                        Full Name *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="text"
                          required
                          placeholder="Ahmed Rahman"
                          value={form.name}
                          onChange={(e) => update('name', e.target.value)}
                          className="input-field"
                          style={{ paddingLeft: 40 }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                        Phone *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Phone size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="tel"
                          required
                          placeholder="01XXXXXXXXX"
                          value={form.phone}
                          onChange={(e) => update('phone', e.target.value)}
                          className="input-field"
                          style={{ paddingLeft: 40 }}
                        />
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>
                        Email
                      </label>
                      <div style={{ position: 'relative' }}>
                        <Mail size={14} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="email"
                          placeholder="you@email.com"
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                          className="input-field"
                          style={{ paddingLeft: 40 }}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
                    <Link href="/products" className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ArrowLeft size={14} /> Back to Shop
                    </Link>
                    <button
                      type="button"
                      onClick={() => setStep('shipping')}
                      className="btn-primary"
                      disabled={!form.name || !form.phone}
                    >
                      Continue to Delivery <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {step === 'shipping' && (
                <div className="animate-fade-up">
                  <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 28 }}>
                    Delivery Details
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Division *</label>
                      <select required value={form.division} onChange={(e) => { update('division', e.target.value); update('district', ''); }} className="input-field">
                        <option value="">Select Division</option>
                        {Object.keys(locations).map((div) => <option key={div} value={div}>{div}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>District *</label>
                      <select required value={form.district} onChange={(e) => update('district', e.target.value)} className="input-field" disabled={!form.division}>
                        <option value="">Select District</option>
                        {form.division && locations[form.division]?.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Full Address *</label>
                      <div style={{ position: 'relative' }}>
                        <MapPin size={14} style={{ position: 'absolute', left: 14, top: 16, color: 'var(--text-muted)' }} />
                        <textarea
                          required
                          rows={3}
                          placeholder="House number, road, area..."
                          value={form.address}
                          onChange={(e) => update('address', e.target.value)}
                          className="input-field"
                          style={{ paddingLeft: 40, resize: 'none' }}
                        />
                      </div>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8 }}>Order Notes</label>
                      <input type="text" placeholder="Any special instructions..." value={form.notes} onChange={(e) => update('notes', e.target.value)} className="input-field" />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div style={{ marginTop: 28 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
                      Payment Method
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives', icon: '🏷️' },
                        { value: 'bkash', label: 'bKash / Nagad', desc: 'Mobile banking payment', icon: '📱' },
                        { value: 'card', label: 'Credit/Debit Card', desc: 'Secure SSL encrypted payment', icon: '💳' },
                      ].map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => update('paymentMethod', method.value)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 14,
                            padding: '16px 18px',
                            background: form.paymentMethod === method.value ? 'rgba(201,149,109,0.06)' : 'var(--bg-surface)',
                            border: form.paymentMethod === method.value ? '1px solid var(--accent)' : '1px solid var(--border-default)',
                            borderRadius: 3,
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span style={{ fontSize: 22 }}>{method.icon}</span>
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{method.label}</p>
                            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{method.desc}</p>
                          </div>
                          {form.paymentMethod === method.value && (
                            <div
                              style={{
                                marginLeft: 'auto',
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: 'var(--accent)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Check size={12} style={{ color: '#FFF' }} />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between' }}>
                    <button type="button" onClick={() => setStep('info')} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ArrowLeft size={14} /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('confirm')}
                      className="btn-primary"
                      disabled={!form.division || !form.district || !form.address}
                    >
                      Review Order <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {step === 'confirm' && (
                <div className="animate-fade-up">
                  <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 26, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 28 }}>
                    Review & Place Order
                  </h2>

                  {/* Summary Info */}
                  <div
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 4,
                      padding: 24,
                      marginBottom: 24,
                    }}
                  >
                    <h3 style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 16 }}>Delivery To</h3>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{form.name}</p>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{form.phone}</p>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{form.address}, {form.district}, {form.division}</p>
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Payment</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                        {form.paymentMethod === 'cod' ? 'Cash on Delivery' : form.paymentMethod === 'bkash' ? 'bKash / Nagad' : 'Card Payment'}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 16px',
                      background: 'rgba(139,157,119,0.08)',
                      border: '1px solid rgba(139,157,119,0.2)',
                      borderRadius: 3,
                      marginBottom: 32,
                    }}
                  >
                    <Lock size={14} style={{ color: 'var(--sage)', flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: 'var(--sage-dark)', fontWeight: 500 }}>
                      Your personal information is protected with 256-bit SSL encryption
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <button type="button" onClick={() => setStep('shipping')} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ArrowLeft size={14} /> Edit Delivery
                    </button>
                    <button type="submit" className="btn-accent" style={{ fontSize: 14, padding: '14px 32px' }}>
                      Place Order — ৳{total.toLocaleString()} <Check size={14} />
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Right: Order Summary */}
            <div style={{ position: 'sticky', top: 120 }}>
              <div
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-elevated)' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Order Summary</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{checkoutItems.length} item{checkoutItems.length !== 1 ? 's' : ''}</p>
                </div>

                <div style={{ padding: '16px 24px', maxHeight: 320, overflowY: 'auto' }}>
                  {checkoutItems.map((item) => {
                    const price = item.variant?.price ?? item.product.price;
                    return (
                      <div key={item.id} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                        <div style={{ width: 52, height: 52, borderRadius: 3, overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-default)' }}>
                          <img src={item.product.image} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.product.name}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Qty: {item.quantity}</p>
                        </div>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', flexShrink: 0 }}>
                          ৳{(price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-default)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Subtotal</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>৳{subtotal.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Shipping</span>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600, color: shipping === 0 ? 'var(--sage)' : 'var(--text-primary)' }}>
                      {shipping === 0 ? 'FREE' : `৳${shipping}`}
                    </span>
                  </div>
                  {couponApplied && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span style={{ fontSize: 13, color: 'var(--sage-dark)' }}>Coupon Discount</span>
                      <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 600, color: 'var(--sage-dark)' }}>−৳{couponDiscount.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Coupon entry */}
                  <div style={{ borderTop: '1px dashed var(--border-default)', paddingTop: 14, marginBottom: 10 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        type="text"
                        placeholder="Coupon Code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={couponApplied || couponLoading}
                        className="input-field"
                        style={{
                          flex: 1,
                          textTransform: 'uppercase',
                          fontSize: 12,
                          padding: '6px 12px',
                          border: couponApplied ? '1px solid var(--sage)' : '1px solid var(--border-default)',
                          background: couponApplied ? 'rgba(139,157,119,0.04)' : 'transparent',
                          color: couponApplied ? 'var(--sage-dark)' : 'var(--text-primary)'
                        }}
                      />
                      <button
                        type="button"
                        onClick={couponApplied ? () => { setCouponApplied(false); setCouponDiscount(0); setCouponCode(''); } : handleApplyCoupon}
                        disabled={couponLoading || (!couponCode.trim() && !couponApplied)}
                        className={couponApplied ? "btn-outline" : "btn-primary"}
                        style={{
                          fontSize: 11,
                          padding: '6px 16px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em'
                        }}
                      >
                        {couponLoading ? '...' : couponApplied ? 'Remove' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p style={{ fontSize: 11, color: '#E05A5A', marginTop: 6, textAlign: 'left', margin: '6px 0 0 0' }}>⚠️ {couponError}</p>
                    )}
                    {couponApplied && (
                      <p style={{ fontSize: 11, color: 'var(--sage-dark)', marginTop: 6, textAlign: 'left', margin: '6px 0 0 0' }}>✓ Coupon applied successfully! Discount: ৳{couponDiscount}</p>
                    )}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: 16,
                      borderTop: '1px solid var(--border-default)',
                    }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Total</span>
                    <span
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: 24,
                        fontWeight: 600,
                        color: 'var(--accent)',
                      }}
                    >
                      ৳{total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Security */}
                <div style={{ padding: '12px 24px 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Shield size={14} style={{ color: 'var(--sage)', flexShrink: 0 }} />
                  <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>Secured by SSL · 7-day return policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
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
