'use client';

import React, { useState, useEffect } from 'react';
import {
  Store, Truck, Bell, Shield, Save, Check,
  Plus, Trash2, Globe, Mail, Phone, MapPin,
  CreditCard, Package, AlertCircle, DollarSign,
  Users, UserPlus, Activity, Copy, Lock, Unlock, ArrowLeft, Eye
} from 'lucide-react';
import { getAuthHeaders } from '../utils';

const C = {
  bg: '#0F0F0D',
  surface: '#1A1A17', elevated: '#222220', border: 'rgba(255,255,255,0.07)',
  borderHover: 'rgba(255,255,255,0.13)',
  text: '#F0EBE3', textSec: '#B0A8A0', muted: '#7A7470',
  accent: '#C9956D', success: '#4CAF82', warning: '#F0A54B', danger: '#E05A5A', info: '#60A5FA',
};


type SettingsTab = 'store' | 'shipping' | 'payment' | 'notifications' | 'team';

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

  // ─── Team & Moderators State ──────────────────────────────────────────
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [moderators, setModerators] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  
  const [selectedMod, setSelectedMod] = useState<any | null>(null);
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [newInvitePerms, setNewInvitePerms] = useState<string[]>(['Dashboard']);
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const loadTeamData = async () => {
    if (typeof window === 'undefined') return;
    const sessionStr = localStorage.getItem('bg_admin_session');
    if (sessionStr) {
      setCurrentSession(JSON.parse(sessionStr));
    }
    try {
      const modsRes = await fetch('/api/team/moderators');
      if (modsRes.ok) setModerators(await modsRes.json());
      
      const invsRes = await fetch('/api/team/invitations');
      if (invsRes.ok) setInvitations(await invsRes.json());
      
      const logsRes = await fetch('/api/team/logs');
      if (logsRes.ok) setAuditLogs(await logsRes.json());
    } catch (e) {
      console.error('Failed to load team data from database:', e);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, []);

  const generateInvitation = async () => {
    if (!newInviteEmail) return;
    
    const token = btoa(JSON.stringify({
      email: newInviteEmail.trim(),
      permissions: newInvitePerms
    }));
    
    try {
      const res = await fetch('/api/team/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newInviteEmail.trim(),
          token,
          permissions: newInvitePerms,
        }),
      });

      if (res.ok) {
        const newInv = await res.json();
        setInvitations([...invitations, newInv]);
        const link = window.location.origin + '/admin/register?token=' + token;
        setGeneratedLink(link);
        setNewInviteEmail('');
      } else {
        alert('Failed to generate invitation.');
      }
    } catch (e) {
      console.error(e);
      alert('Connection error. Failed to generate invitation.');
    }
  };

  const toggleModeratorStatus = async (id: string) => {
    const mod = moderators.find((m) => m.id === id);
    if (!mod) return;
    const newStatus = mod.status === 'Active' ? 'Inactive' : 'Active';

    try {
      const res = await fetch('/api/team/moderators', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        const updatedMods = moderators.map((m) => (m.id === id ? updated : m));
        setModerators(updatedMods);
        if (selectedMod && selectedMod.id === id) {
          setSelectedMod(updated);
        }
      } else {
        alert('Failed to toggle status.');
      }
    } catch (e) {
      console.error(e);
      alert('Connection error.');
    }
  };

  const updateModeratorPermissions = async (id: string, perms: string[]) => {
    try {
      const res = await fetch('/api/team/moderators', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, permissions: perms }),
      });

      if (res.ok) {
        const updated = await res.json();
        const updatedMods = moderators.map((m) => (m.id === id ? updated : m));
        setModerators(updatedMods);
        if (selectedMod && selectedMod.id === id) {
          setSelectedMod(updated);
        }
      } else {
        alert('Failed to update permissions.');
      }
    } catch (e) {
      console.error(e);
      alert('Connection error.');
    }
  };

  const deleteModerator = async (id: string) => {
    if (!confirm('Are you sure you want to remove this moderator?')) return;
    try {
      const res = await fetch(`/api/team/moderators?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setModerators(moderators.filter((m) => m.id !== id));
        setSelectedMod(null);
      } else {
        alert('Failed to remove moderator.');
      }
    } catch (e) {
      console.error(e);
      alert('Connection error.');
    }
  };

  const deleteInvitation = async (id: string) => {
    try {
      const res = await fetch(`/api/team/invitations?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setInvitations(invitations.filter((i) => i.id !== id));
      } else {
        alert('Failed to revoke invitation.');
      }
    } catch (e) {
      console.error(e);
      alert('Connection error.');
    }
  };

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
  const [googleSiteVerification, setGoogleSiteVerification] = useState('');
  const [bingSiteVerification, setBingSiteVerification] = useState('');

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

  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch('/api/admin/store-config');
        if (res.ok) {
          const config = await res.json();
          if (config.storeName) setStoreName(config.storeName);
          if (config.storeTagline) setStoreTagline(config.storeTagline);
          if (config.storeEmail) setStoreEmail(config.storeEmail);
          if (config.storePhone) setStorePhone(config.storePhone);
          if (config.storeAddress) setStoreAddress(config.storeAddress);
          if (config.currency) setCurrency(config.currency);
          if (config.language) setLanguage(config.language);
          if (config.metaTitle) setMetaTitle(config.metaTitle);
          if (config.metaDesc) setMetaDesc(config.metaDesc);
          if (config.googleSiteVerification) setGoogleSiteVerification(config.googleSiteVerification);
          if (config.bingSiteVerification) setBingSiteVerification(config.bingSiteVerification);
          if (config.freeShippingThreshold) setFreeShippingThreshold(config.freeShippingThreshold);
          if (config.defaultShippingFee) setDefaultShippingFee(config.defaultShippingFee);
          if (config.estimatedDaysInside) setEstimatedDaysInside(config.estimatedDaysInside);
          if (config.estimatedDaysOutside) setEstimatedDaysOutside(config.estimatedDaysOutside);
          if (config.acceptCOD !== undefined) setAcceptCOD(config.acceptCOD);
          if (config.acceptBkash !== undefined) setAcceptBkash(config.acceptBkash);
          if (config.acceptNagad !== undefined) setAcceptNagad(config.acceptNagad);
          if (config.acceptCard !== undefined) setAcceptCard(config.acceptCard);
          if (config.bkashNumber) setBkashNumber(config.bkashNumber);
          if (config.nagadNumber) setNagadNumber(config.nagadNumber);
          if (config.codLimit) setCodLimit(config.codLimit);
          if (config.notifyNewOrder !== undefined) setNotifyNewOrder(config.notifyNewOrder);
          if (config.notifyLowStock !== undefined) setNotifyLowStock(config.notifyLowStock);
          if (config.notifyNewReview !== undefined) setNotifyNewReview(config.notifyNewReview);
          if (config.notifyNewCustomer !== undefined) setNotifyNewCustomer(config.notifyNewCustomer);
          if (config.lowStockThreshold) setLowStockThreshold(config.lowStockThreshold);
          if (config.adminNotifEmail) setAdminNotifEmail(config.adminNotifEmail);
          if (config.orderConfirmEmail !== undefined) setOrderConfirmEmail(config.orderConfirmEmail);
          if (config.orderShippedSMS !== undefined) setOrderShippedSMS(config.orderShippedSMS);
          if (Array.isArray(config.zones)) setZones(config.zones);
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch('/api/admin/store-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          storeName,
          storeTagline,
          storeEmail,
          storePhone,
          storeAddress,
          currency,
          language,
          metaTitle,
          metaDesc,
          googleSiteVerification,
          bingSiteVerification,
          freeShippingThreshold,
          defaultShippingFee,
          estimatedDaysInside,
          estimatedDaysOutside,
          acceptCOD,
          acceptBkash,
          acceptNagad,
          acceptCard,
          bkashNumber,
          nagadNumber,
          codLimit,
          notifyNewOrder,
          notifyLowStock,
          notifyNewReview,
          notifyNewCustomer,
          lowStockThreshold,
          adminNotifEmail,
          orderConfirmEmail,
          orderShippedSMS,
          zones,
        }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        alert('Failed to save settings.');
      }
    } catch (e) {
      console.error(e);
      alert('Connection error.');
    }
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

  if (loadingSettings) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', color: C.muted, fontSize: 13 }}>
        Loading configurations...
      </div>
    );
  }

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
        {currentSession?.role === 'admin' && (
          <TabBtn active={tab === 'team'} icon={<Users size={14} />} label="Team & Moderators" onClick={() => setTab('team')} />
        )}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 8 }}>
              <Field label="Google Search Console Verification Code" value={googleSiteVerification} onChange={setGoogleSiteVerification} placeholder="e.g. google-site-verification-abc123xyz" note="Found in Google Search Console HTML tag method" />
              <Field label="Bing Webmaster Verification Code" value={bingSiteVerification} onChange={setBingSiteVerification} placeholder="e.g. msvalidate.01 code" note="Found in Bing Webmaster Tools HTML meta tag" />
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

      {/* ══ TEAM & MODERATORS ══════════════════════════════════════════ */}
      {tab === 'team' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {selectedMod ? (
            /* Moderator Profile activity logs and details view */
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
              {/* Back Button and Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: 16, marginBottom: 20 }}>
                <button
                  onClick={() => setSelectedMod(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, padding: '6px 12px', color: C.muted, cursor: 'pointer', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = C.accent}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
                >
                  <ArrowLeft size={14} /> Back to Directory
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                    background: selectedMod.status === 'Active' ? 'rgba(76,175,130,0.15)' : 'rgba(224,90,90,0.15)',
                    color: selectedMod.status === 'Active' ? C.success : C.danger,
                    border: `1px solid ${selectedMod.status === 'Active' ? C.success : C.danger}30`
                  }}>
                    {selectedMod.status.toUpperCase()}
                  </span>
                  <button
                    onClick={() => deleteModerator(selectedMod.id)}
                    style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', padding: 4 }}
                    title="Remove moderator"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Profile Details Column */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
                {/* Left col: Profile summary card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, textAlign: 'center' }}>
                    <div style={{
                      width: 64, height: 64, borderRadius: '50%',
                      background: selectedMod.status === 'Active' ? `linear-gradient(135deg, ${C.success}, #3b8e64)` : `linear-gradient(135deg, ${C.muted}, #555)`,
                      margin: '0 auto 12px', display: 'flex', alignItems: 'center',
                      fontSize: 24, fontWeight: 700, color: '#fff', justifyContent: 'center'
                    }}>
                      {selectedMod.name[0].toUpperCase()}
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{selectedMod.name}</h3>
                    <p style={{ fontSize: 12, color: C.muted, wordBreak: 'break-all', marginTop: 4 }}>{selectedMod.email}</p>
                    <p style={{ fontSize: 10, color: C.muted, marginTop: 10 }}>Joined: {new Date(selectedMod.created_at).toLocaleDateString()}</p>
                  </div>

                  {/* Permissions Settings Panel */}
                  <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Shield size={13} /> Permissions Access
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {['Dashboard', 'Products', 'Orders', 'Customers', 'Reviews', 'Marketing', 'Settings'].map((perm) => {
                        const hasPerm = selectedMod.permissions.includes(perm);
                        const togglePerm = () => {
                          const nextPerms = hasPerm
                            ? selectedMod.permissions.filter((p: string) => p !== perm)
                            : [...selectedMod.permissions, perm];
                          updateModeratorPermissions(selectedMod.id, nextPerms);
                        };
                        return (
                          <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: C.textSec, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={hasPerm}
                              onChange={togglePerm}
                              style={{ accentColor: C.accent }}
                            />
                            {perm}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quick Controls Card */}
                  <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: C.text, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
                      ⚙️ Account Settings
                    </h4>
                    <button
                      onClick={() => toggleModeratorStatus(selectedMod.id)}
                      style={{
                        width: '100%', padding: '9px', borderRadius: 6, fontWeight: 700, fontSize: 12, cursor: 'pointer',
                        background: selectedMod.status === 'Active' ? 'rgba(224,90,90,0.1)' : 'rgba(76,175,130,0.1)',
                        color: selectedMod.status === 'Active' ? C.danger : C.success,
                        border: `1px solid ${selectedMod.status === 'Active' ? C.danger : C.success}30`,
                        transition: 'all 0.15s',
                        fontFamily: "'DM Sans', sans-serif"
                      }}
                    >
                      {selectedMod.status === 'Active' ? (
                        <><Lock size={12} style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }} /> Deactivate Account</>
                      ) : (
                        <><Unlock size={12} style={{ marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }} /> Activate Account</>
                      )}
                    </button>
                  </div>
                </div>

                {/* Right col: Audit Activity Logs list */}
                <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: 22, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Activity size={15} style={{ color: C.accent }} /> Moderator Activity Trail
                  </h3>
                  
                  {/* Timeline Logs Container */}
                  <div style={{ flex: 1, maxHeight: 450, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingRight: 6 }}>
                    {auditLogs.filter((log) => log.moderatorEmail.toLowerCase() === selectedMod.email.toLowerCase()).length === 0 ? (
                      <div style={{ padding: '40px 0', textAlign: 'center', color: C.muted, fontSize: 13 }}>
                        No activities logged for this moderator yet.
                      </div>
                    ) : (
                      auditLogs
                        .filter((log) => log.moderatorEmail.toLowerCase() === selectedMod.email.toLowerCase())
                        .map((log) => (
                          <div key={log.id} style={{ display: 'flex', gap: 12, borderBottom: `1px solid ${C.border}`, paddingBottom: 12 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.03)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.accent, flexShrink: 0
                            }}>
                              <Activity size={13} />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <p style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{log.action}</p>
                                <span style={{ fontSize: 10, color: C.muted }}>
                                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · {new Date(log.timestamp).toLocaleDateString()}
                                </span>
                              </div>
                              <p style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>{log.details}</p>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Directory list and Invite forms */
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 20 }}>
              {/* Left col: Invite Team and Pending invites */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Invitation Card */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserPlus size={15} style={{ color: C.accent }} /> Invite Moderator
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Email Address</label>
                      <input
                        type="email"
                        placeholder="moderator@beautyglowry.com"
                        value={newInviteEmail}
                        onChange={(e) => setNewInviteEmail(e.target.value)}
                        style={inputStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                      />
                    </div>

                    {/* Permissions checklist */}
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Assign Access Permissions</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: 10, background: C.elevated, borderRadius: 8, border: `1px solid ${C.border}` }}>
                        {['Dashboard', 'Products', 'Orders', 'Customers', 'Reviews', 'Marketing', 'Settings'].map((perm) => {
                          const isChecked = newInvitePerms.includes(perm);
                          const handleCheck = () => {
                            if (isChecked) {
                              setNewInvitePerms(newInvitePerms.filter((p) => p !== perm));
                            } else {
                              setNewInvitePerms([...newInvitePerms, perm]);
                            }
                          };
                          return (
                            <label key={perm} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: C.textSec, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={handleCheck}
                                style={{ accentColor: C.accent }}
                              />
                              {perm}
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      onClick={generateInvitation}
                      disabled={!newInviteEmail || newInvitePerms.length === 0}
                      style={{
                        padding: '10px', background: (!newInviteEmail || newInvitePerms.length === 0) ? C.muted : C.accent,
                        border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer',
                        transition: 'background 0.2s', marginTop: 4, fontFamily: "'DM Sans', sans-serif"
                      }}
                    >
                      Generate Invite Link
                    </button>
                  </div>

                  {/* Generated Link Display */}
                  {generatedLink && (
                    <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(201,149,109,0.05)', border: `1px solid rgba(201,149,109,0.25)`, borderRadius: 8 }}>
                      <p style={{ fontSize: 11, color: C.accent, fontWeight: 700, marginBottom: 6 }}>Invitation Generated Successfully!</p>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input
                          type="text"
                          readOnly
                          value={generatedLink}
                          style={{
                            flex: 1, padding: '6px 8px', background: C.bg, border: `1px solid ${C.border}`,
                            borderRadius: 4, fontSize: 11, color: C.text, fontFamily: "'DM Mono', monospace", outline: 'none'
                          }}
                        />
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(generatedLink);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          }}
                          style={{
                            padding: '6px 12px', background: copied ? C.success : C.elevated, border: `1px solid ${C.border}`,
                            borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'DM Sans', sans-serif"
                          }}
                        >
                          {copied ? 'Copied' : <><Copy size={11} /> Copy</>}
                        </button>
                      </div>
                      <p style={{ fontSize: 9, color: C.muted, marginTop: 6 }}>Provide this registration link to the moderator via email or chat.</p>
                    </div>
                  )}
                </div>

                {/* Pending Invites list */}
                <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 14 }}>📨 Pending Invitations</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {invitations.length === 0 ? (
                      <p style={{ fontSize: 11, color: C.muted, textAlign: 'center', padding: '10px 0' }}>No pending invitations.</p>
                    ) : (
                      invitations.map((inv) => (
                        <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 7 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.email}</p>
                            <p style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
                              Access: {inv.permissions.join(', ')}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 8 }}>
                            <button
                              onClick={() => {
                                const link = window.location.origin + '/admin/register?token=' + inv.token;
                                navigator.clipboard.writeText(link);
                                alert('Register Link copied to clipboard!');
                              }}
                              style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontSize: 10, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}
                              title="Copy Register Link"
                            >
                              Link
                            </button>
                            <button
                              onClick={() => deleteInvitation(inv.id)}
                              style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', padding: 4 }}
                              title="Revoke invitation"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Right col: Moderators list */}
              <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 16 }}>👥 Team Moderators Directory</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {moderators.length === 0 ? (
                    <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', padding: '40px 0' }}>No team moderators registered yet.</p>
                  ) : (
                    moderators.map((mod) => {
                      const modLogs = auditLogs.filter((l) => l.moderatorEmail.toLowerCase() === mod.email.toLowerCase());
                      return (
                        <div key={mod.id} style={{
                          display: 'flex', gap: 12, padding: 12, background: C.elevated, border: `1px solid ${C.border}`,
                          borderRadius: 8, transition: 'all 0.15s'
                        }}>
                          {/* Profile Avatar initial */}
                          <div style={{
                            width: 34, height: 34, borderRadius: '50%',
                            background: mod.status === 'Active' ? `linear-gradient(135deg, ${C.success}, #3b8e64)` : `linear-gradient(135deg, ${C.muted}, #555)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0
                          }}>
                            {mod.name[0].toUpperCase()}
                          </div>
                          
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                              <div style={{ minWidth: 0 }}>
                                <h4 style={{ fontSize: 12, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.name}</h4>
                                <p style={{ fontSize: 11, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.email}</p>
                              </div>
                              
                              {/* Active/Inactive Switch Toggle */}
                              <button
                                onClick={() => toggleModeratorStatus(mod.id)}
                                style={{
                                  padding: '3px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, cursor: 'pointer',
                                  background: mod.status === 'Active' ? 'rgba(76,175,130,0.15)' : 'rgba(255,255,255,0.05)',
                                  color: mod.status === 'Active' ? C.success : C.muted,
                                  border: `1px solid ${mod.status === 'Active' ? C.success : C.border}25`,
                                  transition: 'all 0.15s',
                                  fontFamily: "'DM Sans', sans-serif"
                                }}
                              >
                                {mod.status.toUpperCase()}
                              </button>
                            </div>

                            {/* Perm badges */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                              {mod.permissions.map((p: string) => (
                                <span key={p} style={{ fontSize: 9, padding: '2px 6px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C.border}`, borderRadius: 4, color: C.textSec }}>
                                  {p}
                                </span>
                              ))}
                            </div>

                            {/* View profile button & actions footer */}
                            <div style={{ borderTop: `1px solid ${C.border}`, marginTop: 10, paddingTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: 10, color: C.muted }}>
                                {modLogs.length} action{modLogs.length !== 1 ? 's' : ''} logged
                              </span>
                              
                              <button
                                onClick={() => setSelectedMod(mod)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: `1px solid ${C.border}`,
                                  borderRadius: 5, padding: '3px 8px', fontSize: 10, fontWeight: 600, color: C.accent, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = C.accent}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = C.border}
                              >
                                <Eye size={10} /> View Trail
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
