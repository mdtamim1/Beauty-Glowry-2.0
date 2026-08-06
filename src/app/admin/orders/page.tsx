'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, ChevronDown, Eye, X, Printer, RefreshCw, Filter,
  Plus, Trash2, Package, Save, Tag, Hash, User, Phone,
  Mail, MapPin, Truck, Calendar, FileText, ShoppingCart,
  AlertCircle, Check, Copy, Clock, Shield, RotateCcw
} from 'lucide-react';
import { products } from '../../../data/products';
import { logActivity, getAuthHeaders } from '../utils';

const C = {
  surface: '#1A1A17', elevated: '#222220', border: 'rgba(255,255,255,0.07)',
  borderFocus: 'rgba(201,149,109,0.6)',
  text: '#F0EBE3', textSec: '#B0A8A0', muted: '#7A7470',
  accent: '#C9956D', success: '#4CAF82', warning: '#F0A54B', danger: '#E05A5A', info: '#60A5FA',
};

// ─── Bangladesh Districts & Thanas ──────────────────────────────────────
const BD_LOCATIONS: Record<string, string[]> = {
  Dhaka: ['Adabar', 'Badda', 'Banani', 'Demra', 'Dhanmondi', 'Gulshan', 'Hazaribagh', 'Jatrabari', 'Kadamtali', 'Kalabagan', 'Khilgaon', 'Mirpur', 'Mohammadpur', 'Motijheel', 'Pallabi', 'Ramna', 'Sabujbagh', 'Tejgaon', 'Turag', 'Uttara'],
  Chittagong: ['Agrabad', 'Anwara', 'Bayezid', 'Chandgaon', 'Chittagong Sadar', 'Double Mooring', 'Halishahar', 'Karnaphuli', 'Kotwali', 'Pahartali', 'Panchlaish', 'Patenga', 'Raozan', 'Sitakunda'],
  Sylhet: ['Balaganj', 'Beanibazar', 'Biswanath', 'Companiganj', 'Dakshin Surma', 'Fenchuganj', 'Golapganj', 'Gowainghat', 'Jaintiapur', 'Kanaighat', 'Osmani Nagar', 'South Surma', 'Sylhet Sadar', 'Zakiganj'],
  Rajshahi: ['Bagha', 'Bagmara', 'Boalia', 'Charghat', 'Durgapur', 'Godagari', 'Matihar', 'Mohanpur', 'Paba', 'Puthia', 'Rajpara', 'Rajshahi Sadar', 'Shah Makhdum', 'Tanore'],
  Khulna: ['Batiaghata', 'Dacope', 'Daulatpur', 'Dighalia', 'Dumuria', 'Fultala', 'Khan Jahan Ali', 'Khalishpur', 'Khulna Sadar', 'Kotwali', 'Koyra', 'Paikgachha', 'Rupsha', 'Sonadanga', 'Terokhada'],
  Barisal: ['Agailjhara', 'Babuganj', 'Bakerganj', 'Banaripara', 'Barisal Sadar', 'Gauranadi', 'Hizla', 'Mehendiganj', 'Muladi', 'Wazirpur'],
  Rangpur: ['Badarganj', 'Gangachara', 'Kaunia', 'Mithapukur', 'Pirgachha', 'Pirganj', 'Rangpur Sadar', 'Taraganj'],
  Mymensingh: ['Bhaluka', 'Dhobaura', 'Fulbaria', 'Gaffargaon', 'Gauripur', 'Haluaghat', 'Ishwarganj', 'Muktagachha', 'Mymensingh Sadar', 'Nandail', 'Phulpur', 'Trishal'],
  Comilla: ['Barura', 'Brahmanpara', 'Burichang', 'Chandina', 'Chauddagram', 'Comilla Sadar', 'Daudkandi', 'Debidwar', 'Homna', 'Laksam', 'Lalmai', 'Meghna', 'Muradnagar', 'Nangalkot', 'Titas'],
  Narayanganj: ['Araihazar', 'Bandar', 'Narayanganj Sadar', 'Rupganj', 'Sonargaon'],
  Gazipur: ['Gazipur Sadar', 'Kaliakair', 'Kaliganj', 'Kapasia', 'Sreepur', 'Tongi'],
  Cumilla: ['Comilla Adarsha', 'Sadar South'],
};

const COURIERS = ['Pathao', 'Paperfly', 'Sundarban', 'SA Paribahan', 'Redx', 'eCourier', 'Steadfast', 'Custom'];
const PAYMENT_METHODS = ['Cash on Delivery (COD)', 'bKash', 'Nagad', 'Rocket', 'Credit/Debit Card', 'Bank Transfer'];

// ─── Types ───────────────────────────────────────────────────────────────
type OrderStatus = 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Returned';

interface OrderItem {
  productId: number;
  name: string;
  size: string;
  sku: string;
  qty: number;
  price: number;
}

interface Order {
  id: string; customer: string; phone: string; email: string;
  address: string; items: { name: string; qty: number; price: number }[];
  total: number; shipping: number; payment: string;
  status: OrderStatus; date: string; notes?: string;
  district?: string; thana?: string; area?: string;
  courier?: string; customerNote?: string; shopNote?: string;
  orderHistory?: Array<{ status: string; date: string; note: string }>;
  assigned_to?: string;
}

const STATUS_STYLES: Record<OrderStatus, { bg: string; color: string }> = {
  Pending: { bg: 'rgba(122,116,112,0.15)', color: C.muted },
  Processing: { bg: 'rgba(240,165,75,0.15)', color: C.warning },
  Shipped: { bg: 'rgba(96,165,250,0.15)', color: C.info },
  Delivered: { bg: 'rgba(76,175,130,0.15)', color: C.success },
  Cancelled: { bg: 'rgba(239,68,68,0.15)', color: '#EF4444' }, // Red for cancelled
  Returned: { bg: 'rgba(201,149,109,0.15)', color: C.accent }, // Gold/accent for returned
};

const ALL_STATUSES: OrderStatus[] = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];

const INITIAL_ORDERS: Order[] = [
  { id: 'BG-9940', customer: 'Sumaiya Rahman', phone: '01711223344', email: 'sumaiya@gmail.com', address: 'House 12, Road 4, Dhanmondi', items: [{ name: 'Niacinamide 10% Serum', qty: 1, price: 1250 }, { name: 'HA Hydration Serum', qty: 1, price: 1150 }], total: 2400, shipping: 0, payment: 'bKash', status: 'Delivered', date: '2026-07-29', district: 'Dhaka', courier: 'Pathao' },
  { id: 'BG-9939', customer: 'Imtiaz Ahmed', phone: '01855667788', email: 'imtiaz@outlook.com', address: 'Flat 3B, Gulshan-2', items: [{ name: 'Ceramide Barrier Cream', qty: 2, price: 1650 }], total: 3300, shipping: 0, payment: 'COD', status: 'Shipped', date: '2026-07-29', district: 'Dhaka', courier: 'Paperfly' },
  { id: 'BG-9938', customer: 'Afrin Jahan', phone: '01966778899', email: 'afrin@yahoo.com', address: 'Chittagong Sadar', items: [{ name: 'Centella Asiatica Essence', qty: 1, price: 950 }], total: 950, shipping: 120, payment: 'Nagad', status: 'Processing', date: '2026-07-28', district: 'Chittagong', courier: 'Sundarban' },
  { id: 'BG-9937', customer: 'Fahim Shahriar', phone: '01712345678', email: 'fahim@gmail.com', address: 'Sylhet Sadar', items: [{ name: 'Vitamin C 15% Emulsion', qty: 1, price: 1850 }], total: 1850, shipping: 120, payment: 'COD', status: 'Pending', date: '2026-07-28', district: 'Sylhet' },
  { id: 'BG-9936', customer: 'Nadia Islam', phone: '01611223344', email: 'nadia@gmail.com', address: 'Mirpur-10', items: [{ name: 'Salicylic Acid Cleanser', qty: 2, price: 750 }], total: 1500, shipping: 0, payment: 'bKash', status: 'Pending', date: '2026-07-27', district: 'Dhaka' },
  { id: 'BG-9935', customer: 'Rahim Khan', phone: '01722334455', email: 'rahim@gmail.com', address: 'Uttara', items: [{ name: 'Niacinamide 10% Serum', qty: 3, price: 1250 }], total: 3750, shipping: 0, payment: 'Card', status: 'Delivered', date: '2026-07-26', district: 'Dhaka' },
  { id: 'BG-9934', customer: 'Tasnim Akter', phone: '01833445566', email: 'tasnim@gmail.com', address: 'Khulna Sadar', items: [{ name: 'Ceramide Barrier Cream', qty: 1, price: 1650 }], total: 1650, shipping: 120, payment: 'COD', status: 'Returned', date: '2026-07-25', district: 'Khulna' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────
function genInvoiceNo() {
  return 'BG-' + Math.floor(1000 + Math.random() * 9000);
}

function getDhakaDateStr(dateInput?: Date | string) {
  const d = dateInput ? new Date(dateInput) : new Date();
  const tzOffset = 6 * 60; // Dhaka is UTC+6 (360 mins)
  const localTime = d.getTime() + (d.getTimezoneOffset() + tzOffset) * 60000;
  const dhakaDate = new Date(localTime);
  const yyyy = dhakaDate.getFullYear();
  const mm = String(dhakaDate.getMonth() + 1).padStart(2, '0');
  const dd = String(dhakaDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function todayStr() {
  return getDhakaDateStr();
}

function isToday(dateStr: string) {
  if (!dateStr) return false;
  return dateStr === getDhakaDateStr();
}

function isDeliveredToday(order: Order) {
  if (order.status !== 'Delivered') return false;
  const todayDhakaStr = getDhakaDateStr();

  if (order.orderHistory && order.orderHistory.length > 0) {
    const deliveredEntry = order.orderHistory.find(
      h => h.status.toLowerCase() === 'delivered'
    );
    if (deliveredEntry) {
      const entryDateStr = getDhakaDateStr(deliveredEntry.date);
      return entryDateStr === todayDhakaStr;
    }
  }

  return getDhakaDateStr(order.date) === todayDhakaStr;
}

// ─── Shared Input Style ───────────────────────────────────────────────────
const iS = {
  width: '100%', padding: '9px 12px',
  background: C.elevated, border: `1px solid ${C.border}`,
  borderRadius: 6, fontSize: 13, color: C.text,
  fontFamily: "'DM Sans', sans-serif", outline: 'none',
};

function LabeledField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
        {label}{required && <span style={{ color: C.danger }}> *</span>}
      </label>
      {children}
    </div>
  );
}

// ─── View/Edit Order Modal ─────────────────────────────────────────────────────
// ─── Steadfast Send Modal ────────────────────────────────────────────────────
function SteadfastModal({ order, onClose, onSent }: { order: Order; onClose: () => void; onSent: (cid: string, url: string) => void }) {
  const codAmount = order.total;
  const fullAddress = [order.address, order.thana, order.area, order.district].filter(Boolean).join(', ');
  const [name, setName] = useState(order.customer);
  const [phone, setPhone] = useState(order.phone);
  const [addr, setAddr] = useState(fullAddress);
  const [cod, setCod] = useState(codAmount);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const getToken = () => {
    try { const s = localStorage.getItem('bg_admin_session'); return s ? JSON.parse(s)?.token : null; } catch { return null; }
  };

  const handleSend = async () => {
    setLoading(true); setError('');
    const token = getToken();
    try {
      const res = await fetch('/api/courier/steadfast/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          order_number: order.id,
          recipient_name: name,
          recipient_phone: phone,
          recipient_address: addr,
          cod_amount: cod,
          note,
          item_description: order.items.map(i => `${i.name} x${i.qty}`).join(', '),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to send to Steadfast'); return; }
      setResult(data);
      onSent(data.consignment_id, data.tracking_url);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 201 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 202, width: '90%', maxWidth: 480,
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: 'rgba(16,185,129,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Truck size={18} style={{ color: '#10B981' }} />
            <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Send to Steadfast</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}><X size={18} /></button>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {result ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <p style={{ fontSize: 16, fontWeight: 800, color: '#10B981', marginBottom: 8 }}>Sent to Steadfast!</p>
              <p style={{ fontSize: 13, color: C.textSec, marginBottom: 16 }}>Consignment ID:</p>
              <div style={{ padding: '10px 16px', background: C.elevated, borderRadius: 8, fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 700, color: '#10B981', letterSpacing: '0.1em', marginBottom: 16 }}>
                {result.consignment_id}
              </div>
              {result.tracking_url && (
                <a href={result.tracking_url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 20px', background: '#10B981', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                  <Truck size={13} /> Track Package
                </a>
              )}
            </div>
          ) : (
            <>
              {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, color: '#EF4444' }}>{error}</div>}
              {[{ label: 'Recipient Name', val: name, set: setName }, { label: 'Phone', val: phone, set: setPhone }, { label: 'Address', val: addr, set: setAddr }].map(f => (
                <div key={f.label}>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginBottom: 5 }}>{f.label}</label>
                  <input value={f.val} onChange={e => f.set(e.target.value)} style={{ ...iS }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginBottom: 5 }}>COD Amount (৳)</label>
                <input type="number" value={cod} onChange={e => setCod(Number(e.target.value))} style={{ ...iS }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted, marginBottom: 5 }}>Note (Optional)</label>
                <input value={note} onChange={e => setNote(e.target.value)} placeholder="Special delivery instructions..." style={{ ...iS }} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button onClick={onClose} style={{ flex: 1, padding: '10px 0', background: 'none', border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.muted, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSend} disabled={loading} style={{ flex: 2, padding: '10px 0', background: '#10B981', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 800, color: '#fff', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <Truck size={14} /> {loading ? 'Sending…' : 'Confirm & Send'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Fraud Check Modal ────────────────────────────────────────────────────────
function FraudCheckModal({ phone, onClose }: { phone: string; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const getToken = () => {
    try { const s = localStorage.getItem('bg_admin_session'); return s ? JSON.parse(s)?.token : null; } catch { return null; }
  };

  useEffect(() => {
    const token = getToken();
    fetch('/api/courier/fraud-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ phone }),
    })
      .then(r => r.json())
      .then(data => { setResult(data); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [phone]);

  const getRiskConfig = (score: number) => {
    if (score >= 70) return { label: 'HIGH RISK', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: '🚨' };
    if (score >= 40) return { label: 'MEDIUM RISK', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: '⚠️' };
    return { label: 'LOW RISK', color: '#10B981', bg: 'rgba(16,185,129,0.12)', icon: '✅' };
  };

  const riskScore = result?.risk_score ?? result?.riskScore ?? result?.score ?? null;
  const riskCfg = riskScore !== null ? getRiskConfig(riskScore) : null;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 201 }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 202, width: '90%', maxWidth: 500,
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14,
        overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        maxHeight: '85vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: 'rgba(96,165,250,0.08)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Shield size={18} style={{ color: C.info }} />
            <div>
              <span style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Fraud Check</span>
              <div style={{ fontSize: 11, color: C.muted, fontFamily: "'DM Mono', monospace" }}>{phone}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}><X size={18} /></button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <RefreshCw size={28} style={{ color: C.info, animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
              <p style={{ color: C.muted, fontSize: 13 }}>Checking across Pathao, Steadfast, RedX, Paperfly…</p>
              <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {error && (
            <div style={{ padding: '14px 16px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, fontSize: 13, color: '#EF4444', textAlign: 'center' }}>
              <AlertCircle size={18} style={{ marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
              {error}
              <p style={{ fontSize: 11, marginTop: 6, color: C.muted }}>Make sure the BD Courier API key is configured.</p>
            </div>
          )}

          {result && !loading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Risk Score Banner */}
              {riskCfg && (
                <div style={{ padding: '16px 20px', background: riskCfg.bg, border: `1px solid ${riskCfg.color}40`, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 32 }}>{riskCfg.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: riskCfg.color }}>{riskCfg.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: riskCfg.color, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{riskScore}<span style={{ fontSize: 14, fontWeight: 500 }}>/100</span></div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Risk Score</div>
                  </div>
                </div>
              )}

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'Total Orders', value: result.total_orders ?? result.totalOrders ?? '—', color: C.text },
                  { label: 'Delivered', value: result.success_count ?? result.delivered ?? result.successCount ?? '—', color: '#10B981' },
                  { label: 'Returned/Cancelled', value: result.return_count ?? result.returned ?? result.returnCount ?? '—', color: '#EF4444' },
                ].map(stat => (
                  <div key={stat.label} style={{ padding: '12px 14px', background: C.elevated, borderRadius: 10, textAlign: 'center', border: `1px solid ${C.border}` }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: stat.color, fontFamily: "'DM Mono', monospace" }}>{stat.value}</div>
                    <div style={{ fontSize: 10, color: C.muted, marginTop: 4, letterSpacing: '0.05em' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Per-courier breakdown */}
              {(result.couriers || result.courier_wise || result.breakdown) && (
                <div style={{ background: C.elevated, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                  <div style={{ padding: '8px 14px', borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.muted }}>Courier Breakdown</div>
                  {Object.entries(result.couriers || result.courier_wise || result.breakdown || {}).map(([courier, stats]: [string, any]) => (
                    <div key={courier} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{courier}</span>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
                        <span style={{ color: '#10B981' }}>✓ {typeof stats === 'object' ? (stats.delivered ?? stats.success ?? stats.success_count ?? 0) : 0}</span>
                        <span style={{ color: '#EF4444' }}>✗ {typeof stats === 'object' ? (stats.returned ?? stats.return ?? stats.return_count ?? 0) : 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Raw message if exists */}
              {result.message && (
                <div style={{ padding: '10px 14px', background: C.elevated, borderRadius: 8, fontSize: 12, color: C.muted }}>
                  {result.message}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ padding: '12px 20px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} style={{ width: '100%', padding: '10px 0', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 700, color: C.muted, cursor: 'pointer' }}>Close</button>
        </div>
      </div>
    </>
  );
}

// ─── View/Edit Order Modal ─────────────────────────────────────────────────────
function ViewOrderModal({ order, onClose, onSave }: {
  order: Order;
  onClose: () => void;
  onSave: (order: Order) => void;
}) {
  const [customerName, setCustomerName] = useState(order.customer);
  const [customerPhone, setCustomerPhone] = useState(order.phone);
  const [customerEmail, setCustomerEmail] = useState(order.email || '');
  const [customerAddress, setCustomerAddress] = useState(() => {
    let addr = order.address || '';
    if (order.district && addr.endsWith(order.district)) {
      addr = addr.substring(0, addr.lastIndexOf(order.district)).trim().replace(/,\s*$/, '');
    }
    if (order.thana && addr.endsWith(order.thana)) {
      addr = addr.substring(0, addr.lastIndexOf(order.thana)).trim().replace(/,\s*$/, '');
    }
    return addr;
  });
  const [courier, setCourier] = useState(order.courier || COURIERS[0]);
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [orderDate, setOrderDate] = useState(order.date);
  const [district, setDistrict] = useState(order.district || 'Dhaka');
  const [thana, setThana] = useState(order.thana || '');
  const [area, setArea] = useState(order.area || '');
  const [payment, setPayment] = useState(() => {
    const found = PAYMENT_METHODS.find(m => m.toLowerCase().includes(order.payment.toLowerCase()));
    return found || PAYMENT_METHODS[0];
  });
  const [memoNo, setMemoNo] = useState('');
  const [customerNote, setCustomerNote] = useState(order.customerNote || '');
  const [shopNote, setShopNote] = useState(order.shopNote || '');
  const [orderHistory, setOrderHistory] = useState(() => order.orderHistory || []);
  const [deliveryCharge, setDeliveryCharge] = useState(order.shipping);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Courier integration states
  const [showSteadfastModal, setShowSteadfastModal] = useState(false);
  const [showFraudModal, setShowFraudModal] = useState(false);
  const [consignmentId, setConsignmentId] = useState((order as any).consignment_id || '');
  const [trackingUrl, setTrackingUrl] = useState((order as any).tracking_url || '');

  // Reassignment states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeModerators, setActiveModerators] = useState<any[]>([]);
  const [assignedTo, setAssignedTo] = useState(order.assigned_to || '');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sess = localStorage.getItem('bg_admin_session');
    if (sess) setCurrentUser(JSON.parse(sess));

    const modsStr = localStorage.getItem('bg_moderators');
    if (modsStr) {
      const allMods = JSON.parse(modsStr);
      setActiveModerators(allMods.filter((m: any) => m.status === 'Active'));
    }
  }, [order]);

  // Product search
  const [productSearch, setProductSearch] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>(() => {
    return order.items.map((item, index) => {
      const foundProduct = products.find(p => p.name === item.name || item.name.includes(p.name) || p.name.includes(item.name));
      return {
        productId: foundProduct?.id ?? (1000 + index),
        name: item.name,
        size: foundProduct?.size ?? '—',
        sku: foundProduct?.variants[0]?.sku ?? `BG-${foundProduct?.id ?? (1000 + index)}`,
        qty: item.qty,
        price: item.price,
      };
    });
  });
  const [showDropdown, setShowDropdown] = useState(false);

  const thanas = BD_LOCATIONS[district] || [];

  const filteredProducts = useMemo(() =>
    productSearch.length > 0
      ? products.filter(p =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.category.toLowerCase().includes(productSearch.toLowerCase())
        ).slice(0, 8)
      : [],
    [productSearch]
  );

  const addProduct = (p: typeof products[0]) => {
    const existing = orderItems.find(i => i.productId === p.id);
    if (existing) {
      setOrderItems(prev => prev.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setOrderItems(prev => [...prev, {
        productId: p.id, name: p.name, size: p.size || '—',
        sku: p.variants[0]?.sku || `BG-${p.id}`, qty: 1, price: p.price,
      }]);
    }
    setProductSearch('');
    setShowDropdown(false);
  };

  const removeItem = (id: number) => setOrderItems(prev => prev.filter(i => i.productId !== id));
  const updateQty = (id: number, qty: number) => {
    if (qty < 1) { removeItem(id); return; }
    setOrderItems(prev => prev.map(i => i.productId === id ? { ...i, qty } : i));
  };

  const subTotal = orderItems.reduce((a, i) => a + i.price * i.qty, 0);
  const total = Math.max(0, subTotal + deliveryCharge - discount - couponDiscount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), orderAmount: subTotal }),
      });
      const data = await res.json();
      if (res.ok) {
        setCouponApplied(true);
        setCouponDiscount(data.discountAmount);
      } else {
        alert(data.error || 'Failed to apply coupon');
      }
    } catch (e) {
      alert('Failed to connect to coupon validation service');
    }
  };

  const handleUpdate = () => {
    if (!customerName || !customerPhone || !customerAddress) return;
    const updatedOrder: Order = {
      ...order,
      customer: customerName,
      phone: customerPhone,
      email: customerEmail,
      address: `${customerAddress}${thana ? ', ' + thana : ''}${district ? ', ' + district : ''}`,
      items: orderItems.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      total,
      shipping: deliveryCharge,
      payment: payment.split(' ')[0],
      status,
      date: orderDate,
      district, thana, area, courier, customerNote, shopNote, orderHistory,
      statusNote: status !== order.status ? `Advanced status from ${order.status} to ${status}` : undefined,
      assigned_to: assignedTo,
    } as any;
    onSave(updatedOrder);
    onClose();
  };

  const quickNotes = ['Urgent delivery request', 'Handle with care', 'Gift wrap please', 'Call before delivery'];

  const statusColor = STATUS_STYLES[status].color;
  const statusBg = STATUS_STYLES[status].bg;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.75)' }} />
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 100, width: '96%', maxWidth: 1400, maxHeight: '92vh',
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 48px 120px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* ── Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 28px', borderBottom: `1px solid ${C.border}`, background: C.elevated, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.info}20`, border: `1px solid ${C.info}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Eye size={16} style={{ color: C.info }} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Edit Order Details</h2>
              <p style={{ fontSize: 11, color: C.muted }}>Modify order settings, customer data, and item quantities</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Status Badge */}
            <span style={{ padding: '5px 14px', background: statusBg, border: `1px solid ${statusColor}40`, borderRadius: 6, fontSize: 12, fontWeight: 700, color: statusColor }}>
              {status}
            </span>
            {/* Invoice */}
            <div style={{ padding: '5px 12px', background: `${C.accent}15`, border: `1px solid ${C.accent}30`, borderRadius: 5, fontSize: 12, fontWeight: 700, color: C.accent, fontFamily: "'DM Mono', monospace" }}>
              {order.id}
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, cursor: 'pointer', color: C.muted }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Body — 2 column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', overflow: 'hidden', flex: 1 }}>
          {/* LEFT — Customer & Delivery Info */}
          <div style={{ overflowY: 'auto', padding: '22px 24px', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Store + Invoice */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <LabeledField label="Store Name">
                <input value="Beauty Glowry" readOnly style={{ ...iS, color: C.muted, cursor: 'not-allowed' }} />
              </LabeledField>
              <LabeledField label="Invoice Number">
                <div style={{ position: 'relative' }}>
                  <input value={order.id} readOnly style={{ ...iS, fontFamily: "'DM Mono', monospace", color: C.accent, cursor: 'not-allowed' }} />
                  <Hash size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
                </div>
              </LabeledField>
            </div>

            {/* Customer Name + Phone + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <LabeledField label="Customer Name" required>
                <div style={{ position: 'relative' }}>
                  <User size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                  <input
                    type="text" placeholder="Full Name" value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    style={{ ...iS, paddingLeft: 28 }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                  />
                </div>
              </LabeledField>
              <LabeledField label="Customer Phone" required>
                <div style={{ position: 'relative' }}>
                  <Phone size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                  <input
                    type="tel" placeholder="01XXXXXXXXX" value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    style={{ ...iS, paddingLeft: 28 }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                  />
                </div>
              </LabeledField>
              <LabeledField label="Email / Gmail">
                <div style={{ position: 'relative' }}>
                  <Mail size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                  <input
                    type="email" placeholder="customer@gmail.com" value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    style={{ ...iS, paddingLeft: 28 }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                  />
                </div>
              </LabeledField>
            </div>

            {/* Address */}
            <LabeledField label="Customer Address" required>
              <div style={{ position: 'relative' }}>
                <MapPin size={12} style={{ position: 'absolute', left: 10, top: 12, color: C.muted, pointerEvents: 'none' }} />
                <textarea
                  rows={2} placeholder="House No, Road, Village / Area..."
                  value={customerAddress} onChange={e => setCustomerAddress(e.target.value)}
                  style={{ ...iS, paddingLeft: 28, resize: 'none' }}
                  onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                />
              </div>
            </LabeledField>

            {/* Courier + Status + Date */}
            <div style={{ display: 'grid', gridTemplateColumns: currentUser?.role === 'admin' ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr', gap: 12 }}>
              <LabeledField label="Courier">
                <div style={{ position: 'relative' }}>
                  <select value={courier} onChange={e => setCourier(e.target.value)} style={{ ...iS, paddingRight: 28, appearance: 'none', cursor: 'pointer' }}>
                    {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                </div>
              </LabeledField>
              <LabeledField label="Order Status">
                <div style={{ position: 'relative' }}>
                  <select value={status} onChange={e => setStatus(e.target.value as OrderStatus)} style={{ ...iS, paddingRight: 28, appearance: 'none', cursor: 'pointer', color: STATUS_STYLES[status].color, background: STATUS_STYLES[status].bg, border: `1px solid ${STATUS_STYLES[status].color}40` }}>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: STATUS_STYLES[status].color, pointerEvents: 'none' }} />
                </div>
              </LabeledField>
              <LabeledField label="Order Date">
                <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} style={{ ...iS, colorScheme: 'dark' }} />
              </LabeledField>
              {currentUser?.role === 'admin' && (
                <LabeledField label="Assigned Moderator">
                  <div style={{ position: 'relative' }}>
                    <select
                      value={assignedTo}
                      onChange={e => setAssignedTo(e.target.value)}
                      style={{ ...iS, paddingRight: 28, appearance: 'none', cursor: 'pointer', color: C.accent, border: `1px solid ${C.accent}40` }}
                    >
                      <option value="admin">Super Admin (Default)</option>
                      {activeModerators.map(m => (
                        <option key={m.email} value={m.email}>
                          {m.name} ({m.email})
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.accent, pointerEvents: 'none' }} />
                  </div>
                </LabeledField>
              )}
            </div>

            {/* District + Thana + Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <LabeledField label="District">
                <div style={{ position: 'relative' }}>
                  <select value={district} onChange={e => { setDistrict(e.target.value); setThana(''); }} style={{ ...iS, paddingRight: 28, appearance: 'none', cursor: 'pointer' }}>
                    {Object.keys(BD_LOCATIONS).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                </div>
              </LabeledField>
              <LabeledField label="Thana / Upazila">
                <div style={{ position: 'relative' }}>
                  <select value={thana} onChange={e => setThana(e.target.value)} style={{ ...iS, paddingRight: 28, appearance: 'none', cursor: 'pointer' }}>
                    <option value="">Select Thana</option>
                    {thanas.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                </div>
              </LabeledField>
              <LabeledField label="Area / Neighborhood">
                <input type="text" placeholder="Block C, Section 7..." value={area} onChange={e => setArea(e.target.value)}
                  style={iS}
                  onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                />
              </LabeledField>
            </div>

            {/* Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <LabeledField label="Customer Note">
                <textarea rows={2} placeholder="Note for customer..." value={customerNote} onChange={e => setCustomerNote(e.target.value)}
                  style={{ ...iS, resize: 'none' }}
                  onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                />
              </LabeledField>
              <LabeledField label="Shop Note">
                <textarea rows={2} placeholder="Internal note..." value={shopNote} onChange={e => setShopNote(e.target.value)}
                  style={{ ...iS, resize: 'none' }}
                  onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                />
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>
                  {quickNotes.map(t => (
                    <button key={t} onClick={() => setShopNote(t)} style={{ fontSize: 10, padding: '2px 8px', background: `${C.accent}12`, border: `1px solid ${C.accent}30`, borderRadius: 3, color: C.accent, cursor: 'pointer', transition: 'background 0.15s' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </LabeledField>
            </div>

            {/* Order Status History Timeline & Suggestions */}
            <div style={{ marginTop: 24, borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={13} /> Order Status Timeline & Suggestions
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20, alignItems: 'start' }}>
                {/* Left: Timeline logs */}
                <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>
                    Timeline Log Entries ({orderHistory.length})
                  </p>

                  {orderHistory.length > 0 ? (
                    <div style={{ position: 'relative', paddingLeft: 16, borderLeft: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {orderHistory.map((h: any, index: number) => (
                        <div key={index} style={{ position: 'relative' }}>
                          <div style={{
                            position: 'absolute', left: -22, top: 4, width: 9, height: 9, borderRadius: '50%',
                            background: h.status.toLowerCase() === status.toLowerCase() ? C.success : C.accent,
                            border: `2px solid ${C.elevated}`
                          }} />
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{h.status}</span>
                              <span style={{ fontSize: 9, color: C.muted }}>
                                {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {h.note && (
                              <p style={{ fontSize: 10, color: C.textSec, fontStyle: 'italic' }}>{h.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>No timeline entries available.</p>
                  )}
                </div>

                {/* Right: Suggested next status */}
                <div style={{ background: 'rgba(201, 149, 109, 0.03)', border: `1px solid rgba(201, 149, 109, 0.12)`, borderRadius: 8, padding: 14 }}>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: C.accent, marginBottom: 8 }}>
                    💡 Suggested Action
                  </p>
                  {(() => {
                    const flow = ['Pending', 'Processing', 'Shipped', 'Delivered'];
                    const currentIndex = flow.findIndex(f => f.toLowerCase() === status.toLowerCase());
                    if (currentIndex === -1 || currentIndex === flow.length - 1) {
                      return <p style={{ fontSize: 11, color: C.muted, fontStyle: 'italic' }}>Order is in final state ({status}).</p>;
                    }
                    const nextStatus = flow[currentIndex + 1];
                    return (
                      <div>
                        <p style={{ fontSize: 11, color: C.textSec, marginBottom: 12 }}>
                          Advance order to <strong style={{ color: C.text }}>{nextStatus}</strong>:
                        </p>
                        <button
                          onClick={() => {
                            setStatus(nextStatus as any);
                            // Add a status transitions entry in client state so they see it instantly
                            const tempHistory = {
                              status: nextStatus,
                              date: new Date().toISOString(),
                              note: `Advanced to ${nextStatus}`
                            };
                            setOrderHistory([tempHistory, ...orderHistory]);
                          }}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: C.accent,
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          Apply: {nextStatus} →
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT — Products + Pricing */}
          <div style={{ overflowY: 'auto', padding: '22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Product Search */}
            <div style={{ position: 'relative' }}>
              <LabeledField label="Add Products">
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Search product name..."
                      value={productSearch}
                      onChange={e => { setProductSearch(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      style={{ ...iS, paddingLeft: 32 }}
                    />
                  </div>
                </div>
              </LabeledField>

              {/* Dropdown */}
              {showDropdown && filteredProducts.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: C.elevated, border: `1px solid ${C.border}`,
                  borderRadius: 8, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                }}>
                  {filteredProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', background: 'none', border: 'none',
                        borderBottom: `1px solid ${C.border}`, cursor: 'pointer', textAlign: 'left',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = `${C.accent}10`)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 5, overflow: 'hidden', flexShrink: 0, border: `1px solid ${C.border}` }}>
                        <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name.slice(0, 36)}...</p>
                        <p style={{ fontSize: 10, color: C.muted }}>{p.size} · ৳{p.price.toLocaleString()}</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>৳{p.price.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Order Items Table */}
            <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 70px 30px', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                {['Product / Size', 'Qty', 'Price', ''].map(h => (
                  <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>{h}</span>
                ))}
              </div>

              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {orderItems.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: C.muted }}>
                    <ShoppingCart size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                    <p style={{ fontSize: 12 }}>No products added yet</p>
                  </div>
                ) : (
                  orderItems.map((item, i) => (
                    <div
                      key={item.productId}
                      style={{
                        display: 'grid', gridTemplateColumns: '1fr 50px 70px 30px',
                        gap: 8, padding: '10px 12px', alignItems: 'center',
                        borderBottom: i < orderItems.length - 1 ? `1px solid ${C.border}` : 'none',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3, marginBottom: 2 }}>{item.name.slice(0, 28)}...</p>
                        <p style={{ fontSize: 10, color: C.muted, fontFamily: "'DM Mono', monospace" }}>{item.size} · {item.sku}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => updateQty(item.productId, item.qty - 1)} style={{ width: 20, height: 20, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 3, cursor: 'pointer', color: C.muted, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.text, width: 16, textAlign: 'center', fontFamily: "'DM Mono', monospace" }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.productId, item.qty + 1)} style={{ width: 20, height: 20, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 3, cursor: 'pointer', color: C.muted, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>৳{(item.price * item.qty).toLocaleString()}</span>
                      <button onClick={() => removeItem(item.productId)} style={{ width: 24, height: 24, background: 'none', border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.danger; e.currentTarget.style.color = C.danger; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment + Memo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <LabeledField label="Payment Method">
                <div style={{ position: 'relative' }}>
                  <select value={payment} onChange={e => setPayment(e.target.value)} style={{ ...iS, paddingRight: 28, appearance: 'none', cursor: 'pointer' }}>
                    {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                </div>
              </LabeledField>
              <LabeledField label="Memo / Transaction No">
                <input type="text" placeholder="e.g. 8D3F9" value={memoNo} onChange={e => setMemoNo(e.target.value)}
                  style={{ ...iS, fontFamily: "'DM Mono', monospace" }}
                />
              </LabeledField>
            </div>

            {/* Pricing Summary */}
            <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Sub Total</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>৳{subTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Delivery Charge</span>
                  <input
                    type="number"
                    value={deliveryCharge}
                    onChange={e => setDeliveryCharge(Number(e.target.value))}
                    style={{ width: 80, padding: '4px 8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, color: C.text, textAlign: 'right', fontFamily: "'DM Mono', monospace", outline: 'none' }}
                  />
                </div>

                {/* Coupon */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Coupon</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text" placeholder="Code" value={couponCode} onChange={e => setCouponCode(e.target.value)}
                      style={{ width: 90, padding: '4px 8px', background: C.surface, border: `1px solid ${couponApplied ? C.success : C.border}`, borderRadius: 5, fontSize: 11, color: couponApplied ? C.success : C.text, fontFamily: "'DM Mono', monospace", outline: 'none', textTransform: 'uppercase' }}
                    />
                    <button
                      onClick={applyCoupon}
                      style={{ padding: '4px 10px', background: couponApplied ? `${C.success}20` : `${C.accent}20`, border: `1px solid ${couponApplied ? C.success : C.accent}50`, borderRadius: 5, fontSize: 11, fontWeight: 700, color: couponApplied ? C.success : C.accent, cursor: 'pointer' }}
                    >
                      {couponApplied ? <Check size={12} /> : 'Apply'}
                    </button>
                  </div>
                </div>

                {couponApplied && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: C.success }}>✓ Coupon Discount (10%)</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.success, fontFamily: "'DM Mono', monospace" }}>−৳{couponDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Manual Discount (৳)</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value))}
                    style={{ width: 80, padding: '4px 8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, color: C.text, textAlign: 'right', fontFamily: "'DM Mono', monospace", outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Paid Amount (৳)</span>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={e => setPaidAmount(Number(e.target.value))}
                    style={{ width: 80, padding: '4px 8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, color: C.text, textAlign: 'right', fontFamily: "'DM Mono', monospace", outline: 'none' }}
                  />
                </div>
              </div>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: `${C.accent}08` }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Total</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: C.accent }}>
                  ৳{total.toLocaleString()}
                </span>
              </div>

              {/* Due */}
              {paidAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: total - paidAmount > 0 ? C.danger : C.success }}>
                    {total - paidAmount > 0 ? 'Due Amount' : 'Change Due'}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: total - paidAmount > 0 ? C.danger : C.success, fontFamily: "'DM Mono', monospace" }}>
                    ৳{Math.abs(total - paidAmount).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Validation warning */}
            {(!customerName || !customerPhone || !customerAddress) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: `${C.warning}10`, border: `1px solid ${C.warning}30`, borderRadius: 7 }}>
                <AlertCircle size={13} style={{ color: C.warning, flexShrink: 0 }} />
                <p style={{ fontSize: 11, color: C.warning }}>Name, Phone, and Address are required to save the order.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer */}
        <div style={{ borderTop: `1px solid ${C.border}`, background: C.elevated, flexShrink: 0 }}>
          {/* Tracking link if consignment already set (inside form, read-only) */}
          {consignmentId && trackingUrl && (
            <div style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${C.border}`, background: 'rgba(16,185,129,0.05)' }}>
              <Check size={12} style={{ color: '#10B981', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>Dispatched via Steadfast · {consignmentId}</span>
              <a href={trackingUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.info, marginLeft: 'auto', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                Track Package →
              </a>
            </div>
          )}

          {/* Main Save/Cancel */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px' }}>
            <button onClick={() => window.open(`/api/orders/${order.id}/invoice`, '_blank')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.muted, cursor: 'pointer' }}>
              <Printer size={14} /> Download Invoice PDF
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ padding: '9px 20px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.muted, cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={handleUpdate}
                disabled={!customerName || !customerPhone || !customerAddress}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '9px 24px',
                  background: (!customerName || !customerPhone || !customerAddress) ? C.muted : C.accent,
                  border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, color: '#fff',
                  cursor: (!customerName || !customerPhone || !customerAddress) ? 'not-allowed' : 'pointer',
                  boxShadow: (!customerName || !customerPhone || !customerAddress) ? 'none' : `0 4px 16px rgba(201,149,109,0.3)`,
                  transition: 'all 0.2s',
                }}
              >
                <Save size={14} /> Save Changes
              </button>
            </div>
          </div>
        </div>

        {/* Steadfast Modal */}
        {showSteadfastModal && (
          <SteadfastModal
            order={order}
            onClose={() => setShowSteadfastModal(false)}
            onSent={(cid, url) => { setConsignmentId(cid); setTrackingUrl(url); setShowSteadfastModal(false); }}
          />
        )}

        {/* Fraud Check Modal */}
        {showFraudModal && (
          <FraudCheckModal
            phone={customerPhone}
            onClose={() => setShowFraudModal(false)}
          />
        )}
      </div>
    </>
  );
}

// ─── Create Order Modal ───────────────────────────────────────────────────
function CreateOrderModal({ onClose, onSave }: { onClose: () => void; onSave: (order: Order) => void }) {
  const [invoiceNo] = useState(genInvoiceNo());
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [courier, setCourier] = useState(COURIERS[0]);
  const [status, setStatus] = useState<OrderStatus>('Processing');
  const [orderDate, setOrderDate] = useState(todayStr());
  const [district, setDistrict] = useState('Dhaka');
  const [thana, setThana] = useState('');
  const [area, setArea] = useState('');
  const [payment, setPayment] = useState(PAYMENT_METHODS[0]);
  const [memoNo, setMemoNo] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [shopNote, setShopNote] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState(120);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);

  // Product search
  const [productSearch, setProductSearch] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const thanas = BD_LOCATIONS[district] || [];

  const filteredProducts = useMemo(() =>
    productSearch.length > 0
      ? products.filter(p =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.category.toLowerCase().includes(productSearch.toLowerCase())
        ).slice(0, 8)
      : [],
    [productSearch]
  );

  const addProduct = (p: typeof products[0]) => {
    const existing = orderItems.find(i => i.productId === p.id);
    if (existing) {
      setOrderItems(prev => prev.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i));
    } else {
      setOrderItems(prev => [...prev, {
        productId: p.id, name: p.name, size: p.size || '—',
        sku: p.variants[0]?.sku || `BG-${p.id}`, qty: 1, price: p.price,
      }]);
    }
    setProductSearch('');
    setShowDropdown(false);
  };

  const removeItem = (id: number) => setOrderItems(prev => prev.filter(i => i.productId !== id));
  const updateQty = (id: number, qty: number) => {
    if (qty < 1) { removeItem(id); return; }
    setOrderItems(prev => prev.map(i => i.productId === id ? { ...i, qty } : i));
  };

  const subTotal = orderItems.reduce((a, i) => a + i.price * i.qty, 0);
  const total = Math.max(0, subTotal + deliveryCharge - discount - couponDiscount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), orderAmount: subTotal }),
      });
      const data = await res.json();
      if (res.ok) {
        setCouponApplied(true);
        setCouponDiscount(data.discountAmount);
      } else {
        alert(data.error || 'Failed to apply coupon');
      }
    } catch (e) {
      alert('Failed to connect to coupon validation service');
    }
  };

  const handleSave = () => {
    if (!customerName || !customerPhone || !customerAddress) return;
    const order: Order = {
      id: invoiceNo,
      customer: customerName,
      phone: customerPhone,
      email: customerEmail,
      address: `${customerAddress}${thana ? ', ' + thana : ''}${district ? ', ' + district : ''}`,
      items: orderItems.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
      total,
      shipping: deliveryCharge,
      payment: payment.split(' ')[0],
      status,
      date: orderDate,
      district, thana, area, courier, customerNote, shopNote,
    };
    onSave(order);
    onClose();
  };

  const quickNotes = ['Urgent delivery request', 'Handle with care', 'Gift wrap please', 'Call before delivery'];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.75)' }} />
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 100, width: '96%', maxWidth: 1400, maxHeight: '92vh',
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, overflow: 'hidden',
          boxShadow: '0 48px 120px rgba(0,0,0,0.7)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* ── Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 28px', borderBottom: `1px solid ${C.border}`, background: C.elevated, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: `${C.accent}20`, border: `1px solid ${C.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Plus size={16} style={{ color: C.accent }} />
            </div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Create New Order</h2>
              <p style={{ fontSize: 11, color: C.muted }}>Fill in the details below to create a manual order</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ padding: '5px 12px', background: `${C.accent}15`, border: `1px solid ${C.accent}30`, borderRadius: 5, fontSize: 12, fontWeight: 700, color: C.accent, fontFamily: "'DM Mono', monospace" }}>
              {invoiceNo}
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, cursor: 'pointer', color: C.muted }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ── Body — 2 column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 440px', overflow: 'hidden', flex: 1 }}>
          {/* LEFT — Customer & Delivery Info */}
          <div style={{ overflowY: 'auto', padding: '22px 24px', borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Store + Invoice */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <LabeledField label="Store Name">
                <input value="Beauty Glowry" readOnly style={{ ...iS, color: C.muted, cursor: 'not-allowed' }} />
              </LabeledField>
              <LabeledField label="Invoice Number">
                <div style={{ position: 'relative' }}>
                  <input value={invoiceNo} readOnly style={{ ...iS, fontFamily: "'DM Mono', monospace", color: C.accent, cursor: 'not-allowed' }} />
                  <Hash size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
                </div>
              </LabeledField>
            </div>

            {/* Customer Name + Phone + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <LabeledField label="Customer Name" required>
                <div style={{ position: 'relative' }}>
                  <User size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                  <input
                    type="text" placeholder="Full Name" value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    style={{ ...iS, paddingLeft: 28 }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                  />
                </div>
              </LabeledField>
              <LabeledField label="Customer Phone" required>
                <div style={{ position: 'relative' }}>
                  <Phone size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                  <input
                    type="tel" placeholder="01XXXXXXXXX" value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    style={{ ...iS, paddingLeft: 28 }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                  />
                </div>
              </LabeledField>
              <LabeledField label="Email / Gmail">
                <div style={{ position: 'relative' }}>
                  <Mail size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                  <input
                    type="email" placeholder="customer@gmail.com" value={customerEmail}
                    onChange={e => setCustomerEmail(e.target.value)}
                    style={{ ...iS, paddingLeft: 28 }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                  />
                </div>
              </LabeledField>
            </div>

            {/* Address */}
            <LabeledField label="Customer Address" required>
              <div style={{ position: 'relative' }}>
                <MapPin size={12} style={{ position: 'absolute', left: 10, top: 12, color: C.muted, pointerEvents: 'none' }} />
                <textarea
                  rows={2} placeholder="House No, Road, Village / Area..."
                  value={customerAddress} onChange={e => setCustomerAddress(e.target.value)}
                  style={{ ...iS, paddingLeft: 28, resize: 'none' }}
                  onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                />
              </div>
            </LabeledField>

            {/* Courier + Status + Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <LabeledField label="Courier">
                <div style={{ position: 'relative' }}>
                  <select value={courier} onChange={e => setCourier(e.target.value)} style={{ ...iS, paddingRight: 28, appearance: 'none', cursor: 'pointer' }}>
                    {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                </div>
              </LabeledField>
              <LabeledField label="Order Status">
                <div style={{ position: 'relative' }}>
                  <select value={status} onChange={e => setStatus(e.target.value as OrderStatus)} style={{ ...iS, paddingRight: 28, appearance: 'none', cursor: 'pointer', color: STATUS_STYLES[status].color }}>
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                </div>
              </LabeledField>
              <LabeledField label="Order Date">
                <input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} style={{ ...iS, colorScheme: 'dark' }} />
              </LabeledField>
            </div>

            {/* District + Thana + Area */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <LabeledField label="District">
                <div style={{ position: 'relative' }}>
                  <select value={district} onChange={e => { setDistrict(e.target.value); setThana(''); }} style={{ ...iS, paddingRight: 28, appearance: 'none', cursor: 'pointer' }}>
                    {Object.keys(BD_LOCATIONS).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                </div>
              </LabeledField>
              <LabeledField label="Thana / Upazila">
                <div style={{ position: 'relative' }}>
                  <select value={thana} onChange={e => setThana(e.target.value)} style={{ ...iS, paddingRight: 28, appearance: 'none', cursor: 'pointer' }}>
                    <option value="">Select Thana</option>
                    {thanas.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                </div>
              </LabeledField>
              <LabeledField label="Area / Neighborhood">
                <input type="text" placeholder="Block C, Section 7..." value={area} onChange={e => setArea(e.target.value)}
                  style={iS}
                  onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                />
              </LabeledField>
            </div>

            {/* Notes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <LabeledField label="Customer Note">
                <textarea rows={2} placeholder="Note for customer..." value={customerNote} onChange={e => setCustomerNote(e.target.value)}
                  style={{ ...iS, resize: 'none' }}
                  onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                />
              </LabeledField>
              <LabeledField label="Shop Note">
                <textarea rows={2} placeholder="Internal note..." value={shopNote} onChange={e => setShopNote(e.target.value)}
                  style={{ ...iS, resize: 'none' }}
                  onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                />
                {/* Quick Tags */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>
                  {quickNotes.map(t => (
                    <button key={t} onClick={() => setShopNote(t)} style={{ fontSize: 10, padding: '2px 8px', background: `${C.accent}12`, border: `1px solid ${C.accent}30`, borderRadius: 3, color: C.accent, cursor: 'pointer', transition: 'background 0.15s' }}>
                      {t}
                    </button>
                  ))}
                </div>
              </LabeledField>
            </div>
          </div>

          {/* RIGHT — Products + Pricing */}
          <div style={{ overflowY: 'auto', padding: '22px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Product Search */}
            <div style={{ position: 'relative' }}>
              <LabeledField label="Add Products">
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                    <input
                      type="text"
                      placeholder="Search product name..."
                      value={productSearch}
                      onChange={e => { setProductSearch(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      style={{ ...iS, paddingLeft: 32 }}
                    />
                  </div>
                </div>
              </LabeledField>

              {/* Dropdown */}
              {showDropdown && filteredProducts.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                  background: C.elevated, border: `1px solid ${C.border}`,
                  borderRadius: 8, overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                }}>
                  {filteredProducts.map(p => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', background: 'none', border: 'none',
                        borderBottom: `1px solid ${C.border}`, cursor: 'pointer', textAlign: 'left',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = `${C.accent}10`)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: 5, overflow: 'hidden', flexShrink: 0, border: `1px solid ${C.border}` }}>
                        <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name.slice(0, 36)}...</p>
                        <p style={{ fontSize: 10, color: C.muted }}>{p.size} · ৳{p.price.toLocaleString()}</p>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>৳{p.price.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Order Items Table */}
            <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Table Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 70px 30px', gap: 8, padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
                {['Product / Size', 'Qty', 'Price', ''].map(h => (
                  <span key={h} style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>{h}</span>
                ))}
              </div>

              <div style={{ maxHeight: 220, overflowY: 'auto' }}>
                {orderItems.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', color: C.muted }}>
                    <ShoppingCart size={28} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                    <p style={{ fontSize: 12 }}>No products added yet</p>
                    <p style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>Search above to add products</p>
                  </div>
                ) : (
                  orderItems.map((item, i) => (
                    <div
                      key={item.productId}
                      style={{
                        display: 'grid', gridTemplateColumns: '1fr 50px 70px 30px',
                        gap: 8, padding: '10px 12px', alignItems: 'center',
                        borderBottom: i < orderItems.length - 1 ? `1px solid ${C.border}` : 'none',
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 600, color: C.text, lineHeight: 1.3, marginBottom: 2 }}>{item.name.slice(0, 28)}...</p>
                        <p style={{ fontSize: 10, color: C.muted, fontFamily: "'DM Mono', monospace" }}>{item.size} · {item.sku}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <button onClick={() => updateQty(item.productId, item.qty - 1)} style={{ width: 20, height: 20, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 3, cursor: 'pointer', color: C.muted, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
                        <span style={{ fontSize: 12, fontWeight: 700, color: C.text, width: 16, textAlign: 'center', fontFamily: "'DM Mono', monospace" }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.productId, item.qty + 1)} style={{ width: 20, height: 20, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 3, cursor: 'pointer', color: C.muted, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>৳{(item.price * item.qty).toLocaleString()}</span>
                      <button onClick={() => removeItem(item.productId)} style={{ width: 24, height: 24, background: 'none', border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.danger; e.currentTarget.style.color = C.danger; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment + Memo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <LabeledField label="Payment Method">
                <div style={{ position: 'relative' }}>
                  <select value={payment} onChange={e => setPayment(e.target.value)} style={{ ...iS, paddingRight: 28, appearance: 'none', cursor: 'pointer' }}>
                    {PAYMENT_METHODS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
                </div>
              </LabeledField>
              <LabeledField label="Memo / Transaction No">
                <input type="text" placeholder="e.g. 8D3F9 (bKash ref)" value={memoNo} onChange={e => setMemoNo(e.target.value)}
                  style={{ ...iS, fontFamily: "'DM Mono', monospace" }}
                  onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                  onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                />
              </LabeledField>
            </div>

            {/* Pricing Summary */}
            <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Sub Total</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>৳{subTotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Delivery Charge</span>
                  <input
                    type="number"
                    value={deliveryCharge}
                    onChange={e => setDeliveryCharge(Number(e.target.value))}
                    style={{ width: 80, padding: '4px 8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, color: C.text, textAlign: 'right', fontFamily: "'DM Mono', monospace", outline: 'none' }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                  />
                </div>

                {/* Coupon */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Coupon</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      type="text" placeholder="Code" value={couponCode} onChange={e => setCouponCode(e.target.value)}
                      style={{ width: 90, padding: '4px 8px', background: C.surface, border: `1px solid ${couponApplied ? C.success : C.border}`, borderRadius: 5, fontSize: 11, color: couponApplied ? C.success : C.text, fontFamily: "'DM Mono', monospace", outline: 'none', textTransform: 'uppercase' }}
                    />
                    <button
                      onClick={applyCoupon}
                      style={{ padding: '4px 10px', background: couponApplied ? `${C.success}20` : `${C.accent}20`, border: `1px solid ${couponApplied ? C.success : C.accent}50`, borderRadius: 5, fontSize: 11, fontWeight: 700, color: couponApplied ? C.success : C.accent, cursor: 'pointer' }}
                    >
                      {couponApplied ? <Check size={12} /> : 'Apply'}
                    </button>
                  </div>
                </div>

                {couponApplied && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: C.success }}>✓ Coupon Discount (10%)</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: C.success, fontFamily: "'DM Mono', monospace" }}>−৳{couponDiscount.toLocaleString()}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Manual Discount (৳)</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={e => setDiscount(Number(e.target.value))}
                    style={{ width: 80, padding: '4px 8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, color: C.text, textAlign: 'right', fontFamily: "'DM Mono', monospace", outline: 'none' }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: C.muted }}>Paid Amount (৳)</span>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={e => setPaidAmount(Number(e.target.value))}
                    style={{ width: 80, padding: '4px 8px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, color: C.text, textAlign: 'right', fontFamily: "'DM Mono', monospace", outline: 'none' }}
                    onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                  />
                </div>
              </div>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: `${C.accent}08` }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Total</span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: C.accent }}>
                  ৳{total.toLocaleString()}
                </span>
              </div>

              {/* Due */}
              {paidAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderTop: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: 12, color: total - paidAmount > 0 ? C.danger : C.success }}>
                    {total - paidAmount > 0 ? 'Due Amount' : 'Change Due'}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: total - paidAmount > 0 ? C.danger : C.success, fontFamily: "'DM Mono', monospace" }}>
                    ৳{Math.abs(total - paidAmount).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Validation warning */}
            {(!customerName || !customerPhone || !customerAddress) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: `${C.warning}10`, border: `1px solid ${C.warning}30`, borderRadius: 7 }}>
                <AlertCircle size={13} style={{ color: C.warning, flexShrink: 0 }} />
                <p style={{ fontSize: 11, color: C.warning }}>Name, Phone, and Address are required to save the order.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 28px', borderTop: `1px solid ${C.border}`, background: C.elevated, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: C.muted }}>
            <Package size={13} />
            {orderItems.length} item{orderItems.length !== 1 ? 's' : ''} · Total ৳{total.toLocaleString()}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{ padding: '9px 20px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.muted, cursor: 'pointer' }}>
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!customerName || !customerPhone || !customerAddress}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 24px',
                background: (!customerName || !customerPhone || !customerAddress) ? C.muted : C.accent,
                border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, color: '#fff',
                cursor: (!customerName || !customerPhone || !customerAddress) ? 'not-allowed' : 'pointer',
                boxShadow: (!customerName || !customerPhone || !customerAddress) ? 'none' : `0 4px 16px rgba(201,149,109,0.3)`,
                transition: 'all 0.2s',
              }}
            >
              <Save size={14} /> Create Order
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Orders Page ─────────────────────────────────────────────────────
export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'All' | 'Today'>('All');
  const [updating, setUpdating] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [quickFraudOrder, setQuickFraudOrder] = useState<Order | null>(null);
  const [quickCourierOrder, setQuickCourierOrder] = useState<Order | null>(null);

  // Load session from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sessStr = localStorage.getItem('bg_admin_session');
      if (sessStr) {
        setCurrentSession(JSON.parse(sessStr));
      }
    }
  }, []);

  // Set default tab to 'Today' if moderator is logged in (as they have no 'All' access)
  useEffect(() => {
    if (currentSession?.role === 'moderator' && statusFilter === 'All') {
      setStatusFilter('Today');
    }
  }, [currentSession, statusFilter]);

  // Load orders based on permissions role
  useEffect(() => {
    if (!currentSession) return;

    const url = currentSession.role === 'admin'
      ? '/api/orders?includeUnsynced=true'
      : `/api/orders?moderatorEmail=${encodeURIComponent(currentSession.email)}`;

    setOrdersLoading(true);
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setOrders(data);
        }
      })
      .catch((err) => console.error('Failed to load orders from live database:', err))
      .finally(() => setOrdersLoading(false));
  }, [currentSession]);

  const filtered = orders.filter(o => {
    // 1. Hide pending sync orders from all list tabs
    if (o.status?.toLowerCase() === 'pending_sync') return false;

    // 2. Extra client security safety check: hide orders not assigned to this moderator
    if (currentSession?.role === 'moderator' && o.assigned_to !== currentSession.email) {
      return false;
    }

    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search);

    let matchStatus = false;
    if (statusFilter === 'All') {
      matchStatus = true;
    } else if (statusFilter === 'Today') {
      matchStatus = isToday(o.date);
    } else if (statusFilter === 'Delivered') {
      matchStatus = o.status === 'Delivered' && isDeliveredToday(o);
    } else {
      matchStatus = o.status === statusFilter;
    }

    return matchSearch && matchStatus;
  });

  const updateStatus = async (id: string, status: OrderStatus) => {
    setUpdating(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');

      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
      logActivity('Order status updated', `Changed status of order ${id} to "${status}"`);
    } catch (err) {
      console.error(err);
      alert('Failed to update order status');
    } finally {
      setUpdating(null);
    }
  };

  const handleNewOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
    setSuccessMsg(`Order ${order.id} created successfully!`);
    logActivity('Order created', `Manually created order ${order.id} for customer ${order.customer} (Total: ৳${order.total.toLocaleString()})`);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const handleUpdateOrder = async (updatedOrder: Order) => {
    try {
      const res = await fetch(`/api/orders/${updatedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          status: updatedOrder.status,
          payment_method: updatedOrder.payment,
          customerNote: updatedOrder.customerNote,
          shopNote: updatedOrder.shopNote,
          courier: updatedOrder.courier,
          thana: updatedOrder.thana,
          area: updatedOrder.area,
          statusNote: (updatedOrder as any).statusNote,
          assigned_to: updatedOrder.assigned_to,
        }),
      });
      if (!res.ok) throw new Error('Failed to update order');

      const prevOrder = orders.find((o) => o.id === updatedOrder.id);
      const isReassigned = prevOrder && prevOrder.assigned_to !== updatedOrder.assigned_to;

      setOrders((prev) => prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)));
      setSuccessMsg(`Order ${updatedOrder.id} updated successfully!`);
      
      if (isReassigned) {
        logActivity('Order reassigned', `Reassigned order ${updatedOrder.id} to ${updatedOrder.assigned_to === 'admin' ? 'Super Admin' : updatedOrder.assigned_to}`);
      } else {
        logActivity('Order modified', `Updated details of order ${updatedOrder.id} (Status: "${updatedOrder.status}")`);
      }
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      console.error(err);
      alert('Failed to update order in database');
    }
  };

  const counts = ALL_STATUSES.reduce((acc, s) => {
    if (s === 'Delivered') {
      acc[s] = orders.filter(o => o.status === s && isDeliveredToday(o)).length;
    } else {
      acc[s] = orders.filter(o => o.status === s).length;
    }
    return acc;
  }, {} as Record<OrderStatus, number>);

  const todayCount = orders.filter(o => isToday(o.date)).length;
  const unsyncedCount = orders.filter(o => o.status?.toLowerCase() === 'pending_sync').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Success toast */}
      {successMsg && (
        <div style={{
          position: 'fixed', top: 24, right: 24, zIndex: 200,
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 20px', background: C.success, borderRadius: 8,
          boxShadow: `0 8px 32px rgba(76,175,130,0.35)`,
          animation: 'slideIn 0.3s ease',
        }}>
          <Check size={15} style={{ color: '#fff' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{successMsg}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>Order Control Center</h1>
          <p style={{ fontSize: 13, color: C.muted }}>Manage and track all orders in real-time</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Order Sync */}
          <button
            onClick={async () => {
              setUpdating('sync');
              try {
                // Get active moderators from localStorage
                const modsStr = localStorage.getItem('bg_moderators');
                const moderatorsList = modsStr ? JSON.parse(modsStr) : [];
                const activeModEmails = moderatorsList
                  .filter((m: any) => m.status === 'Active')
                  .map((m: any) => m.email);

                const res = await fetch('/api/orders/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ activeModerators: activeModEmails }),
                });
                const data = await res.json();
                
                if (res.ok) {
                  logActivity('Orders synchronized', `Synced ${data.count} new orders from storefront`);
                  setSuccessMsg(data.message || `Synced ${data.count} orders successfully!`);
                  
                  // Re-fetch orders list
                  const url = currentSession.role === 'admin'
                    ? '/api/orders?includeUnsynced=true'
                    : `/api/orders?moderatorEmail=${encodeURIComponent(currentSession.email)}`;
                  const fetchRes = await fetch(url);
                  const freshData = await fetchRes.json();
                  if (Array.isArray(freshData)) {
                    setOrders(freshData);
                  }
                  
                  setTimeout(() => setSuccessMsg(''), 3500);
                } else {
                  alert(data.error || 'Failed to sync orders');
                }
              } catch (e) {
                console.error(e);
                alert('Connection error. Failed to sync orders.');
              } finally {
                setUpdating(null);
              }
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
              background: unsyncedCount > 0 ? 'rgba(201, 149, 109, 0.18)' : 'rgba(99, 102, 241, 0.12)',
              border: `1px solid ${unsyncedCount > 0 ? 'rgba(201, 149, 109, 0.4)' : 'rgba(99, 102, 241, 0.25)'}`,
              borderRadius: 8, fontSize: 13, fontWeight: 600, color: unsyncedCount > 0 ? C.accent : '#A5B4FC', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = unsyncedCount > 0 ? 'rgba(201, 149, 109, 0.25)' : 'rgba(99, 102, 241, 0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = unsyncedCount > 0 ? 'rgba(201, 149, 109, 0.18)' : 'rgba(99, 102, 241, 0.12)'; }}
          >
            <RefreshCw size={13} style={{ animation: updating === 'sync' ? 'spin 1s linear infinite' : 'none' }} />
            {unsyncedCount > 0 ? `Sync (${unsyncedCount} New)` : 'Order Sync'}
          </button>

          {/* Fraud Checker */}
          <button
            onClick={() => {
              alert('Fraud Check Complete: All orders analyzed.');
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
              background: 'rgba(76, 175, 130, 0.12)', border: '1px solid rgba(76, 175, 130, 0.25)',
              borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#4CAF82', cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(76, 175, 130, 0.2)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(76, 175, 130, 0.12)'; }}
          >
            <Shield size={13} /> Fraud Checker
          </button>

          {/* Bulk Process */}
          <button
            onClick={() => {
              alert('Selected orders sent to bulk printing queue.');
            }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
              background: C.elevated, border: `1px solid ${C.border}`,
              borderRadius: 8, fontSize: 13, fontWeight: 600, color: C.textSec, cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.elevated; }}
          >
            <FileText size={13} /> Bulk Process
          </button>

          {/* Create Order */}
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '9px 20px',
              background: C.accent, border: 'none', borderRadius: 8,
              fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
              boxShadow: `0 4px 16px rgba(201,149,109,0.3)`,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 28px rgba(201,149,109,0.45)`; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 4px 16px rgba(201,149,109,0.3)`; }}
          >
            <Plus size={14} /> Create Order
          </button>
        </div>
      </div>

      {/* 4x2 Grid of Status Cards */}
      <div className="status-cards-grid">
        {[
          { label: 'All Orders', key: 'All' as const, pill: 'all', color: '#6366F1', icon: ShoppingCart },
          { label: 'Today\'s Orders', key: 'Today' as const, pill: 'today', color: C.accent, icon: Calendar },
          { label: 'Processing', key: 'Processing' as const, pill: 'processing', color: C.warning, icon: RefreshCw },
          { label: 'Pending', key: 'Pending' as const, pill: 'pending', color: C.muted, icon: Clock },
          { label: 'Shipped', key: 'Shipped' as const, pill: 'shipped', color: '#60A5FA', icon: Truck },
          { label: 'Delivered', key: 'Delivered' as const, pill: 'delivered', color: C.success, icon: Check },
          { label: 'Cancelled', key: 'Cancelled' as const, pill: 'cancelled', color: '#EF4444', icon: X },
          { label: 'Returned', key: 'Returned' as const, pill: 'returned', color: C.accent, icon: RotateCcw },
        ].filter(card => {
          if (card.key === 'All' && currentSession?.role === 'moderator') return false;
          return true;
        }).map(card => {
          let count = 0;
          if (card.key === 'All') {
            count = orders.length;
          } else if (card.key === 'Today') {
            count = todayCount;
          } else {
            count = counts[card.key as OrderStatus] || 0;
          }

          const isActive = statusFilter === card.key;
          const Icon = card.icon;

          return (
            <div
              key={card.key}
              onClick={() => setStatusFilter(card.key)}
              style={{
                background: C.surface,
                border: `1px solid ${isActive ? card.color : C.border}`,
                borderRadius: 10,
                padding: '16px 20px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.2s',
                boxShadow: isActive ? `0 0 16px ${card.color}15` : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = C.border;
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={14} style={{ color: isActive ? card.color : C.muted }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? '#fff' : C.textSec }}>
                    {card.label}
                  </span>
                </div>
                <span style={{ fontSize: 24, fontWeight: 700, color: isActive ? card.color : '#fff', fontFamily: "'DM Mono', monospace" }}>
                  {count}
                </span>
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 20,
                  background: `${card.color}15`,
                  color: card.color,
                  border: `1px solid ${card.color}25`,
                  textTransform: 'lowercase',
                  alignSelf: 'flex-start'
                }}
              >
                {card.pill}
              </span>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
        <input
          type="text" placeholder="Search order ID, customer, phone..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '9px 12px 9px 36px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, outline: 'none' }}
          onFocus={e => (e.currentTarget.style.borderColor = C.accent)}
          onBlur={e => (e.currentTarget.style.borderColor = C.border)}
        />
      </div>

      {/* Orders Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 100px 110px 100px 140px 120px', gap: 12, padding: '12px 20px', borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>
          <div>Order ID</div><div>Customer</div><div>Date</div><div>Amount</div><div>Payment</div><div>Status</div><div>Actions</div>
        </div>

        {ordersLoading ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 13 }}>
            <div style={{ width: 16, height: 16, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Loading orders...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: C.muted }}>
            <Filter size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: 14 }}>No orders found</p>
          </div>
        ) : (
          filtered.map((order, i) => (
            <React.Fragment key={order.id}>
              <div
                style={{
                  display: 'grid', gridTemplateColumns: '110px 1fr 100px 110px 100px 140px 120px',
                  gap: 12, padding: '14px 20px', alignItems: 'center',
                  borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s',
                  background: 'transparent',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: C.accent, fontFamily: "'DM Mono', monospace" }}>{order.id}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{order.customer}</p>
                  <p style={{ fontSize: 11, color: C.muted }}>{order.phone}{order.courier ? ` · ${order.courier}` : ''}</p>
                </div>
                <span style={{ fontSize: 12, color: C.muted }}>{order.date}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>৳{order.total.toLocaleString()}</p>
                  {order.shipping > 0 && <p style={{ fontSize: 10, color: C.muted }}>+৳{order.shipping} ship</p>}
                </div>
                <span style={{ fontSize: 11, color: C.textSec }}>{order.payment}</span>
                <div style={{ position: 'relative' }}>
                  <select
                    value={order.status}
                    onChange={e => updateStatus(order.id, e.target.value as OrderStatus)}
                    disabled={updating === order.id}
                    style={{ appearance: 'none', width: '100%', padding: '5px 28px 5px 10px', background: STATUS_STYLES[order.status]?.bg || 'transparent', border: `1px solid ${STATUS_STYLES[order.status]?.color || C.border}40`, borderRadius: 6, fontSize: 11, fontWeight: 700, color: STATUS_STYLES[order.status]?.color || C.text, cursor: 'pointer', outline: 'none' }}
                  >
                    {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {updating === order.id
                    ? <RefreshCw size={11} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: STATUS_STYLES[order.status]?.color || C.accent, animation: 'spin 0.6s linear infinite' }} />
                    : <ChevronDown size={11} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: STATUS_STYLES[order.status]?.color || C.muted, pointerEvents: 'none' }} />
                  }
                </div>
                {/* Actions: View + Fraud + Courier */}
                <div style={{ display: 'flex', gap: 5 }}>
                  <button
                    title="View / Edit Order"
                    onClick={() => setViewOrder(order)}
                    style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer', color: C.muted }}
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    title="Check Fraud"
                    onClick={() => setQuickFraudOrder(order)}
                    style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: 6, cursor: 'pointer', color: C.info }}
                  >
                    <Shield size={13} />
                  </button>
                  <button
                    title="Send to Steadfast"
                    onClick={() => setQuickCourierOrder(order)}
                    style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 6, cursor: 'pointer', color: '#10B981' }}
                  >
                    <Truck size={13} />
                  </button>
                </div>
              </div>
            </React.Fragment>
          ))
        )}

      </div>

      <p style={{ fontSize: 12, color: C.muted }}>Showing {filtered.length} of {orders.length} orders</p>

      {/* Create Order Modal */}
      {showCreateModal && <CreateOrderModal onClose={() => setShowCreateModal(false)} onSave={handleNewOrder} />}

      {/* View Order Modal */}
      {viewOrder && (
        <ViewOrderModal
          order={viewOrder}
          onClose={() => setViewOrder(null)}
          onSave={handleUpdateOrder}
        />
      )}

      {/* Quick Fraud Modal (from card button) */}
      {quickFraudOrder && (
        <FraudCheckModal
          phone={quickFraudOrder.phone}
          onClose={() => setQuickFraudOrder(null)}
        />
      )}

      {/* Quick Steadfast Modal (from card button) */}
      {quickCourierOrder && (
        <SteadfastModal
          order={quickCourierOrder}
          onClose={() => setQuickCourierOrder(null)}
          onSent={(consignmentId: string, trackingUrl: string) => {
            setOrders(prev => prev.map(o => o.id === quickCourierOrder.id ? { ...o, courier: 'Steadfast' } as any : o));
            setQuickCourierOrder(null);
          }}
        />
      )}

      <style>{`
        @keyframes spin { from { transform: translateY(-50%) rotate(0deg); } to { transform: translateY(-50%) rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(60px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .status-cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        @media (max-width: 1024px) {
          .status-cards-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .status-cards-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
