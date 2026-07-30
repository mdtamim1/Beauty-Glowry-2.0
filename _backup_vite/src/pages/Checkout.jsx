import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Truck, CreditCard, Check, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import DropletGlyph from '../components/DropletGlyph';

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('');
  const [deliveryZone, setDeliveryZone] = useState('dhaka'); // dhaka (৳60) or outside (৳130)
  const [paymentMethod, setPaymentMethod] = useState('bKash'); // bKash, Nagad, SSLCommerz, Card, COD
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  const deliveryCharge = subtotal > 1500 ? 0 : (deliveryZone === 'dhaka' ? 60 : 130);
  const total = Math.max(0, subtotal - discountAmount + deliveryCharge);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    if (couponCode.toUpperCase() === 'CLINICAL10' || couponCode.toUpperCase() === 'GLOW10') {
      const disc = Math.round(subtotal * 0.10);
      setDiscountAmount(disc);
      setCouponApplied(true);
    } else {
      alert('Invalid coupon code. Try CLINICAL10 for 10% off.');
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!customerName || !phone || !address) {
      alert('Please fill in all required customer details.');
      return;
    }

    if (cart.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    setSubmitting(true);
    try {
      const newOrder = await addOrder({
        customer: { name: customerName, phone, email, address },
        products: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1
        })),
        deliveryAddress: address,
        deliveryZone,
        deliveryCharge,
        subtotal,
        discount: discountAmount,
        total,
        paymentMethod,
        status: 'Processing'
      });

      clearCart();
      navigate(`/order-success/${newOrder.id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '60px 0', minHeight: '85vh', background: 'var(--silk-background)' }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--emerald-light)', padding: '6px 12px', borderRadius: '20px', marginBottom: '12px' }}>
            <DropletGlyph size={14} color="var(--obsidian-emerald)" />
            <span className="font-mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--obsidian-emerald)', textTransform: 'uppercase' }}>
              SECURE CLINICAL CHECKOUT
            </span>
          </div>
          <h1 className="font-editorial" style={{ fontSize: '38px', color: 'var(--velvet-charcoal)' }}>
            Complete Your Regimen Order
          </h1>
        </div>

        <form onSubmit={handleSubmitOrder}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.8fr',
            gap: '40px',
            alignItems: 'flex-start'
          }} className="checkout-grid">
            
            {/* Left Column: Customer & Delivery Details */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-champagne)', borderRadius: 'var(--radius-lg)', padding: '36px', boxShadow: 'var(--shadow-md)' }}>
              
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--velvet-charcoal)', marginBottom: '20px', borderBottom: '1px solid var(--border-champagne)', paddingBottom: '12px' }}>
                1. Delivery & Contact Details
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Full Name *</label>
                  <input type="text" required placeholder="e.g. Tamim Ahmed" value={customerName} onChange={e => setCustomerName(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-champagne)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Phone Number *</label>
                  <input type="tel" required placeholder="01712345678" value={phone} onChange={e => setPhone(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-champagne)' }} />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Email Address (for tracking)</label>
                <input type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-champagne)' }} />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Full Delivery Address *</label>
                <textarea rows={3} required placeholder="House/Flat No, Road, District, Thana..." value={address} onChange={e => setAddress(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-champagne)' }} />
              </div>

              {/* Delivery Zone Selector */}
              <div style={{ marginBottom: '32px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '10px' }}>Delivery Destination:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setDeliveryZone('dhaka')}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      border: deliveryZone === 'dhaka' ? '2px solid var(--obsidian-emerald)' : '1px solid var(--border-champagne)',
                      background: deliveryZone === 'dhaka' ? 'var(--emerald-light)' : '#FFFFFF',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Inside Dhaka City</div>
                    <div className="font-mono" style={{ fontSize: '13px', color: 'var(--obsidian-emerald)', fontWeight: 700 }}>
                      {subtotal > 1500 ? 'FREE' : '৳60'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryZone('outside')}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      border: deliveryZone === 'outside' ? '2px solid var(--obsidian-emerald)' : '1px solid var(--border-champagne)',
                      background: deliveryZone === 'outside' ? 'var(--emerald-light)' : '#FFFFFF',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>Outside Dhaka</div>
                    <div className="font-mono" style={{ fontSize: '13px', color: 'var(--obsidian-emerald)', fontWeight: 700 }}>
                      {subtotal > 1500 ? 'FREE' : '৳130'}
                    </div>
                  </button>
                </div>
              </div>

              {/* Payment Method Selector */}
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--velvet-charcoal)', marginBottom: '16px', borderBottom: '1px solid var(--border-champagne)', paddingBottom: '12px' }}>
                2. Select Payment Method
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                {[
                  { id: 'bKash', name: 'bKash Mobile' },
                  { id: 'Nagad', name: 'Nagad Mobile' },
                  { id: 'SSLCommerz', name: 'SSLCommerz (Cards/Banking)' },
                  { id: 'Card', name: 'Credit / Debit Card' },
                  { id: 'COD', name: 'Cash on Delivery (COD)' }
                ].map((pay, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPaymentMethod(pay.id)}
                    style={{
                      padding: '14px',
                      borderRadius: '8px',
                      border: paymentMethod === pay.id ? '2px solid var(--obsidian-emerald)' : '1px solid var(--border-champagne)',
                      background: paymentMethod === pay.id ? 'var(--emerald-light)' : '#FFFFFF',
                      fontWeight: paymentMethod === pay.id ? 600 : 400,
                      fontSize: '13px',
                      color: 'var(--velvet-charcoal)',
                      textAlign: 'center'
                    }}
                  >
                    {pay.name}
                  </button>
                ))}
              </div>

            </div>

            {/* Right Column: Order Summary */}
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-champagne)', borderRadius: 'var(--radius-lg)', padding: '36px', boxShadow: 'var(--shadow-md)' }}>
              
              <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--velvet-charcoal)', marginBottom: '20px', borderBottom: '1px solid var(--border-champagne)', paddingBottom: '12px' }}>
                Order Summary
              </h2>

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxHeight: '300px', overflowY: 'auto' }}>
                {cart.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px' }}>
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--velvet-charcoal)' }}>{item.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--slate-muted)' }}>Qty: {item.quantity || 1}</div>
                    </div>
                    <span className="font-mono" style={{ fontWeight: 600 }}>
                      ৳{(item.price * (item.quantity || 1))}
                    </span>
                  </div>
                ))}
              </div>

              {/* Promo Code Input */}
              <div style={{ marginBottom: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-champagne)' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Coupon code (e.g. CLINICAL10)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    style={{ flexGrow: 1, padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-champagne)', fontSize: '13px' }}
                  />
                  <button onClick={handleApplyCoupon} style={{ background: 'var(--velvet-charcoal)', color: '#FFFFFF', padding: '10px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600 }}>
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <div style={{ fontSize: '12px', color: '#276749', marginTop: '6px', fontWeight: 600 }}>
                    ✓ 10% Clinical discount applied!
                  </div>
                )}
              </div>

              {/* Totals Breakdown */}
              <div style={{ borderTop: '1px solid var(--border-champagne)', paddingTop: '16px', marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--slate-muted)' }}>
                  <span>Subtotal</span>
                  <span className="font-mono">৳{subtotal}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--slate-muted)' }}>
                  <span>Delivery Charge</span>
                  <span className="font-mono">{deliveryCharge === 0 ? 'FREE' : `৳${deliveryCharge}`}</span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: '#276749' }}>
                    <span>Coupon Discount</span>
                    <span className="font-mono">-৳{discountAmount}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: '2px solid var(--border-champagne)', fontSize: '20px', fontWeight: 700, color: 'var(--velvet-charcoal)' }}>
                  <span>Total Payable</span>
                  <span className="font-mono" style={{ color: 'var(--obsidian-emerald)' }}>৳{total}</span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={submitting || cart.length === 0}
                style={{
                  width: '100%',
                  padding: '18px',
                  background: 'var(--obsidian-emerald)',
                  color: '#FFFFFF',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {submitting ? 'Processing Order...' : `Confirm & Place Order (৳${total})`} <ArrowRight size={18} />
              </button>

            </div>

          </div>
        </form>

      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .checkout-grid { grid-template-columns: 1fr !important; }
        }
      `}} />
    </div>
  );
};

export default Checkout;
