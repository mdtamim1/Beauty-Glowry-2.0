'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, ShoppingCart, Package,
  Users, DollarSign, ArrowRight, Clock, CheckCircle,
  AlertCircle, Truck, RefreshCw, Star
} from 'lucide-react';

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

const STATUS_COLOR: Record<string, string> = {
  Delivered: C.success,
  Shipped: '#60A5FA',
  Processing: C.warning,
  Pending: C.muted,
  Cancelled: C.danger,
  Returned: C.accent,
};

function KpiCard({ label, value, sub, icon: Icon, trend, color, trendValue }: {
  label: string; value: string; sub: string; icon: any; trend?: 'up' | 'down'; color: string; trendValue?: string;
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
            {trendValue || '0%'}
          </div>
        )}
      </div>
      <div>
        <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 24, fontWeight: 600, color: C.text, lineHeight: 1, marginBottom: 6 }}>
          {value}
        </p>
        <p style={{ fontSize: 12, fontWeight: 600, color: C.textSec, marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 11, color: C.muted }}>{sub}</p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to load stats from database:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const getMonthName = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[new Date().getMonth()]} ${new Date().getFullYear()}`;
  };

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: 10 }}>
        {/* Header Skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ width: 150, height: 24, background: C.border, borderRadius: 4, marginBottom: 8 }} />
            <div style={{ width: 260, height: 14, background: C.border, borderRadius: 4 }} />
          </div>
          <div style={{ width: 100, height: 32, background: C.border, borderRadius: 4 }} />
        </div>
        
        {/* KPI Skeleton */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 130, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }} />
          ))}
        </div>

        {/* Chart Skeleton */}
        <div style={{ height: 260, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10 }} />
      </div>
    );
  }

  // Fallbacks in case stats are not loaded or incomplete
  const revenueToday = stats?.revenue?.today || 0;
  const revenueYesterday = stats?.revenue?.yesterday || 0;
  const weeklyTrend = stats?.revenue?.weeklyTrendPercentage || 0;
  const dailyChartData = stats?.revenue?.dailyRevenueChart || [0, 0, 0, 0, 0, 0, 0];
  const dailyChartLabels = stats?.revenue?.daysLabelChart || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const maxRevenue = Math.max(...dailyChartData) || 1;

  const totalOrders = stats?.orders?.total || 0;
  const pendingOrders = stats?.orders?.pending || 0;
  const recentOrders = stats?.orders?.recent || [];

  const activeProducts = stats?.products?.active || 0;
  const lowStockCount = stats?.products?.lowStockCount || 0;
  const lowStockList = stats?.products?.lowStockList || [];
  const topProducts = stats?.products?.topList || [];

  const totalCustomers = stats?.customers?.total || 0;
  const newCustomers = stats?.customers?.newThisWeek || 0;

  const dailyTrendValue = revenueYesterday > 0
    ? `${Math.round(((revenueToday - revenueYesterday) / revenueYesterday) * 100)}%`
    : '0%';

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
            <Clock size={13} /> {getMonthName()}
          </div>
          <button
            onClick={fetchStats}
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
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KpiCard
          label="Revenue Today"
          value={`৳${revenueToday.toLocaleString()}`}
          sub={`vs ৳${revenueYesterday.toLocaleString()} yesterday`}
          icon={DollarSign}
          trend={revenueToday >= revenueYesterday ? 'up' : 'down'}
          trendValue={dailyTrendValue}
          color={C.accent}
        />
        <KpiCard
          label="Total Orders"
          value={`${totalOrders}`}
          sub={`${pendingOrders} pending action`}
          icon={ShoppingCart}
          trend={totalOrders > 0 ? 'up' : undefined}
          trendValue="+5%"
          color="#60A5FA"
        />
        <KpiCard
          label="Active Products"
          value={`${activeProducts}`}
          sub={`${lowStockCount} low in stock`}
          icon={Package}
          trend={lowStockCount === 0 ? 'up' : 'down'}
          trendValue={lowStockCount === 0 ? '0%' : `-${lowStockCount}`}
          color={C.success}
        />
        <KpiCard
          label="Customers"
          value={`${totalCustomers.toLocaleString()}`}
          sub={`+${newCustomers} this week`}
          icon={Users}
          trend={newCustomers > 0 ? 'up' : undefined}
          trendValue={`+${newCustomers}`}
          color={C.warning}
        />
      </div>

      {/* Revenue Chart + Quick Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 16 }}>
        {/* Bar Chart */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 2 }}>Revenue (Last 7 Days)</h3>
              <p style={{ fontSize: 12, color: C.muted }}>Total: ৳${(stats?.revenue?.thisWeekTotal || 0).toLocaleString()}</p>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: weeklyTrend >= 0 ? C.success : C.danger,
                background: weeklyTrend >= 0 ? `${C.success}18` : `${C.danger}18`,
                border: `1px solid ${weeklyTrend >= 0 ? C.success : C.danger}30`,
                padding: '4px 10px',
                borderRadius: 20,
              }}
            >
              {weeklyTrend >= 0 ? `↑ ${weeklyTrend}% vs last week` : `↓ ${Math.abs(weeklyTrend)}% vs last week`}
            </span>
          </div>
          {/* Chart bars */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 140 }}>
            {dailyChartData.map((val: number, i: number) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: 9, color: C.muted, fontFamily: "'DM Mono', monospace" }}>
                  ৳{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                </span>
                <div
                  style={{
                    width: '100%',
                    height: `${(val / maxRevenue) * 100}%`,
                    background: i === dailyChartData.length - 1
                      ? `linear-gradient(180deg, ${C.accent}, #A07050)`
                      : `rgba(201,149,109,0.25)`,
                    borderRadius: '4px 4px 0 0',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = `linear-gradient(180deg, ${C.accent}, #A07050)`)}
                  onMouseLeave={(e) => {
                    if (i !== dailyChartData.length - 1) {
                      e.currentTarget.style.background = 'rgba(201,149,109,0.25)';
                    }
                  }}
                />
                <span style={{ fontSize: 10, color: C.muted }}>{dailyChartLabels[i]}</span>
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
              { label: 'Pending', count: pendingOrders, color: C.muted, icon: Clock },
              { label: 'Processing', count: stats?.orders?.processing || 0, color: C.warning, icon: RefreshCw },
              { label: 'Shipped', count: stats?.orders?.shipped || 0, color: '#60A5FA', icon: Truck },
              { label: 'Delivered', count: stats?.orders?.delivered || 0, color: C.success, icon: CheckCircle },
            ].map((item) => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <item.icon size={13} style={{ color: item.color }} />
                <span style={{ fontSize: 12, color: C.textSec, flex: 1 }}>{item.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>
                  {item.count}
                </span>
                <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99 }}>
                  <div style={{ width: `${totalOrders > 0 ? (item.count / totalOrders) * 100 : 0}%`, height: '100%', background: item.color, borderRadius: 99 }} />
                </div>
              </div>
            ))}
          </div>

          {/* Low Stock Alert */}
          {lowStockList.length > 0 && (
            <div style={{ background: `rgba(240,165,75,0.06)`, border: `1px solid rgba(240,165,75,0.2)`, borderRadius: 10, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <AlertCircle size={14} style={{ color: C.warning }} />
                <h3 style={{ fontSize: 13, fontWeight: 700, color: C.warning }}>Low Stock Alert</h3>
              </div>
              {lowStockList.slice(0, 3).map((p: any) => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 11, color: C.textSec, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: p.stock <= 10 ? C.danger : C.warning, fontFamily: "'DM Mono', monospace" }}>
                    {p.stock} left
                  </span>
                </div>
              ))}
            </div>
          )}
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
            {recentOrders.length > 0 ? (
              recentOrders.map((order: any, i: number) => (
                <div
                  key={order.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr auto auto',
                    alignItems: 'center',
                    gap: 16,
                    padding: '14px 22px',
                    borderBottom: i < recentOrders.length - 1 ? `1px solid ${C.border}` : 'none',
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
                      color: STATUS_COLOR[order.status] || C.muted,
                      background: `${STATUS_COLOR[order.status] || C.muted}18`,
                      padding: '3px 8px',
                      borderRadius: 4,
                      border: `1px solid ${STATUS_COLOR[order.status] || C.muted}30`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {order.status}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>৳{order.amount.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px 22px', textAlign: 'center', color: C.muted, fontSize: 12 }}>
                No recent orders found in database.
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>Top Rated Products</h3>
          </div>
          <div style={{ padding: '8px 0' }}>
            {topProducts.length > 0 ? (
              topProducts.map((p: any, i: number) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 20px',
                    borderBottom: i < topProducts.length - 1 ? `1px solid ${C.border}` : 'none',
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
                      {p.name}
                    </p>
                    <p style={{ fontSize: 11, color: C.muted }}>
                      <Star size={10} style={{ display: 'inline', verticalAlign: 'middle', color: C.accent }} /> {p.rating} · {p.reviewCount} reviews
                    </p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>
                    ৳{p.price.toLocaleString()}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: '24px 22px', textAlign: 'center', color: C.muted, fontSize: 12 }}>
                No products found in database.
              </div>
            )}
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
