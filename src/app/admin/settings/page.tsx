'use client';

import React, { useState } from 'react';
import {
  Store, Truck, Bell, Shield, Save, Check,
  Plus, Trash2, Globe, Mail, Phone, MapPin,
  CreditCard, Package, AlertCircle, DollarSign
} from 'lucide-react';

const C = {
  surface: '#1A1A17', elevated: '#222220', border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.13)',
  text: '#F0EBE3', textSec: '#B0A8A0', muted: '#7A7470',
  accent: '#C9956D', success: '#4CAF82', warning: '#F0A54B', danger: '#E05A5A', info: '#60A5FA',
};


type SettingsTab = 'store' | 'shipping' | 'payment' | 'notifications';

interface ShippingZone {
  id: number; name: string; districts: string; fee: number; freeAbove: number;
}

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

function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '14px 22px', borderBottom: `1px solid ${C.border}`, background: C.elevated }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{title}</h3>
      </div>
      <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, prefix, suffix, note }: {
  label: string; type?: string; value: string | number;
  onChange: (v: string) => void; placeholder?: string;
  prefix?: React.ReactNode; suffix?: string; note?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 7 }}>
        {label}
      </label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {prefix && (
          <div style={{ position: 'absolute', left: 12, color: C.muted, pointerEvents: 'none' }}>{prefix}</div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: `10px ${suffix ? '48px' : '12px'} 10px ${prefix ? '36px' : '12px'}`,
            background: C.elevated, border: `1px solid ${C.border}`,
            borderRadius: 7, fontSize: 13, color: C.text,
            fontFamily: "'DM Sans', sans-serif", outline: 'none',
            transition: 'border-color 0.15s',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
        />
        {suffix && (
          <span style={{ position: 'absolute', right: 12, fontSize: 12, color: C.muted, pointerEvents: 'none' }}>{suffix}</span>
        )}
      </div>
      {note && <p style={{ fontSize: 11, color: C.muted, marginTop: 5 }}>{note}</p>}
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${C.border}` }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 2 }}>{label}</p>
        {desc && <p style={{ fontSize: 11, color: C.muted }}>{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
          background: checked ? C.accent : C.elevated,
          position: 'relative', transition: 'background 0.2s', flexShrink: 0,
        }}
      >
        <div
          style={{
            position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff',
            left: checked ? 23 : 3, transition: 'left 0.2s ease',
            boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        />
      </button>
    </div>
  );
}

export default function AdminSettings() {
  const [tab, setTab] = useState<SettingsTab>('store');
  const [saved, setSaved] = useState(false);

  // Store settings
  const [storeName, setStoreName] = useState('Beauty Glowry');
  const [storeTagline, setStoreTagline] = useState('Clinical Skincare for Every Skin Type');
  const [storeEmail, setStoreEmail] = useState('hello@beautyglowry.com');
  const [storePhone, setStorePhone] = useState('+880 1700 000000');
  const [storeAddress, setStoreAddress] = useState('House 12, Road 4, Dhanmondi, Dhaka 1205');
  const [currency, setCurrency] = useState('BDT (৳)');
  const [language, setLanguage] = useState('English');
  const [metaTitle, setMetaTitle] = useState('Beauty Glowry — Clinical Skincare Bangladesh');
  const [metaDesc, setMetaDesc] = useState('Science-backed skincare with clinically proven active ingredients. Shop serums, moisturizers, and more.');

  // Shipping settings
  const [freeShippingThreshold, setFreeShippingThreshold] = useState('1500');
  const [defaultShippingFee, setDefaultShippingFee] = useState('120');
  const [estimatedDaysInside, setEstimatedDaysInside] = useState('2-3');
  const [estimatedDaysOutside, setEstimatedDaysOutside] = useState('4-6');
  const [zones, setZones] = useState<ShippingZone[]>([
    { id: 1, name: 'Dhaka City', districts: 'Dhaka Sadar, Gulshan, Dhanmondi, Uttara', fee: 80, freeAbove: 1500 },
    { id: 2, name: 'Outside Dhaka', districts: 'Chittagong, Sylhet, Rajshahi, Khulna...', fee: 120, freeAbove: 2000 },
  ]);
  const [addingZone, setAddingZone] = useState(false);
  const [newZone, setNewZone] = useState({ name: '', districts: '', fee: 100, freeAbove: 1500 });

  // Payment settings
  const [acceptCOD, setAcceptCOD] = useState(true);
  const [acceptBkash, setAcceptBkash] = useState(true);
  const [acceptNagad, setAcceptNagad] = useState(true);
  const [acceptCard, setAcceptCard] = useState(false);
  const [bkashNumber, setBkashNumber] = useState('01700000000');
  const [nagadNumber, setNagadNumber] = useState('01800000000');
  const [codLimit, setCodLimit] = useState('5000');

  // Notification settings
  const [notifyNewOrder, setNotifyNewOrder] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [notifyNewReview, setNotifyNewReview] = useState(true);
  const [notifyNewCustomer, setNotifyNewCustomer] = useState(false);
  const [lowStockThreshold, setLowStockThreshold] = useState('10');
  const [adminNotifEmail, setAdminNotifEmail] = useState('admin@beautyglowry.com');
  const [orderConfirmEmail, setOrderConfirmEmail] = useState(true);
  const [orderShippedSMS, setOrderShippedSMS] = useState(true);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addZone = () => {
    if (!newZone.name) return;
    setZones((prev) => [...prev, { ...newZone, id: Date.now() }]);
    setNewZone({ name: '', districts: '', fee: 100, freeAbove: 1500 });
    setAddingZone(false);
  };

  const deleteZone = (id: number) => setZones((prev) => prev.filter((z) => z.id !== id));

  const inputStyle = {
    width: '100%', padding: '10px 12px', background: C.elevated,
    border: `1px solid ${C.border}`, borderRadius: 7,
    fontSize: 13, color: C.text, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>Settings</h1>
          <p style={{ fontSize: 13, color: C.muted }}>Configure your store preferences and operations</p>
        </div>
        <button
          onClick={handleSave}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px',
            background: saved ? C.success : C.accent,
            border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
            transition: 'background 0.3s ease',
            boxShadow: `0 4px 16px ${saved ? 'rgba(76,175,130,0.3)' : 'rgba(201,149,109,0.25)'}`,
          }}
        >
          {saved ? <><Check size={14} /> Saved!</> : <><Save size={14} /> Save Changes</>}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <TabBtn active={tab === 'store'} icon={<Store size={14} />} label="Store Info" onClick={() => setTab('store')} />
        <TabBtn active={tab === 'shipping'} icon={<Truck size={14} />} label="Shipping" onClick={() => setTab('shipping')} />
        <TabBtn active={tab === 'payment'} icon={<CreditCard size={14} />} label="Payment" onClick={() => setTab('payment')} />
        <TabBtn active={tab === 'notifications'} icon={<Bell size={14} />} label="Notifications" onClick={() => setTab('notifications')} />
      </div>

      {/* ══ STORE INFO ══════════════════════════════════════════════════ */}
      {tab === 'store' && (
        <div style={{ maxWidth: 640 }}>
          <FieldGroup title="🏪 Brand Information">
            <Field label="Store Name" value={storeName} onChange={setStoreName} placeholder="Beauty Glowry" />
            <Field label="Tagline" value={storeTagline} onChange={setStoreTagline} placeholder="Clinical Skincare..." />
          </FieldGroup>

          <FieldGroup title="📬 Contact Details">
            <Field label="Business Email" prefix={<Mail size={13} />} value={storeEmail} onChange={setStoreEmail} placeholder="hello@beautyglowry.com" />
            <Field label="Phone Number" prefix={<Phone size={13} />} value={storePhone} onChange={setStorePhone} />
            <Field label="Business Address" prefix={<MapPin size={13} />} value={storeAddress} onChange={setStoreAddress} />
          </FieldGroup>

          <FieldGroup title="🌐 Regional Settings">
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 7 }}>Currency</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputStyle}>
                <option value="BDT (৳)">BDT (৳) — Bangladeshi Taka</option>
                <option value="USD ($)">USD ($) — US Dollar</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 7 }}>Language</label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} style={inputStyle}>
                <option value="English">English</option>
                <option value="Bengali">বাংলা (Bengali)</option>
              </select>
            </div>
          </FieldGroup>

          <FieldGroup title="🔍 SEO & Metadata">
            <Field label="Meta Title" prefix={<Globe size={13} />} value={metaTitle} onChange={setMetaTitle} note="Keep under 60 characters for best results" />
            <div>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 7 }}>Meta Description</label>
              <textarea
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
              />
              <p style={{ fontSize: 11, color: metaDesc.length > 155 ? C.danger : C.muted, marginTop: 5 }}>
                {metaDesc.length}/155 characters recommended
              </p>
            </div>
          </FieldGroup>
        </div>
      )}

      {/* ══ SHIPPING ════════════════════════════════════════════════════ */}
      {tab === 'shipping' && (
        <div style={{ maxWidth: 640 }}>
          <FieldGroup title="🚚 Default Delivery">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field label="Free Shipping Above (৳)" value={freeShippingThreshold} onChange={setFreeShippingThreshold} prefix={<DollarSign size={13} />} note="0 = always charge" />
              <Field label="Default Shipping Fee (৳)" value={defaultShippingFee} onChange={setDefaultShippingFee} />
              <Field label="Inside Dhaka (Days)" value={estimatedDaysInside} onChange={setEstimatedDaysInside} placeholder="2-3" suffix="days" />
              <Field label="Outside Dhaka (Days)" value={estimatedDaysOutside} onChange={setEstimatedDaysOutside} placeholder="4-6" suffix="days" />
            </div>
          </FieldGroup>

          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 22px', borderBottom: `1px solid ${C.border}`, background: C.elevated }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text }}>📍 Shipping Zones</h3>
              <button
                onClick={() => setAddingZone(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: C.accent, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
              >
                <Plus size={12} /> Add Zone
              </button>
            </div>

            {zones.map((zone, i) => (
              <div
                key={zone.id}
                style={{ display: 'grid', gridTemplateColumns: '1fr 160px 120px 40px', gap: 16, alignItems: 'center', padding: '14px 22px', borderBottom: i < zones.length - 1 ? `1px solid ${C.border}` : 'none' }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>{zone.name}</p>
                  <p style={{ fontSize: 11, color: C.muted }}>{zone.districts}</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 700, color: C.accent }}>৳{zone.fee}</p>
                  <p style={{ fontSize: 10, color: C.muted }}>Free above ৳{zone.freeAbove.toLocaleString()}</p>
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: `${C.success}15`, color: C.success, border: `1px solid ${C.success}30`, textAlign: 'center' }}>Active</span>
                <button onClick={() => deleteZone(zone.id)} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer', color: C.muted, transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.danger; e.currentTarget.style.color = C.danger; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}

            {addingZone && (
              <div style={{ padding: '20px 22px', borderTop: `1px solid ${C.border}`, background: `${C.accent}05` }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  {[
                    { label: 'Zone Name', key: 'name', placeholder: 'e.g. Chittagong City' },
                    { label: 'Districts / Areas', key: 'districts', placeholder: 'District 1, District 2...' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>{f.label}</label>
                      <input
                        type="text"
                        placeholder={f.placeholder}
                        value={(newZone as any)[f.key]}
                        onChange={(e) => setNewZone({ ...newZone, [f.key]: e.target.value })}
                        style={inputStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                      />
                    </div>
                  ))}
                  {[
                    { label: 'Shipping Fee (৳)', key: 'fee' },
                    { label: 'Free Above (৳)', key: 'freeAbove' },
                  ].map((f) => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>{f.label}</label>
                      <input
                        type="number"
                        value={(newZone as any)[f.key]}
                        onChange={(e) => setNewZone({ ...newZone, [f.key]: Number(e.target.value) })}
                        style={inputStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={addZone} style={{ padding: '8px 18px', background: C.accent, border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Check size={13} /> Add Zone
                  </button>
                  <button onClick={() => setAddingZone(false)} style={{ padding: '8px 14px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, color: C.muted, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ PAYMENT ═════════════════════════════════════════════════════ */}
      {tab === 'payment' && (
        <div style={{ maxWidth: 640 }}>
          <FieldGroup title="💳 Accepted Payment Methods">
            <Toggle label="Cash on Delivery (COD)" desc="Customer pays upon receiving the order" checked={acceptCOD} onChange={setAcceptCOD} />
            <Toggle label="bKash" desc="Mobile banking — most popular in Bangladesh" checked={acceptBkash} onChange={setAcceptBkash} />
            <Toggle label="Nagad" desc="Government-backed mobile banking" checked={acceptNagad} onChange={setAcceptNagad} />
            <Toggle label="Credit / Debit Card" desc="SSL Commerz gateway integration" checked={acceptCard} onChange={setAcceptCard} />
          </FieldGroup>

          {acceptBkash && (
            <FieldGroup title="📱 bKash Configuration">
              <Field label="Merchant bKash Number" prefix={<Phone size={13} />} value={bkashNumber} onChange={setBkashNumber} placeholder="01XXXXXXXXX" note="Customers will send payment to this number" />
            </FieldGroup>
          )}

          {acceptNagad && (
            <FieldGroup title="📱 Nagad Configuration">
              <Field label="Merchant Nagad Number" prefix={<Phone size={13} />} value={nagadNumber} onChange={setNagadNumber} placeholder="01XXXXXXXXX" />
            </FieldGroup>
          )}

          {acceptCOD && (
            <FieldGroup title="🏷️ COD Settings">
              <Field label="Maximum COD Order Value (৳)" value={codLimit} onChange={setCodLimit} prefix={<DollarSign size={13} />} note="Orders above this amount will not be eligible for COD" />
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px', background: `${C.warning}08`, border: `1px solid ${C.warning}25`, borderRadius: 8 }}>
                <AlertCircle size={14} style={{ color: C.warning, flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>
                  COD orders have a higher cancellation risk. Consider requiring a partial advance payment for orders above ৳3,000.
                </p>
              </div>
            </FieldGroup>
          )}

          {acceptCard && (
            <FieldGroup title="💳 Card / Gateway">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', background: `${C.info}08`, border: `1px solid rgba(96,165,250,0.25)`, borderRadius: 8 }}>
                <Shield size={14} style={{ color: '#60A5FA', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: C.textSec, lineHeight: 1.6 }}>
                  Card payments require SSL Commerz integration. Contact support to enable live gateway credentials.
                </p>
              </div>
              <Field label="SSL Commerz Store ID" value="" onChange={() => {}} placeholder="your_store_id" />
              <Field label="SSL Commerz Store Password" type="password" value="" onChange={() => {}} placeholder="••••••••••" />
            </FieldGroup>
          )}
        </div>
      )}

      {/* ══ NOTIFICATIONS ═══════════════════════════════════════════════ */}
      {tab === 'notifications' && (
        <div style={{ maxWidth: 640 }}>
          <FieldGroup title="🔔 Admin Notifications">
            <Toggle label="New Order Alert" desc="Receive notification when a new order is placed" checked={notifyNewOrder} onChange={setNotifyNewOrder} />
            <Toggle label="Low Stock Alert" desc={`Alert when product stock falls below ${lowStockThreshold} units`} checked={notifyLowStock} onChange={setNotifyLowStock} />
            <Toggle label="New Review Alert" desc="Notification when a customer submits a review" checked={notifyNewReview} onChange={setNotifyNewReview} />
            <Toggle label="New Customer Alert" desc="Notification when a new customer registers" checked={notifyNewCustomer} onChange={setNotifyNewCustomer} />
          </FieldGroup>

          {notifyLowStock && (
            <FieldGroup title="📦 Stock Threshold">
              <Field label="Low Stock Threshold (Units)" value={lowStockThreshold} onChange={setLowStockThreshold} suffix="units" note="You'll be alerted when any product stock reaches this level" />
            </FieldGroup>
          )}

          <FieldGroup title="📧 Notification Email">
            <Field label="Admin Notification Email" prefix={<Mail size={13} />} value={adminNotifEmail} onChange={setAdminNotifEmail} placeholder="admin@beautyglowry.com" note="All admin alerts will be sent to this address" />
          </FieldGroup>

          <FieldGroup title="📨 Customer Notifications">
            <Toggle label="Order Confirmation Email" desc="Automatically send confirmation when order is placed" checked={orderConfirmEmail} onChange={setOrderConfirmEmail} />
            <Toggle label="Shipping Update SMS" desc="Send SMS when order status changes to 'Shipped'" checked={orderShippedSMS} onChange={setOrderShippedSMS} />
          </FieldGroup>
        </div>
      )}
    </div>
  );
}
