'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, Package, Heart, Trophy, Ticket, MapPin, ChevronRight, LogOut,
  Camera, Edit3, Lock, Check, X, ShoppingBag, Star, Zap, Clock,
  TrendingUp, Gift, ArrowLeft, ChevronDown, ChevronUp, Copy,
  CheckCircle, AlertCircle, Truck, RefreshCw, Plus, Trash2,
  Shield, Home, CreditCard, Sparkles
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import ProductCard from '../../components/ProductCard';
import { useAuthStore } from '../../store/useAuthStore';
import { useCartStore } from '../../store/useCartStore';
import { products as localProducts } from '../../data/products';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Order {
  id: string;
  status: string;
  payment_method: string;
  payment_status: string;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  date: string;
  address: string;
  courier: string;
  customer_notes: string;
  consignment_id?: string;
  tracking_url?: string;
  items: { name: string; image: string; qty: number; price: number; variant: string; productId: string }[];
  timeline: { status: string; note: string; date: string }[];
}

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  date: string;
}

interface Address {
  id: string;
  label: string;
  address_line: string;
  city: string;
  zip: string | null;
  is_default: boolean;
}

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  isActive: boolean;
  expires: string;
}

type Tab = 'overview' | 'orders' | 'profile' | 'beauty-profile' | 'wishlist' | 'achievements' | 'coupons' | 'addresses';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatAmount(n: number) {
  return '৳' + n.toLocaleString('en-BD');
}

const STATUS_STEPS = ['Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered'];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  pending:    { color: '#D97706', bg: 'rgba(217,119,6,0.12)',  label: 'Pending' },
  confirmed:  { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'Confirmed' },
  processing: { color: '#6366F1', bg: 'rgba(99,102,241,0.12)', label: 'Processing' },
  shipped:    { color: '#F97316', bg: 'rgba(249,115,22,0.12)', label: 'Shipped' },
  delivered:  { color: '#10B981', bg: 'rgba(16,185,129,0.12)', label: 'Delivered' },
  cancelled:  { color: '#EF4444', bg: 'rgba(239,68,68,0.12)',  label: 'Cancelled' },
  returned:   { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: 'Returned' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
      letterSpacing: '0.06em', textTransform: 'uppercase',
      color: cfg.color, background: cfg.bg,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, display: 'inline-block' }} />
      {cfg.label}
    </span>
  );
}

// ─── Sub-sections ─────────────────────────────────────────────────────────────

// Overview Tab
function OverviewTab({ user, orders, badges }: { user: any; orders: Order[]; badges: Badge[] }) {
  const totalSpent = orders.reduce((s, o) => s + o.total, 0);
  const lastOrder = orders[0];
  const unlocked = badges.filter(b => b.unlocked).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { icon: <Package size={20} />, label: 'Orders', value: orders.length, color: '#6366F1' },
          { icon: <TrendingUp size={20} />, label: 'Total Spent', value: formatAmount(totalSpent), color: '#C9956D' },
          { icon: <Trophy size={20} />, label: 'Badges', value: `${unlocked}/${badges.length}`, color: '#F59E0B' },
        ].map((stat, i) => (
          <div key={i} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: 16, padding: '18px 16px', textAlign: 'center',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, margin: '0 auto 10px',
              background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: stat.color,
            }}>
              {stat.icon}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, letterSpacing: '0.05em' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Last Order */}
      {lastOrder ? (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
          borderRadius: 16, padding: 20,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
              Last Order
            </span>
            <StatusBadge status={lastOrder.status} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>#{lastOrder.id}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
            {lastOrder.items.map(i => i.name).join(', ')}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{formatAmount(lastOrder.total)}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(lastOrder.date)}</span>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
          borderRadius: 16, padding: 40, textAlign: 'center',
        }}>
          <Package size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
          <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>No orders yet</div>
          <Link href="/products" style={{
            display: 'inline-block', marginTop: 16, padding: '10px 24px',
            background: 'var(--accent)', color: '#fff', borderRadius: 12,
            fontSize: 13, fontWeight: 700, textDecoration: 'none',
          }}>
            Start Shopping
          </Link>
        </div>
      )}

      {/* Badges Preview */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
        borderRadius: 16, padding: 20,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '0.04em' }}>
          Your Badges
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {badges.map(b => (
            <div key={b.id} title={b.title} style={{
              width: 48, height: 48, borderRadius: 14, border: `2px solid ${b.unlocked ? b.color : 'var(--border-default)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, opacity: b.unlocked ? 1 : 0.35,
              background: b.unlocked ? `${b.color}15` : 'var(--bg-base)',
              transition: 'all 0.2s',
            }}>
              {b.icon}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Orders Tab
function OrdersTab({ orders }: { orders: Order[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 20px',
        background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border-default)',
      }}>
        <Package size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>You have no orders yet.</p>
        <Link href="/products" style={{
          background: 'var(--accent)', color: '#fff', padding: '12px 32px', borderRadius: 12,
          fontWeight: 700, textDecoration: 'none', fontSize: 14,
        }}>
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {orders.map((order) => {
        const open = expanded === order.id;
        const statusIdx = STATUS_STEPS.findIndex(s => s.toLowerCase() === order.status.toLowerCase());

        return (
          <div key={order.id} style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
            borderRadius: 16, overflow: 'hidden',
            transition: 'box-shadow 0.2s',
          }}>
            {/* Header */}
            <button
              onClick={() => setExpanded(open ? null : order.id)}
              style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12,
              }}
            >
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    #{order.id}
                  </span>
                  <StatusBadge status={order.status} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {formatDate(order.date)} · {order.items.length} item{order.items.length !== 1 ? 's' : ''} · <strong style={{ color: 'var(--accent)' }}>{formatAmount(order.total)}</strong>
                </div>
              </div>
              {open ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
            </button>

            {/* Expanded */}
            {open && (
              <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--border-default)' }}>
                {/* Timeline */}
                {order.status.toLowerCase() !== 'cancelled' && (
                  <div style={{ margin: '20px 0 24px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 14 }}>
                      Order Timeline
                    </div>
                    <div style={{ display: 'flex', gap: 0 }}>
                      {STATUS_STEPS.map((step, idx) => {
                        const done = idx <= statusIdx;
                        const active = idx === statusIdx;
                        const cfg = STATUS_CONFIG[step.toLowerCase()] || STATUS_CONFIG.pending;
                        return (
                          <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                            {/* Connector line */}
                            {idx > 0 && (
                              <div style={{
                                position: 'absolute', top: 10, right: '50%', left: '-50%',
                                height: 2, background: done ? cfg.color : 'var(--border-default)',
                                transition: 'background 0.3s',
                              }} />
                            )}
                            {/* Dot */}
                            <div style={{
                              width: 22, height: 22, borderRadius: '50%',
                              background: done ? (active ? cfg.color : '#10B981') : 'var(--bg-base)',
                              border: `2px solid ${done ? (active ? cfg.color : '#10B981') : 'var(--border-default)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              zIndex: 1, position: 'relative',
                              boxShadow: active ? `0 0 0 4px ${cfg.color}22` : 'none',
                              transition: 'all 0.3s',
                            }}>
                              {done && <Check size={10} color="#fff" strokeWidth={3} />}
                            </div>
                            <span style={{
                              fontSize: 9, fontWeight: 600, textAlign: 'center', marginTop: 5,
                              color: done ? 'var(--text-primary)' : 'var(--text-muted)',
                              letterSpacing: '0.02em',
                            }}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {order.items.map((item, idx) => (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', background: 'var(--bg-base)', borderRadius: 12,
                    }}>
                      <div style={{
                        width: 44, height: 44, borderRadius: 10, overflow: 'hidden',
                        background: 'var(--border-default)', flexShrink: 0,
                      }}>
                        {item.image ? (
                          <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShoppingBag size={18} color="var(--text-muted)" />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                        {item.variant && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.variant}</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{formatAmount(item.price)}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>×{item.qty}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div style={{
                  padding: '12px 16px', borderRadius: 12, background: 'var(--bg-base)',
                  display: 'flex', flexDirection: 'column', gap: 6,
                }}>
                  {[
                    { label: 'Subtotal', val: formatAmount(order.subtotal) },
                    order.discount > 0 && { label: 'Discount', val: `–${formatAmount(order.discount)}` },
                    { label: 'Shipping', val: formatAmount(order.shipping) },
                  ].filter(Boolean).map((row: any, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' }}>
                      <span>{row.label}</span><span>{row.val}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: 'var(--text-primary)', borderTop: '1px solid var(--border-default)', paddingTop: 8, marginTop: 4 }}>
                    <span>Total</span><span style={{ color: 'var(--accent)' }}>{formatAmount(order.total)}</span>
                  </div>
                </div>

                {/* Delivery info */}
                {order.address && (
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <MapPin size={14} style={{ color: 'var(--text-muted)', marginTop: 1, flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{order.address}</span>
                  </div>
                )}
                {order.courier && (
                  <div style={{ marginTop: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Truck size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Courier: {order.courier}</span>
                  </div>
                )}

                {/* Steadfast Tracking Card */}
                {order.consignment_id && (
                  <div style={{
                    marginTop: 12, padding: '12px 14px',
                    background: 'rgba(16,185,129,0.06)',
                    border: '1px solid rgba(16,185,129,0.25)',
                    borderRadius: 12,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, background: 'rgba(16,185,129,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Truck size={14} style={{ color: '#10B981' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Steadfast — In Transit
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
                          CN: {order.consignment_id}
                        </div>
                      </div>
                    </div>
                    {order.tracking_url && (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          padding: '7px 14px', background: '#10B981', color: '#fff',
                          borderRadius: 8, fontSize: 12, fontWeight: 700,
                          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
                          flexShrink: 0,
                        }}
                      >
                        <Truck size={11} /> Track
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}


// Profile Tab
function ProfileTab({ user, token, onUpdate }: { user: any; token: string; onUpdate: (u: any) => void }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Sync state if user prop changes
  useEffect(() => {
    setName(user?.name || '');
    setAvatar(user?.avatar || '');
    setPhone(user?.phone || '');
    setEmail(user?.email || '');
  }, [user]);

  const isTempEmail = user?.email?.includes('@facebook-temp.com') || false;
  const isPhoneMissing = !user?.phone;

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const payload: any = {
        name: name.trim(),
        avatar: avatar.trim() || null,
        phone: phone.trim() || null,
        email: email.trim().toLowerCase()
      };

      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Update failed'); return; }
      onUpdate(data);
      setSaved(true); setEditing(false);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Warning/Alert banners */}
      {isTempEmail && (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center',
          color: '#D97706', fontSize: 13, fontWeight: 500
        }}>
          <AlertCircle size={16} />
          <span>Please update your temporary email address with your real email address.</span>
        </div>
      )}
      {isPhoneMissing && (
        <div style={{
          background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center',
          color: '#D97706', fontSize: 13, fontWeight: 500
        }}>
          <AlertCircle size={16} />
          <span>Please add a phone number to complete your profile registration.</span>
        </div>
      )}

      {/* Avatar Card */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
        borderRadius: 20, padding: 28, textAlign: 'center',
      }}>
        <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
          <div style={{
            width: 90, height: 90, borderRadius: '50%', overflow: 'hidden',
            background: 'linear-gradient(135deg, #C9956D, #8B4513)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid var(--accent)',
          }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: 32, fontWeight: 800, color: '#fff' }}>{initials}</span>
            )}
          </div>
          {editing && (
            <button
              onClick={() => {
                const url = prompt('Enter image URL for avatar:');
                if (url) setAvatar(url);
              }}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 28, height: 28, borderRadius: '50%',
                background: 'var(--accent)', border: '2px solid var(--bg-surface)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#fff',
              }}
            >
              <Camera size={12} />
            </button>
          )}
        </div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 4 }}>{user?.name}</div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>{user?.email}</div>
        {user?.created_at && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Member since {formatDate(user.created_at)}
          </div>
        )}
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, color: '#10B981', fontSize: 13 }}>
            <CheckCircle size={14} /> Profile updated!
          </div>
        )}
      </div>

      {/* Fields */}
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
        borderRadius: 20, padding: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Personal Information</span>
          {!editing ? (
            <button onClick={() => setEditing(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: '1px solid var(--accent)', color: 'var(--accent)',
              padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              <Edit3 size={12} /> Edit
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setEditing(false); setName(user?.name || ''); setAvatar(user?.avatar || ''); setPhone(user?.phone || ''); setEmail(user?.email || ''); }} style={{
                background: 'none', border: '1px solid var(--border-default)', color: 'var(--text-muted)',
                padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving} style={{
                background: 'var(--accent)', border: 'none', color: '#fff',
                padding: '6px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                opacity: saving ? 0.7 : 1,
              }}>
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '10px 14px', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name — editable */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Full Name
            </label>
            {editing ? (
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  background: 'var(--bg-base)', border: '1px solid var(--accent)',
                  color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            ) : (
              <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-base)', fontSize: 14, color: 'var(--text-primary)' }}>
                {user?.name}
              </div>
            )}
          </div>

          {/* Email Address */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Email Address
            </label>
            {editing && (isTempEmail || !user?.email) ? (
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your email address"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  background: 'var(--bg-base)', border: '1px solid var(--accent)',
                  color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            ) : (
              <div style={{
                padding: '12px 14px', borderRadius: 12, background: 'var(--bg-base)',
                border: '1px solid var(--border-default)', fontSize: 14, color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>{user?.email}</span>
                <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                  <Lock size={12} /> Locked
                </span>
              </div>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Phone Number
            </label>
            {editing ? (
              <input
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Enter phone number (e.g., 01712345678)"
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  background: 'var(--bg-base)', border: '1px solid var(--accent)',
                  color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
            ) : (
              <div style={{
                padding: '12px 14px', borderRadius: 12, background: 'var(--bg-base)',
                border: '1px solid var(--border-default)', fontSize: 14, color: user?.phone ? 'var(--text-primary)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span>{user?.phone || 'Not set'}</span>
                {!user?.phone && (
                  <span style={{ color: '#D97706', fontSize: 11, fontWeight: 600 }}>
                    Required
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Skin Type */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>
              Skin Type
            </label>
            <div style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-base)', fontSize: 14, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{user?.skin_type || 'Not set'}</span>
              <Link href="/quiz" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
                Take Quiz →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Beauty Profile Tab
function BeautyProfileTab({ user, token, orders, onUpdate }: { user: any; token: string; orders: Order[]; onUpdate: (u: any) => void }) {
  const [editing, setEditing] = useState(false);
  const [skinType, setSkinType] = useState(user?.skin_type || '');
  const [allergies, setAllergies] = useState(user?.allergies || '');
  const [currentRoutine, setCurrentRoutine] = useState(user?.current_routine || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDbProducts(data);
        }
        setLoadingProducts(false);
      })
      .catch((err) => {
        console.error('Failed to load products for recommendations:', err);
        setLoadingProducts(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          skin_type: skinType || null,
          allergies: allergies.trim() || null,
          current_routine: currentRoutine.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Update failed');
      }
      onUpdate(data);
      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Extract unique products from user's orders
  const purchasedProducts = React.useMemo(() => {
    const map: Record<string, any> = {};
    orders.forEach((order) => {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item.productId && !map[item.productId]) {
            map[item.productId] = {
              id: item.productId,
              name: item.name,
              image: item.image,
              variant: item.variant,
              price: item.price,
            };
          }
        });
      }
    });
    return Object.values(map);
  }, [orders]);

  // Compute recommendations based on skin type and filter out allergies
  const recommendations = React.useMemo(() => {
    if (!user?.skin_type) return [];
    
    const userSkin = user.skin_type.toLowerCase();
    const userAllergiesList = (user.allergies || '')
      .toLowerCase()
      .split(',')
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    return dbProducts.filter((p: any) => {
      // 1. Matches skin type
      const matchesSkin = p.skinTypes?.some((st: string) => 
        st.toLowerCase().includes(userSkin) || userSkin.includes(st.toLowerCase())
      );
      
      // 2. Exclude allergens
      const hasAllergen = userAllergiesList.some((allergen: string) => {
        const inName = p.name.toLowerCase().includes(allergen);
        const inIngredients = (p.inciList || '').toLowerCase().includes(allergen);
        return inName || inIngredients;
      });

      return matchesSkin && !hasAllergen;
    }).slice(0, 4);
  }, [dbProducts, user?.skin_type, user?.allergies]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Edit Trigger / Success banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
          Manage your personalized skin profile and view curated routine recommendations.
        </p>
        {!editing ? (
          <button onClick={() => setEditing(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: '1px solid var(--accent)', color: 'var(--accent)',
            padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            flexShrink: 0,
          }}>
            <Edit3 size={12} /> Edit Profile
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button onClick={() => { setEditing(false); setSkinType(user?.skin_type || ''); setAllergies(user?.allergies || ''); setCurrentRoutine(user?.current_routine || ''); setError(''); }} style={{
              background: 'none', border: '1px solid var(--border-default)', color: 'var(--text-muted)',
              padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving} style={{
              background: 'var(--accent)', border: 'none', color: '#fff',
              padding: '6px 18px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {success && (
        <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '12px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
          <CheckCircle size={16} /> Personal Beauty Profile updated successfully!
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '12px 16px', borderRadius: 12, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Grid for settings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="pdp-main-grid">
        {/* Skin Type & Allergies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Skin Type Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 20 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
              Skin Type
            </label>
            {editing ? (
              <select
                value={skinType}
                onChange={e => setSkinType(e.target.value)}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  background: 'var(--bg-base)', border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)', fontSize: 14, outline: 'none',
                }}
              >
                <option value="">Select skin type...</option>
                <option value="Normal">Normal</option>
                <option value="Dry">Dry</option>
                <option value="Oily">Oily</option>
                <option value="Combination">Combination</option>
                <option value="Sensitive">Sensitive</option>
              </select>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--bg-base)', borderRadius: 12 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.skin_type || 'Not set'}
                </span>
                <Link href="/quiz" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>
                  Retake Quiz →
                </Link>
              </div>
            )}
          </div>

          {/* Allergies Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                Allergies & Sensitivities
              </label>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontStyle: 'italic' }}>Comma separated</span>
            </div>
            {editing ? (
              <textarea
                value={allergies}
                onChange={e => setAllergies(e.target.value)}
                placeholder="e.g. Fragrance, Vitamin C, Salicylic Acid"
                rows={3}
                style={{
                  width: '100%', padding: '12px 14px', borderRadius: 12,
                  background: 'var(--bg-base)', border: '1px solid var(--border-default)',
                  color: 'var(--text-primary)', fontSize: 13, outline: 'none', resize: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            ) : (
              <div style={{ padding: '12px 14px', background: 'var(--bg-base)', borderRadius: 12, minHeight: 68 }}>
                {user?.allergies ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {user.allergies.split(',').map((alg: string, idx: number) => (
                      <span key={idx} style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(224,90,90,0.12)', color: 'var(--danger)', fontSize: 11, fontWeight: 600 }}>
                        ⚠️ {alg.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No allergies declared.</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Current Routine */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column' }}>
          <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>
            Current Routine
          </label>
          {editing ? (
            <textarea
              value={currentRoutine}
              onChange={e => setCurrentRoutine(e.target.value)}
              placeholder="Describe your current AM/PM routine..."
              style={{
                width: '100%', flex: 1, padding: '12px 14px', borderRadius: 12,
                background: 'var(--bg-base)', border: '1px solid var(--border-default)',
                color: 'var(--text-primary)', fontSize: 13, outline: 'none', resize: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 120,
              }}
            />
          ) : (
            <div style={{ padding: '12px 14px', background: 'var(--bg-base)', borderRadius: 12, flex: 1, minHeight: 120, fontSize: 13, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
              {user?.current_routine || 'No routine description set.'}
            </div>
          )}
        </div>
      </div>

      {/* Previous Purchases */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 24 }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 16px' }}>
          Previous Purchases
        </h3>
        {purchasedProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', border: '1px dashed var(--border-default)', borderRadius: 12 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>You haven't purchased any products yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }} className="pdp-related-grid">
            {purchasedProducts.map((p) => {
              // Check if purchased product contains any allergen declared by user
              const userAllergiesList = (user?.allergies || '')
                .toLowerCase()
                .split(',')
                .map((s: string) => s.trim())
                .filter((s: string) => s.length > 0);
              
              const localProd = dbProducts.find((dbP) => String(dbP.id) === String(p.id));
              const hasAllergen = userAllergiesList.some((allergen: string) => {
                const inName = p.name.toLowerCase().includes(allergen);
                const inIngredients = (localProd?.inciList || '').toLowerCase().includes(allergen);
                return inName || inIngredients;
              });

              return (
                <div key={p.id} style={{ display: 'flex', gap: 12, padding: 12, background: 'var(--bg-base)', borderRadius: 12, position: 'relative', border: hasAllergen ? '1px solid rgba(224,90,90,0.3)' : '1px solid transparent' }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', background: 'var(--border-default)', flexShrink: 0 }}>
                    {p.image ? (
                      <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShoppingBag size={16} color="var(--text-muted)" />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link href={`/product/${p.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {p.name}
                      </div>
                    </Link>
                    {p.variant && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{p.variant}</div>}
                    {hasAllergen && (
                      <div style={{ fontSize: 9, color: 'var(--danger)', fontWeight: 700, marginTop: 4 }}>
                        ⚠️ Contains allergen
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Personalized Recommendations */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 16, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Personalized Recommendations
          </h3>
          {user?.skin_type && (
            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600, padding: '2px 10px', background: 'rgba(201,149,109,0.12)', borderRadius: 20 }}>
              Based on {user.skin_type} Skin
            </span>
          )}
        </div>

        {!user?.skin_type ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', border: '1px dashed var(--border-default)', borderRadius: 12 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 16 }}>
              Please set your Skin Type or complete the quiz to receive personalized skincare recommendations.
            </p>
            <Link href="/quiz" className="btn-primary" style={{ display: 'inline-block', fontSize: 12, padding: '10px 24px' }}>
              Take Skin Quiz
            </Link>
          </div>
        ) : loadingProducts ? (
          <div style={{ textAlign: 'center', padding: 20 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Loading recommendations...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', border: '1px dashed var(--border-default)', borderRadius: 12 }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
              No recommendations match your skin profile and allergen settings at this time.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }} className="pdp-related-grid">
            {recommendations.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Wishlist Tab
function WishlistTab() {
  const { wishlist, removeFromWishlist, addToCart, setBuyNow } = useCartStore();
  const router = useRouter();
  const wishlistProducts = localProducts.filter(p => wishlist.includes(String(p.id)));

  if (wishlistProducts.length === 0) {
    return (
      <div style={{
        textAlign: 'center', padding: '60px 20px',
        background: 'var(--bg-surface)', borderRadius: 16, border: '1px solid var(--border-default)',
      }}>
        <Heart size={48} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Your wishlist is empty.</p>
        <Link href="/products" style={{
          background: 'var(--accent)', color: '#fff', padding: '12px 32px', borderRadius: 12,
          fontWeight: 700, textDecoration: 'none', fontSize: 14,
        }}>
          Discover Products
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
      {wishlistProducts.map(product => (
        <div key={product.id} style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
          borderRadius: 16, overflow: 'hidden',
        }}>
          <Link href={`/product/${product.id}`} style={{ display: 'block', textDecoration: 'none' }}>
            <div style={{ aspectRatio: '3/4', background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}>
              <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          </Link>
          <div style={{ padding: '12px 12px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4, lineHeight: 1.3 }}>
              {product.name}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--accent)', marginBottom: 10 }}>
              ৳{product.price.toLocaleString()}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => addToCart(product as any)}
                style={{
                  flex: 1, padding: '8px 0', borderRadius: 10, fontSize: 11, fontWeight: 700,
                  background: 'var(--accent)', color: '#fff', border: 'none', cursor: 'pointer',
                }}
              >
                Add to Cart
              </button>
              <button
                onClick={() => removeFromWishlist(String(product.id))}
                style={{
                  width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border-default)',
                  background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#EF4444',
                }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Achievements Tab
function AchievementsTab({ badges, stats }: { badges: Badge[]; stats: any }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Progress summary */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(201,149,109,0.15), rgba(139,69,19,0.08))',
        border: '1px solid rgba(201,149,109,0.25)',
        borderRadius: 20, padding: '20px 24px',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, #C9956D, #8B4513)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Trophy size={28} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
            {badges.filter(b => b.unlocked).length}/{badges.length} Unlocked
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
            Keep shopping to unlock all badges!
          </div>
        </div>
      </div>

      {/* Badge Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 12 }}>
        {badges.map(b => (
          <div key={b.id} style={{
            background: 'var(--bg-surface)', border: `1px solid ${b.unlocked ? b.color + '40' : 'var(--border-default)'}`,
            borderRadius: 16, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 16,
            opacity: b.unlocked ? 1 : 0.65,
            transition: 'all 0.2s',
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              background: b.unlocked ? `${b.color}18` : 'var(--bg-base)',
              border: `2px solid ${b.unlocked ? b.color : 'var(--border-default)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26,
            }}>
              {b.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: b.unlocked ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {b.title}
                </span>
                {b.unlocked && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: b.color, background: `${b.color}18`, padding: '2px 8px', borderRadius: 20,
                  }}>
                    Unlocked
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                {b.description}
              </div>
              {b.unlocked && b.date && (
                <div style={{ fontSize: 11, color: b.color, marginTop: 4 }}>
                  ✓ {formatDate(b.date)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Coupons Tab
function CouponsTab({ token }: { token: string }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/coupons').then(r => r.json()).then(data => {
      setCoupons(Array.isArray(data) ? data.filter((c: Coupon) => c.isActive) : []);
    }).finally(() => setLoading(false));
  }, []);

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading coupons…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {coupons.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <Ticket size={40} style={{ marginBottom: 16 }} />
          <p>No active coupons available right now.</p>
        </div>
      ) : (
        coupons.map(coupon => (
          <div key={coupon.id} style={{
            background: 'var(--bg-surface)',
            border: '1px dashed var(--accent)',
            borderRadius: 16, padding: '18px 20px',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Accent strip */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
              background: 'linear-gradient(180deg, #C9956D, #8B4513)',
            }} />
            <div style={{ paddingLeft: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{
                  fontSize: 18, fontWeight: 800, color: 'var(--accent)',
                  letterSpacing: '0.1em', fontFamily: 'monospace',
                }}>
                  {coupon.code}
                </div>
                <button
                  onClick={() => copy(coupon.code)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: copied === coupon.code ? '#10B981' : 'var(--accent)',
                    color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 10,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'background 0.2s',
                  }}
                >
                  {copied === coupon.code ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                {coupon.type === 'percentage' ? `${coupon.value}% OFF` : `৳${coupon.value} OFF`}
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--text-muted)' }}>
                <span>Min. order: ৳{coupon.minOrder}</span>
                <span>Expires: {new Date(coupon.expires).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Addresses Tab
function AddressesTab({ token }: { token: string }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: '', address_line: '', city: '', zip: '', is_default: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    fetch('/api/account/addresses', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setAddresses(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.label || !form.address_line || !form.city) { setError('Please fill all required fields.'); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/account/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); return; }
      setAdding(false);
      setForm({ label: '', address_line: '', city: '', zip: '', is_default: false });
      load();
    } catch (e: any) { setError(e.message); } finally { setSaving(false); }
  };

  const setDefault = async (id: string) => {
    await fetch('/api/account/addresses', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ id, is_default: true }),
    });
    load();
  };

  const deleteAddress = async (id: string) => {
    await fetch(`/api/account/addresses?id=${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    load();
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>Loading…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {addresses.map(addr => (
        <div key={addr.id} style={{
          background: 'var(--bg-surface)', border: `1px solid ${addr.is_default ? 'var(--accent)' : 'var(--border-default)'}`,
          borderRadius: 16, padding: '16px 20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: addr.is_default ? 'rgba(201,149,109,0.15)' : 'var(--bg-base)',
              border: `1px solid ${addr.is_default ? 'var(--accent)' : 'var(--border-default)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: addr.is_default ? 'var(--accent)' : 'var(--text-muted)',
            }}>
              <Home size={16} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{addr.label}</span>
                {addr.is_default && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: 'var(--accent)', background: 'rgba(201,149,109,0.15)', padding: '2px 8px', borderRadius: 20,
                  }}>
                    Default
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{addr.address_line}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{addr.city}{addr.zip ? `, ${addr.zip}` : ''}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {!addr.is_default && (
              <button onClick={() => setDefault(addr.id)} style={{
                flex: 1, padding: '7px 0', borderRadius: 10, fontSize: 11, fontWeight: 700,
                background: 'none', border: '1px solid var(--accent)', color: 'var(--accent)', cursor: 'pointer',
              }}>
                Set Default
              </button>
            )}
            <button onClick={() => deleteAddress(addr.id)} style={{
              width: 34, height: 34, borderRadius: 10, border: '1px solid var(--border-default)',
              background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#EF4444',
            }}>
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      ))}

      {adding ? (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--accent)',
          borderRadius: 16, padding: 20,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>Add New Address</div>
          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', padding: '8px 12px', borderRadius: 10, marginBottom: 12, fontSize: 13 }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { key: 'label', label: 'Label (e.g. Home)', placeholder: 'Home / Office' },
              { key: 'address_line', label: 'Address', placeholder: 'Street, Area' },
              { key: 'city', label: 'City / District', placeholder: 'Dhaka' },
              { key: 'zip', label: 'ZIP Code (optional)', placeholder: '1212' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
                  {f.label}
                </label>
                <input
                  value={(form as any)[f.key]}
                  onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10, boxSizing: 'border-box',
                    background: 'var(--bg-base)', border: '1px solid var(--border-default)',
                    color: 'var(--text-primary)', fontSize: 13, outline: 'none',
                  }}
                />
              </div>
            ))}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.is_default} onChange={e => setForm(p => ({ ...p, is_default: e.target.checked }))} />
              Set as default delivery address
            </label>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button onClick={() => { setAdding(false); setError(''); }} style={{
              flex: 1, padding: '10px 0', borderRadius: 12, border: '1px solid var(--border-default)',
              background: 'none', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button onClick={handleAdd} disabled={saving} style={{
              flex: 2, padding: '10px 0', borderRadius: 12, border: 'none',
              background: 'var(--accent)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Saving…' : 'Save Address'}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{
          width: '100%', padding: '14px 0', borderRadius: 16,
          border: '2px dashed var(--border-default)', background: 'none',
          color: 'var(--text-muted)', fontSize: 13, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'border-color 0.2s, color 0.2s',
        }}
        onMouseEnter={e => { (e.target as HTMLButtonElement).style.borderColor = 'var(--accent)'; (e.target as HTMLButtonElement).style.color = 'var(--accent)'; }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.borderColor = 'var(--border-default)'; (e.target as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
        >
          <Plus size={16} /> Add New Address
        </button>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AccountPage() {
  const { user, token, logout, updateUser } = useAuthStore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [orders, setOrders] = useState<Order[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [achievementStats, setAchievementStats] = useState<any>({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Redirect if not logged in, but wait for NextAuth session sync if active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const checkSession = async () => {
      if (user && token) {
        setCheckingAuth(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/session');
        const session = await res.json();
        if (session && session.user) {
          // A social session exists. Let's wait for AuthInterceptor to sync it into Zustand.
          let attempts = 0;
          interval = setInterval(() => {
            const state = useAuthStore.getState();
            if (state.user && state.token) {
              clearInterval(interval);
              setCheckingAuth(false);
            }
            attempts++;
            if (attempts > 30) { // 3 seconds timeout
              clearInterval(interval);
              router.replace('/');
            }
          }, 100);
        } else {
          router.replace('/');
        }
      } catch (e) {
        router.replace('/');
      }
    };
    checkSession();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user, token, router]);

  // Fetch data
  useEffect(() => {
    if (!token || dataLoaded) return;
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/account/orders', { headers }).then(r => r.json()).catch(() => []),
      fetch('/api/account/achievements', { headers }).then(r => r.json()).catch(() => ({ badges: [], stats: {} })),
    ]).then(([ordersData, achievementsData]) => {
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      setBadges(achievementsData.badges || []);
      setAchievementStats(achievementsData.stats || {});
      setDataLoaded(true);
    });
  }, [token, dataLoaded]);

  if (checkingAuth) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)', gap: 16
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          border: '3px solid var(--border-default)', borderTopColor: 'var(--accent)',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', fontFamily: "'DM Sans', sans-serif" }}>Loading your profile...</span>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview',      label: 'Overview',     icon: <Home size={18} /> },
    { id: 'orders',        label: 'Orders',        icon: <Package size={18} />, badge: orders.length },
    { id: 'profile',       label: 'Profile',       icon: <User size={18} /> },
    { id: 'beauty-profile', label: 'Beauty Profile', icon: <Sparkles size={18} /> },
    { id: 'wishlist',      label: 'Wishlist',      icon: <Heart size={18} /> },
    { id: 'achievements',  label: 'Achievements',  icon: <Trophy size={18} /> },
    { id: 'coupons',       label: 'Coupons',       icon: <Ticket size={18} /> },
    { id: 'addresses',     label: 'Addresses',     icon: <MapPin size={18} /> },
  ];

  const tabLabels: Record<Tab, string> = {
    overview: 'Overview', orders: 'My Orders', profile: 'Edit Profile',
    'beauty-profile': 'Beauty Profile',
    wishlist: 'Wishlist', achievements: 'Achievements', coupons: 'Coupons', addresses: 'Addresses',
  };

  const initials = (user.name || 'U').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
      <Navbar />
      <main style={{ background: 'var(--bg-base)', minHeight: '100vh', paddingBottom: 120 }}>
        {/* Page Header */}
        <div style={{
          background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-default)',
          padding: '40px 0 32px',
        }}>
          <div className="container-lg">
            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              {/* Avatar */}
              <div style={{
                width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
                background: 'linear-gradient(135deg, #C9956D, #8B4513)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '3px solid var(--accent)', flexShrink: 0,
              }}>
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>{initials}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
                  My Account
                </div>
                <h1 style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 700,
                  color: 'var(--text-primary)', lineHeight: 1.1, margin: 0,
                }}>
                  {user.name}
                </h1>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{user.email}</div>
              </div>
              <button
                onClick={logout}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none', border: '1px solid var(--border-default)',
                  color: 'var(--text-secondary)', padding: '8px 14px', borderRadius: 12,
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              >
                <LogOut size={14} /> <span style={{ display: 'none' }} className="md-show">Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="container-lg" style={{ paddingTop: 28 }}>
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
            {/* ── Desktop Sidebar ── */}
            <nav style={{
              width: 220, flexShrink: 0,
              display: 'flex', flexDirection: 'column', gap: 4,
              position: 'sticky', top: 88,
            }}
              className="account-sidebar"
            >
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 12,
                    background: activeTab === tab.id ? 'rgba(201,149,109,0.12)' : 'none',
                    border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                    color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: activeTab === tab.id ? 700 : 500, fontSize: 13,
                    transition: 'all 0.15s',
                    position: 'relative',
                  }}
                >
                  {tab.icon}
                  <span style={{ flex: 1 }}>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span style={{
                      minWidth: 18, height: 18, borderRadius: 9, background: 'var(--accent)',
                      color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', padding: '0 4px',
                    }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-default)' }}>
                <button onClick={logout} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '11px 14px', borderRadius: 12,
                  background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%',
                  color: '#EF4444', fontWeight: 600, fontSize: 13,
                }}>
                  <LogOut size={18} /> Sign Out
                </button>
              </div>
            </nav>

            {/* ── Content ── */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Section title */}
              <div style={{ marginBottom: 20 }}>
                <h2 style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 'clamp(20px, 3vw, 28px)', fontWeight: 700,
                  color: 'var(--text-primary)', margin: 0,
                }}>
                  {tabLabels[activeTab]}
                </h2>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <OverviewTab user={user} orders={orders} badges={badges} />
              )}
              {activeTab === 'orders' && (
                <OrdersTab orders={orders} />
              )}
              {activeTab === 'profile' && (
                <ProfileTab user={user} token={token || ''} onUpdate={(updated) => updateUser(updated)} />
              )}
              {activeTab === 'beauty-profile' && (
                <BeautyProfileTab user={user} token={token || ''} orders={orders} onUpdate={(updated) => updateUser(updated)} />
              )}
              {activeTab === 'wishlist' && (
                <WishlistTab />
              )}
              {activeTab === 'achievements' && (
                <AchievementsTab badges={badges} stats={achievementStats} />
              )}
              {activeTab === 'coupons' && (
                <CouponsTab token={token || ''} />
              )}
              {activeTab === 'addresses' && (
                <AddressesTab token={token || ''} />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* ── Mobile Bottom Tab Bar ── */}
      <div className="account-mobile-tabs" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: 'var(--bg-surface)', borderTop: '1px solid var(--border-default)',
        display: 'flex', overflowX: 'auto', padding: '8px 0 12px',
        backdropFilter: 'blur(12px)',
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: '0 0 auto', minWidth: 64, display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 3, padding: '6px 8px',
              background: 'none', border: 'none', cursor: 'pointer',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-muted)',
              position: 'relative',
            }}
          >
            {tab.icon}
            <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.03em' }}>{tab.label}</span>
            {activeTab === tab.id && (
              <div style={{
                position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
                width: 20, height: 2, borderRadius: 1, background: 'var(--accent)',
              }} />
            )}
          </button>
        ))}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .account-sidebar { display: none !important; }
          .account-mobile-tabs { display: flex !important; }
        }
        @media (min-width: 769px) {
          .account-sidebar { display: flex !important; }
          .account-mobile-tabs { display: none !important; }
        }
      `}</style>

      <Footer />
    </>
  );
}
