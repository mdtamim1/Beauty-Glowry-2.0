'use client';

import React, { useState, useEffect } from 'react';
import { Search, Mail, Phone, MapPin, ShoppingBag, Star, ChevronRight, X } from 'lucide-react';

const C = {
  surface: '#1A1A17', elevated: '#222220', border: 'rgba(255,255,255,0.07)',
  text: '#F0EBE3', textSec: '#B0A8A0', muted: '#7A7470',
  accent: '#C9956D', success: '#4CAF82', warning: '#F0A54B', danger: '#E05A5A',
};

interface Customer {
  id: number | string; name: string; email: string; phone: string;
  location: string; totalOrders: number; totalSpent: number;
  lastOrder: string; joinDate: string; skinType: string;
  orderHistory: { id: string; date: string; items: string; amount: number; status: string }[];
}

const STATUS_COLOR: Record<string, string> = {
  Delivered: '#4CAF82', Shipped: '#60A5FA', Processing: '#F0A54B', Pending: '#7A7470', Cancelled: '#E05A5A', Returned: '#C9956D',
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
          { label: 'Last Order', value: c.lastOrder !== 'N/A' ? c.lastOrder.split('-').slice(1).join('/') : 'N/A' },
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
        {c.totalOrders >= 5 && (
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
              { label: 'Avg Order Value', value: `৳${customer.totalOrders > 0 ? Math.round(customer.totalSpent / customer.totalOrders).toLocaleString() : '0'}`, icon: <ShoppingBag size={16} style={{ color: C.success }} /> },
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
            {customer.orderHistory.length > 0 ? (
              customer.orderHistory.map((o) => (
                <div
                  key={o.id}
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: C.elevated, borderRadius: 7, marginBottom: 8 }}
                >
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: C.accent, fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>{o.id}</p>
                    <p style={{ fontSize: 11, color: C.muted, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{o.items} · {o.date}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>৳{o.amount.toLocaleString()}</p>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: `${STATUS_COLOR[o.status] || C.muted}18`, color: STATUS_COLOR[o.status] || C.muted, border: `1px solid ${STATUS_COLOR[o.status] || C.muted}30` }}>
                      {o.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: C.muted, fontSize: 12 }}>
                No synced orders found in database for this customer.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setCustomers(data);
        }
      }
    } catch (e) {
      console.error('Failed to load customers from database:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  const totalRevenue = customers.reduce((a, c) => a + c.totalSpent, 0);
  const totalOrders = customers.reduce((a, c) => a + c.totalOrders, 0);
  const vipCount = customers.filter((c) => c.totalOrders >= 5).length;

  if (loading && customers.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 10 }}>
        <div>
          <div style={{ width: 140, height: 24, background: C.border, borderRadius: 4, marginBottom: 8 }} />
          <div style={{ width: 180, height: 14, background: C.border, borderRadius: 4 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 80, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 9 }} />
          ))}
        </div>
        <div style={{ width: 260, height: 34, background: C.border, borderRadius: 8 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 180, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>Customers</h1>
        <p style={{ fontSize: 13, color: C.muted }}>{customers.length} registered customers</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Total Customers', value: customers.length, color: C.accent },
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
      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {filtered.map((c) => (
            <CustomerCard key={c.id} c={c} onClick={() => setSelectedCustomer(c)} />
          ))}
        </div>
      ) : (
        <div style={{ padding: '40px', textAlign: 'center', color: C.muted, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }}>
          No matching customers found.
        </div>
      )}

      {/* Modal */}
      {selectedCustomer && <CustomerModal customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />}
    </div>
  );
}
