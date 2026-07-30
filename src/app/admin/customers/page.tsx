'use client';

import React, { useState } from 'react';
import { Search, Mail, Phone, MapPin, ShoppingBag, Star, ChevronRight, X } from 'lucide-react';

const C = {
  surface: '#1A1A17', elevated: '#222220', border: 'rgba(255,255,255,0.07)',
  text: '#F0EBE3', textSec: '#B0A8A0', muted: '#7A7470',
  accent: '#C9956D', success: '#4CAF82', warning: '#F0A54B', danger: '#E05A5A',
};

interface Customer {
  id: number; name: string; email: string; phone: string;
  location: string; totalOrders: number; totalSpent: number;
  lastOrder: string; joinDate: string; skinType: string;
  orderHistory: { id: string; date: string; items: string; amount: number; status: string }[];
}

const CUSTOMERS: Customer[] = [
  { id: 1, name: 'Sumaiya Rahman', email: 'sumaiya@gmail.com', phone: '01711223344', location: 'Dhanmondi, Dhaka', totalOrders: 8, totalSpent: 12450, lastOrder: '2026-07-29', joinDate: '2024-01-15', skinType: 'Oily, Acne-Prone', orderHistory: [{ id: 'BG-9940', date: '2026-07-29', items: 'Niacinamide 10% + HA Serum', amount: 2400, status: 'Delivered' }, { id: 'BG-9880', date: '2026-07-10', items: 'Salicylic Acid Cleanser', amount: 750, status: 'Delivered' }] },
  { id: 2, name: 'Imtiaz Ahmed', email: 'imtiaz@outlook.com', phone: '01855667788', location: 'Gulshan-2, Dhaka', totalOrders: 5, totalSpent: 9800, lastOrder: '2026-07-29', joinDate: '2024-02-20', skinType: 'Dry, Sensitive', orderHistory: [{ id: 'BG-9939', date: '2026-07-29', items: 'Ceramide Barrier Cream ×2', amount: 3300, status: 'Shipped' }] },
  { id: 3, name: 'Afrin Jahan', email: 'afrin@yahoo.com', phone: '01966778899', location: 'Chittagong', totalOrders: 3, totalSpent: 4250, lastOrder: '2026-07-28', joinDate: '2024-04-05', skinType: 'Combination', orderHistory: [{ id: 'BG-9938', date: '2026-07-28', items: 'Centella Asiatica Essence', amount: 950, status: 'Processing' }] },
  { id: 4, name: 'Fahim Shahriar', email: 'fahim@gmail.com', phone: '01712345678', location: 'Sylhet', totalOrders: 2, totalSpent: 3700, lastOrder: '2026-07-28', joinDate: '2024-05-12', skinType: 'Normal', orderHistory: [{ id: 'BG-9937', date: '2026-07-28', items: 'Vitamin C 15% Emulsion', amount: 1850, status: 'Pending' }] },
  { id: 5, name: 'Nadia Islam', email: 'nadia@gmail.com', phone: '01611223344', location: 'Mirpur, Dhaka', totalOrders: 6, totalSpent: 7200, lastOrder: '2026-07-27', joinDate: '2024-03-01', skinType: 'Sensitive', orderHistory: [{ id: 'BG-9936', date: '2026-07-27', items: 'Salicylic Acid Cleanser ×2', amount: 1500, status: 'Pending' }] },
  { id: 6, name: 'Rahim Khan', email: 'rahim@gmail.com', phone: '01722334455', location: 'Uttara, Dhaka', totalOrders: 12, totalSpent: 22000, lastOrder: '2026-07-26', joinDate: '2023-11-10', skinType: 'Oily', orderHistory: [{ id: 'BG-9935', date: '2026-07-26', items: 'Niacinamide 10% Serum ×3', amount: 3750, status: 'Delivered' }] },
];

const STATUS_COLOR: Record<string, string> = {
  Delivered: '#4CAF82', Shipped: '#60A5FA', Processing: '#F0A54B', Pending: '#7A7470', Refunded: '#E05A5A',
};

function CustomerCard({ c, onClick }: { c: Customer; onClick: () => void }) {
  const initials = c.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
  return (
    <div
      onClick={onClick}
      style={{
        background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
        padding: 20, cursor: 'pointer', transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(201,149,109,0.35)';
        e.currentTarget.style.background = 'rgba(201,149,109,0.04)';
      }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.surface; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
        <div
          style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${C.accent}, #8B7050)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: '#fff', letterSpacing: '0.05em',
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 2 }}>{c.name}</p>
          <p style={{ fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
            <MapPin size={10} /> {c.location}
          </p>
        </div>
        <ChevronRight size={16} style={{ color: C.muted, flexShrink: 0 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        {[
          { label: 'Orders', value: c.totalOrders },
          { label: 'Spent', value: `৳${c.totalSpent.toLocaleString()}`, mono: true },
          { label: 'Last Order', value: c.lastOrder.split('-').slice(1).join('/') },
        ].map((stat) => (
          <div key={stat.label} style={{ textAlign: 'center', padding: '8px 4px', background: C.elevated, borderRadius: 7 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: stat.mono ? "'DM Mono', monospace" : undefined }}>{stat.value}</p>
            <p style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, display: 'flex', gap: 6 }}>
        <span style={{ fontSize: 10, padding: '3px 8px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 4, color: C.muted }}>
          {c.skinType}
        </span>
        {c.totalOrders >= 8 && (
          <span style={{ fontSize: 10, padding: '3px 8px', background: `${C.accent}15`, border: `1px solid ${C.accent}30`, borderRadius: 4, color: C.accent }}>
            ⭐ VIP
          </span>
        )}
      </div>
    </div>
  );
}

function CustomerModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const initials = customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.7)' }} />
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 100, width: '90%', maxWidth: 640, maxHeight: '85vh',
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 12, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '24px 28px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: `linear-gradient(135deg, ${C.accent}, #8B7050)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff' }}>
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>{customer.name}</h2>
            <p style={{ fontSize: 12, color: C.muted }}>Customer since {customer.joinDate} · {customer.skinType} skin</p>
          </div>
          <button onClick={onClose} style={{ padding: 8, background: 'none', border: 'none', cursor: 'pointer', color: C.muted }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 28px' }}>
          {/* Contact */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 24 }}>
            {[
              { icon: <Mail size={14} />, label: customer.email },
              { icon: <Phone size={14} />, label: customer.phone },
              { icon: <MapPin size={14} />, label: customer.location },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: C.elevated, borderRadius: 7 }}>
                <span style={{ color: '#7A7470' }}>{c.icon}</span>
                <span style={{ fontSize: 11, color: C.textSec, wordBreak: 'break-all' }}>{c.label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Total Orders', value: customer.totalOrders, icon: <ShoppingBag size={16} style={{ color: C.accent }} /> },
              { label: 'Total Spent', value: `৳${customer.totalSpent.toLocaleString()}`, icon: <Star size={16} style={{ color: C.warning }} /> },
              { label: 'Avg Order Value', value: `৳${Math.round(customer.totalSpent / customer.totalOrders).toLocaleString()}`, icon: <ShoppingBag size={16} style={{ color: C.success }} /> },
            ].map((s) => (
              <div key={s.label} style={{ background: C.elevated, borderRadius: 8, padding: '14px', textAlign: 'center' }}>
                <div style={{ marginBottom: 8 }}>{s.icon}</div>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>{s.value}</p>
                <p style={{ fontSize: 11, color: C.muted }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Order History */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>Order History</p>
            {customer.orderHistory.map((o) => (
              <div
                key={o.id}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: C.elevated, borderRadius: 7, marginBottom: 8 }}
              >
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.accent, fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>{o.id}</p>
                  <p style={{ fontSize: 11, color: C.muted }}>{o.items} · {o.date}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>৳{o.amount.toLocaleString()}</p>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: `${STATUS_COLOR[o.status]}18`, color: STATUS_COLOR[o.status], border: `1px solid ${STATUS_COLOR[o.status]}30` }}>
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminCustomers() {
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const filtered = CUSTOMERS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const totalRevenue = CUSTOMERS.reduce((a, c) => a + c.totalSpent, 0);
  const totalOrders = CUSTOMERS.reduce((a, c) => a + c.totalOrders, 0);
  const vipCount = CUSTOMERS.filter((c) => c.totalOrders >= 8).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>Customers</h1>
        <p style={{ fontSize: 13, color: C.muted }}>{CUSTOMERS.length} registered customers</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Customers', value: CUSTOMERS.length, color: C.accent },
          { label: 'Total Revenue', value: `৳${totalRevenue.toLocaleString()}`, color: '#60A5FA' },
          { label: 'Total Orders', value: totalOrders, color: C.success },
          { label: 'VIP Customers', value: vipCount, color: C.warning },
        ].map((s) => (
          <div key={s.label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9, padding: '16px 18px' }}>
            <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.value}</p>
            <p style={{ fontSize: 12, color: C.muted }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360 }}>
        <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
        <input
          type="text"
          placeholder="Search name, email, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: '100%', padding: '9px 12px 9px 36px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, outline: 'none' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
        />
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {filtered.map((c) => (
          <CustomerCard key={c.id} c={c} onClick={() => setSelectedCustomer(c)} />
        ))}
      </div>

      {/* Modal */}
      {selectedCustomer && <CustomerModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />}
    </div>
  );
}
