'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, ShoppingCart, Package,
  Users, DollarSign, ArrowRight, Clock, CheckCircle,
  AlertCircle, Truck, RefreshCw, Star, Eye
} from 'lucide-react';
import { products } from '../../../data/products';

const C = {
  bg: '#0F0F0D',
  surface: '#1A1A17',
  elevated: '#222220',
  border: 'rgba(255,255,255,0.07)',
  text: '#F0EBE3',
  textSec: '#B0A8A0',
  muted: '#7A7470',
  accent: '#C9956D',
  success: '#4CAF82',
  warning: '#F0A54B',
  danger: '#E05A5A',
};

const MOCK_ORDERS = [
  { id: 'BG-9938', customer: 'Sumaiya Rahman', product: 'Niacinamide 10% Serum', amount: 1250, status: 'Delivered', date: '29 Jul' },
  { id: 'BG-9937', customer: 'Imtiaz Ahmed', product: 'Ceramide Barrier Cream (×2)', amount: 3300, status: 'Shipped', date: '29 Jul' },
  { id: 'BG-9936', customer: 'Afrin Jahan', product: 'Centella Essence', amount: 950, status: 'Pending', date: '28 Jul' },
  { id: 'BG-9935', customer: 'Fahim Shahriar', product: 'Vitamin C Emulsion', amount: 1850, status: 'Processing', date: '28 Jul' },
  { id: 'BG-9934', customer: 'Nadia Islam', product: 'HA Hydration Serum', amount: 1150, status: 'Pending', date: '27 Jul' },
];

const REVENUE_BARS = [42, 68, 55, 80, 60, 92, 75]; // last 7 days
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const STATUS_COLOR: Record<string, string> = {
  Delivered: C.success,
  Shipped: '#60A5FA',
  Processing: C.warning,
  Pending: C.muted,
  Refunded: C.danger,
};

function KpiCard({ label, value, sub, icon: Icon, trend, color }: {
  label: string; value: string; sub: string; icon: any; trend?: 'up' | 'down'; color: string;
}) {
  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'border-color 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = C.border)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} style={{ color }} />
        </div>
        {trend && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: trend === 'up' ? C.success : C.danger,
            }}
          >
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trend === 'up' ? '+12%' : '-3%'}
          </div>
        )}
      </div>
      <div>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 26, fontWeight: 600, color: C.text, lineHeight: 1, marginBottom: 6 }}>
          {value}
        </p>
        <p style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 11, color: C.muted }}>{sub}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const maxRevenue = Math.max(...REVENUE_BARS);
  const lowStockProducts = products.filter((p) => p.stock <= 20);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>Dashboard</h1>
          <p style={{ fontSize: 13, color: C.muted }}>Welcome back, Admin. Here's what's happening today.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              background: C.surface,
              border: `1px solid ${C.border}`,
              borderRadius: 7,
              fontSize: 12,
              color: C.muted,
            }}
          >
            <Clock size={13} /> July 2024
          </div>
          <button
            style={{
              padding: '7px 14px',
              background: C.accent,
              border: 'none',
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KpiCard label="Revenue Today" value="৳18,450" sub="vs ৳16,200 yesterday" icon={DollarSign} trend="up" color={C.accent} />
        <KpiCard label="Total Orders" value="47" sub="5 pending action" icon={ShoppingCart} trend="up" color="#60A5FA" />
        <KpiCard label="Active Products" value={`${products.length}`} sub={`${lowStockProducts.length} low in stock`} icon={Package} trend="up" color={C.success} />
        <KpiCard label="Customers" value="1,284" sub="+8 this week" icon={Users} trend="up" color={C.warning} />
      </div>

      {/* Revenue Chart + Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Bar Chart */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>Revenue (Last 7 Days)</h3>
              <p style={{ fontSize: 12, color: C.muted }}>Total: ৳1,24,850</p>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: C.success,
                background: `${C.success}18`,
                border: `1px solid ${C.success}30`,
                padding: '4px 10px',
                borderRadius: 20,
              }}
            >
              ↑ 14% vs last week
            </span>
          </div>
          {/* Chart bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
            {REVENUE_BARS.map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 10, color: C.muted, fontFamily: "'DM Mono', monospace" }}>
                  {Math.round(val * 1.5)}k
                </span>
                <div
                  style={{
                    width: '100%',
                    height: `${(val / maxRevenue) * 100}%`,
                    background: i === REVENUE_BARS.length - 1
                      ? `linear-gradient(180deg, ${C.accent}, #A07050)`
                      : `rgba(201,149,109,0.25)`,
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = `linear-gradient(180deg, ${C.accent}, #A07050)`)}
                  onMouseLeave={(e) => {
                    if (i !== REVENUE_BARS.length - 1)
                      e.currentTarget.style.background = 'rgba(201,149,109,0.25)';
                  }}
                />
                <span style={{ fontSize: 10, color: C.muted }}>{DAYS[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Order Status */}
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, flex: 1 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Order Status</h3>
            {[
              { label: 'Pending', count: 8, color: C.muted, icon: Clock },
              { label: 'Processing', count: 5, color: C.warning, icon: RefreshCw },
              { label: 'Shipped', count: 12, color: '#60A5FA', icon: Truck },
              { label: 'Delivered', count: 22, color: C.success, icon: CheckCircle },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <item.icon size={13} style={{ color: item.color }} />
                <span style={{ fontSize: 12, color: C.textSec, flex: 1 }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>
                  {item.count}
                </span>
                <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
                  <div style={{ width: `${(item.count / 47) * 100}%`, height: '100%', background: item.color, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Low Stock Alert */}
          <div style={{ background: `rgba(240,165,75,0.06)`, border: `1px solid rgba(240,165,75,0.2)`, borderRadius: 10, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <AlertCircle size={14} style={{ color: C.warning }} />
              <h3 style={{ fontSize: 13, fontWeight: 700, color: C.warning }}>Low Stock Alert</h3>
            </div>
            {lowStockProducts.slice(0, 3).map((p) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.textSec, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.name.slice(0, 28)}...
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: p.stock <= 10 ? C.danger : C.warning, fontFamily: "'DM Mono', monospace" }}>
                  {p.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders + Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Recent Orders */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Recent Orders</h3>
            <Link href="/admin/orders" style={{ fontSize: 12, color: C.accent, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View All <ArrowRight size={12} />
            </Link>
          </div>
          <div>
            {MOCK_ORDERS.map((order, i) => (
              <div
                key={order.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr auto auto',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 22px',
                  borderBottom: i < MOCK_ORDERS.length - 1 ? `1px solid ${C.border}` : 'none',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 11, fontWeight: 700, color: C.accent, fontFamily: "'DM Mono', monospace" }}>{order.id}</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>{order.customer}</p>
                  <p style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{order.product}</p>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: STATUS_COLOR[order.status],
                    background: `${STATUS_COLOR[order.status]}18`,
                    padding: '3px 8px',
                    borderRadius: 4,
                    border: `1px solid ${STATUS_COLOR[order.status]}30`,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {order.status}
                </span>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>৳{order.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Top Products</h3>
          </div>
          <div style={{ padding: '8px 0' }}>
            {products
              .sort((a, b) => b.reviewCount - a.reviewCount)
              .slice(0, 5)
              .map((p, i) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 20px',
                    borderBottom: i < 4 ? `1px solid ${C.border}` : 'none',
                  }}
                >
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: C.muted, width: 16 }}>
                    {i + 1}
                  </span>
                  <div style={{ width: 36, height: 36, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: `1px solid ${C.border}` }}>
                    <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name.split(' ').slice(0, 3).join(' ')}
                    </p>
                    <p style={{ fontSize: 11, color: C.muted }}>
                      <Star size={10} style={{ display: 'inline', verticalAlign: 'middle', color: C.accent }} /> {p.rating} · {p.reviewCount} reviews
                    </p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>
                    ৳{p.price.toLocaleString()}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 22px' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: 'Add Product', href: '/admin/products', color: C.accent },
            { label: 'View Orders', href: '/admin/orders', color: '#60A5FA' },
            { label: 'Create Coupon', href: '/admin/marketing', color: C.success },
            { label: 'Manage Reviews', href: '/admin/reviews', color: C.warning },
            { label: 'Store Settings', href: '/admin/settings', color: C.muted },
          ].map((action) => (
            <Link
              key={action.label}
              href={action.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                background: `${action.color}12`,
                border: `1px solid ${action.color}30`,
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                color: action.color,
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = `${action.color}20`)}
              onMouseLeave={(e) => (e.currentTarget.style.background = `${action.color}12`)}
            >
              <ArrowRight size={12} /> {action.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
