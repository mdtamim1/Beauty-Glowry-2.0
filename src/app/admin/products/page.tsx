'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Check, ChevronDown,
  Package, AlertTriangle, Save, Star, LayoutGrid,
  Flame, Sparkles, Leaf, Heart, Target, Eye,
  Image as ImageIcon, Settings, Tag, Layers, ChevronUp,
} from 'lucide-react';
import { products as initialProducts, Product, categories, brands } from '../../../data/products';
import { logActivity, getAuthHeaders } from '../utils';

/* ─── Image Compression ─────────────────────────────────────────────────── */
function compressImage(file: File, quality = 0.82, maxWidth = 1600): Promise<File> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.FileReader || !window.HTMLCanvasElement) { resolve(file); return; }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width; let height = img.height;
        if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(file); return; }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          if (blob) {
            const dotIndex = file.name.lastIndexOf('.');
            const baseName = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
            resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg', lastModified: Date.now() }));
          } else { resolve(file); }
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

/* ─── Color constants ────────────────────────────────────────────────────── */
const C = {
  bg: '#0F0F0D', surface: '#1A1A17', elevated: '#222220',
  border: 'rgba(255,255,255,0.07)', borderHover: 'rgba(255,255,255,0.13)',
  text: '#F0EBE3', textSec: '#B0A8A0', muted: '#7A7470',
  accent: '#C9956D', success: '#4CAF82', warning: '#F0A54B', danger: '#E05A5A',
};

/* ─── Default form state ─────────────────────────────────────────────────── */
const EMPTY_FORM = {
  name: '', brand: 'beauty-glowry', category: '', sku: '',
  price: 1000, originalPrice: 1200, stock: 20,
  isBestseller: false, isNew: false, isFeatured: false,
  isActive: true, isFreeDelivery: false,
  description: '', image: '',
  skinTypes: [] as string[],
  concerns: [] as string[],
  inciList: '',
  usageSteps: [''] as string[],
  actives: [] as { name: string; concentration: string; unit: string }[],
  variants: [] as { label: string; price: string; stock: string; sku: string }[],
  hasVariants: false,
  galleryImages: [] as string[],
  size: '30ml', weight: '32g', shelfLife: '24 months', madeIn: 'Bangladesh',
};
type FormData = typeof EMPTY_FORM;

/* ─── Reusable Input ─────────────────────────────────────────────────────── */
function Input({ label, type = 'text', value, onChange, placeholder, required, hint, rows = 3 }: any) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>
          {label}{required && <span style={{ color: C.danger }}> *</span>}
        </label>
        {hint && <span style={{ fontSize: 10, color: C.muted, fontStyle: 'italic' }}>{hint}</span>}
      </div>
      {type === 'textarea' ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
          style={{ width: '100%', padding: '10px 12px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, fontFamily: "'DM Sans', sans-serif", resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
      ) : (
        <input type={type} value={value}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%', padding: '10px 12px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, fontFamily: "'DM Sans', sans-serif", outline: 'none', boxSizing: 'border-box' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
      )}
    </div>
  );
}

/* ─── Image Upload Button ─────────────────────────────────────────────────── */
function ImageUploadBtn({ onUrl, productName }: { onUrl: (url: string) => void; productName?: string }) {
  const [uploading, setUploading] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button type="button" disabled={uploading} style={{ padding: '9px 14px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 12, fontWeight: 600, color: uploading ? C.muted : C.textSec, cursor: uploading ? 'wait' : 'pointer', whiteSpace: 'nowrap' }}>
        {uploading ? '⏳ Uploading...' : '⬆ Upload'}
      </button>
      <input type="file" accept="image/*" disabled={uploading}
        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%' }}
        onChange={async (e) => {
          const file = e.target.files?.[0]; if (!file) return;
          setUploading(true);
          try {
            const compressed = await compressImage(file, 0.82, 1600);
            const fd = new FormData(); fd.append('file', compressed);
            if (productName) fd.append('productName', productName);
            const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
            if (res.ok) { const out = await res.json(); onUrl(out.url); }
            else alert('Upload failed');
          } catch { alert('Upload error'); } finally { setUploading(false); e.target.value = ''; }
        }} />
    </div>
  );
}

/* ─── Tags Manager Panel (generic) ──────────────────────────────────────── */
function TagsManagerPanel({ title, items, onAdd, onDelete, onClose }: {
  title: string; items: string[]; onAdd: (val: string) => void; onDelete: (val: string) => void; onClose: () => void;
}) {
  const [newItem, setNewItem] = useState('');
  return (
    <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50, background: C.surface, border: `1.5px solid ${C.accent}40`, borderRadius: 10, padding: 16, boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>⚙ Manage {title}</p>
        <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 2 }}><X size={14} /></button>
      </div>
      {/* Add new */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)}
          placeholder={`New ${title}...`}
          style={{ flex: 1, padding: '7px 10px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 12, color: C.text, outline: 'none' }}
          onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newItem.trim()) { onAdd(newItem.trim()); setNewItem(''); } } }}
        />
        <button type="button"
          onClick={() => { if (newItem.trim()) { onAdd(newItem.trim()); setNewItem(''); } }}
          disabled={!newItem.trim()}
          style={{ padding: '7px 14px', background: newItem.trim() ? C.accent : C.elevated, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, color: newItem.trim() ? '#fff' : C.muted, cursor: newItem.trim() ? 'pointer' : 'not-allowed' }}>
          + Add
        </button>
      </div>
      {/* Existing items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto' }}>
        {items.map((item) => (
          <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: C.elevated, borderRadius: 6, border: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 12, color: C.text }}>{item}</span>
            <button type="button" onClick={() => onDelete(item)} style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }} title="Delete">
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Modal ──────────────────────────────────────────────────────────────── */
function Modal({
  title, onClose, onSave, form, setForm, isEdit,
  categoriesList, onCategoryCreated, onCategoryDeleted,
  brandsList, onBrandCreated, onBrandDeleted,
  skinConcernOptions, skinTypeOptions,
  onSkinConcernAdded, onSkinConcernDeleted,
  onSkinTypeAdded, onSkinTypeDeleted,
}: {
  title: string; onClose: () => void; onSave: () => void;
  form: FormData; setForm: (f: FormData) => void; isEdit: boolean;
  categoriesList: { id: string; name: string }[];
  onCategoryCreated: (c: { id: string; name: string }) => void;
  onCategoryDeleted: (id: string) => void;
  brandsList: { id: string; name: string; logo?: string; description?: string }[];
  onBrandCreated: (b: { id: string; name: string; logo?: string; description?: string }) => void;
  onBrandDeleted: (id: string) => void;
  skinConcernOptions: string[];
  skinTypeOptions: string[];
  onSkinConcernAdded: (v: string) => void;
  onSkinConcernDeleted: (v: string) => void;
  onSkinTypeAdded: (v: string) => void;
  onSkinTypeDeleted: (v: string) => void;
}) {
  const update = (key: keyof FormData, val: any) => setForm({ ...form, [key]: val });
  const [activeTab, setActiveTab] = useState<'basic' | 'skin' | 'advanced'>('basic');

  // Modals for manager panels
  const [showCatManager, setShowCatManager] = useState(false);
  const [showBrandManager, setShowBrandManager] = useState(false);
  const [showConcernManager, setShowConcernManager] = useState(false);
  const [showSkinTypeManager, setShowSkinTypeManager] = useState(false);

  // Category create inline
  const [newCatName, setNewCatName] = useState('');
  const [savingCat, setSavingCat] = useState(false);
  // Brand create inline
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandLogo, setNewBrandLogo] = useState('✦');
  const [newBrandDesc, setNewBrandDesc] = useState('');
  const [savingBrand, setSavingBrand] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setSavingCat(true);
    try {
      const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ name: newCatName.trim() }) });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      onCategoryCreated({ id: data.id, name: data.name });
      update('category', data.name);
      setNewCatName('');
      setShowCatManager(false);
    } catch { alert('Failed to create category'); }
    finally { setSavingCat(false); }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Delete this category? Products using it will be uncategorized.')) return;
    try {
      const res = await fetch(`/api/categories?id=${catId}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed');
      onCategoryDeleted(catId);
    } catch { alert('Failed to delete category'); }
  };

  const handleCreateBrand = async () => {
    if (!newBrandName.trim()) return;
    setSavingBrand(true);
    try {
      const res = await fetch('/api/brands', { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ name: newBrandName.trim(), logo: newBrandLogo.trim(), description: newBrandDesc.trim() }) });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      onBrandCreated({ id: data.id, name: data.name, logo: data.logo || '', description: data.description || '' });
      update('brand', data.id);
      setNewBrandName(''); setNewBrandDesc('');
      setShowBrandManager(false);
    } catch { alert('Failed to create brand'); }
    finally { setSavingBrand(false); }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm('Delete this brand?')) return;
    try {
      const res = await fetch(`/api/brands?id=${brandId}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) throw new Error('Failed');
      onBrandDeleted(brandId);
    } catch { alert('Failed to delete brand'); }
  };

  // Variants helpers
  const addVariantRow = () => update('variants', [...form.variants, { label: '', price: String(form.price), stock: String(form.stock), sku: '' }]);
  const updateVariant = (i: number, key: string, val: string) => {
    const next = [...form.variants]; (next[i] as any)[key] = val; update('variants', next);
  };
  const removeVariant = (i: number) => update('variants', form.variants.filter((_, idx) => idx !== i));

  // Active Ingredients helpers
  const addActiveRow = () => update('actives', [...form.actives, { name: '', concentration: '', unit: '%' }]);
  const updateActive = (i: number, key: string, val: string) => {
    const next = [...form.actives]; (next[i] as any)[key] = val; update('actives', next);
  };
  const removeActive = (i: number) => update('actives', form.actives.filter((_, idx) => idx !== i));

  // Usage Steps helpers
  const addStep = () => update('usageSteps', [...form.usageSteps, '']);
  const updateStep = (i: number, val: string) => { const next = [...form.usageSteps]; next[i] = val; update('usageSteps', next); };
  const removeStep = (i: number) => update('usageSteps', form.usageSteps.filter((_, idx) => idx !== i));

  // Gallery helpers
  const addGallerySlot = () => update('galleryImages', [...form.galleryImages, '']);
  const updateGallery = (i: number, val: string) => { const next = [...form.galleryImages]; next[i] = val; update('galleryImages', next); };
  const removeGallery = (i: number) => update('galleryImages', form.galleryImages.filter((_, idx) => idx !== i));

  // Toggle helpers
  const toggleConcern = (tag: string) => {
    const next = form.concerns.includes(tag) ? form.concerns.filter((t) => t !== tag) : [...form.concerns, tag];
    update('concerns', next);
  };
  const toggleSkinType = (type: string) => {
    if (type === 'All Skin Types') { update('skinTypes', ['All Skin Types']); return; }
    const filtered = form.skinTypes.filter((t) => t !== 'All Skin Types');
    const next = filtered.includes(type) ? filtered.filter((t) => t !== type) : [...filtered, type];
    update('skinTypes', next);
  };

  const discountPct = form.originalPrice > form.price
    ? Math.round(((form.originalPrice - form.price) / form.originalPrice) * 100)
    : 0;

  const inputBase: React.CSSProperties = { width: '100%', padding: '9px 12px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box', fontFamily: "'DM Sans', sans-serif" };
  const labelBase: React.CSSProperties = { display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 5 };

  const tabs = [
    { key: 'basic', label: '📝 Basic Info' },
    { key: 'skin', label: '🌿 Skin Profile & Placement' },
    { key: 'advanced', label: '🔬 Advanced Details' },
  ] as const;

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.75)' }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 100, width: '96%', maxWidth: 860, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.7)', maxHeight: '94vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 28px', borderBottom: `1px solid ${C.border}`, background: C.bg }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{title}</h2>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Fill in all product details — connected directly to the storefront</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}><X size={20} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, background: C.bg, padding: '0 28px' }}>
          {tabs.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
              style={{ padding: '11px 18px', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === tab.key ? C.accent : 'transparent'}`, fontSize: 12, fontWeight: activeTab === tab.key ? 700 : 500, color: activeTab === tab.key ? C.accent : C.muted, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.15s' }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '22px 28px', overflowY: 'auto', flex: 1 }}>

          {/* ══ TAB 1: BASIC INFO ══════════════════════════════════════════════ */}
          {activeTab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Row: Name */}
              <Input label="Product Name" value={form.name} onChange={(v: string) => update('name', v)} placeholder="e.g. Niacinamide 10% + Zinc 1% Clarifying Serum" required />

              {/* Row: Brand + Category */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                {/* Brand */}
                <div style={{ position: 'relative' }}>
                  <label style={labelBase}>Brand <span style={{ color: C.danger }}>*</span></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={form.brand} onChange={(e) => update('brand', e.target.value)}
                      style={{ ...inputBase, flex: 1 }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}>
                      {brandsList.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowBrandManager(!showBrandManager)}
                      style={{ padding: '0 12px', background: showBrandManager ? `${C.accent}20` : 'none', border: `1px solid ${showBrandManager ? C.accent : C.border}`, borderRadius: 7, color: C.accent, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      ⚙
                    </button>
                  </div>
                  {showBrandManager && (
                    <div style={{ marginTop: 10, padding: 14, background: C.bg, borderRadius: 8, border: `1.5px dashed ${C.accent}40`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Manage Brands</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="text" placeholder="Brand Name" value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} style={{ ...inputBase, flex: 1, padding: '7px 10px' }} />
                        <input type="text" placeholder="Logo/Emoji" value={newBrandLogo} onChange={(e) => setNewBrandLogo(e.target.value)} style={{ ...inputBase, width: 90, padding: '7px 10px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="text" placeholder="Description (optional)" value={newBrandDesc} onChange={(e) => setNewBrandDesc(e.target.value)} style={{ ...inputBase, flex: 1, padding: '7px 10px' }} />
                        <button type="button" onClick={handleCreateBrand} disabled={savingBrand || !newBrandName} style={{ padding: '7px 14px', background: newBrandName ? C.accent : C.elevated, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, color: newBrandName ? '#fff' : C.muted, cursor: newBrandName ? 'pointer' : 'not-allowed' }}>
                          {savingBrand ? '...' : '+ Add'}
                        </button>
                      </div>
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                        {brandsList.map((b) => (
                          <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderRadius: 5 }}>
                            <span style={{ fontSize: 12, color: C.text }}>{b.logo || '✦'} {b.name}</span>
                            <button type="button" onClick={() => handleDeleteBrand(b.id)} style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', padding: 2 }}><Trash2 size={11} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Category */}
                <div style={{ position: 'relative' }}>
                  <label style={labelBase}>Category <span style={{ color: C.danger }}>*</span></label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select value={form.category} onChange={(e) => update('category', e.target.value)}
                      style={{ ...inputBase, flex: 1 }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}>
                      {categoriesList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <button type="button" onClick={() => setShowCatManager(!showCatManager)}
                      style={{ padding: '0 12px', background: showCatManager ? `${C.accent}20` : 'none', border: `1px solid ${showCatManager ? C.accent : C.border}`, borderRadius: 7, color: C.accent, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                      ⚙
                    </button>
                  </div>
                  {showCatManager && (
                    <div style={{ marginTop: 10, padding: 14, background: C.bg, borderRadius: 8, border: `1.5px dashed ${C.accent}40`, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Manage Categories</p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="text" placeholder="New Category Name" value={newCatName} onChange={(e) => setNewCatName(e.target.value)}
                          style={{ ...inputBase, flex: 1, padding: '7px 10px' }}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); } }} />
                        <button type="button" onClick={handleCreateCategory} disabled={savingCat || !newCatName} style={{ padding: '7px 14px', background: newCatName ? C.accent : C.elevated, border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, color: newCatName ? '#fff' : C.muted, cursor: newCatName ? 'pointer' : 'not-allowed' }}>
                          {savingCat ? '...' : '+ Add'}
                        </button>
                      </div>
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                        {categoriesList.map((c) => (
                          <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 8px', borderRadius: 5 }}>
                            <span style={{ fontSize: 12, color: C.text }}>{c.name}</span>
                            <button type="button" onClick={() => handleDeleteCategory(c.id)} style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', padding: 2 }}><Trash2 size={11} /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Row: Pricing */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelBase}>Sale Price (৳) <span style={{ color: C.danger }}>*</span></label>
                  <input type="number" value={form.price} onChange={(e) => update('price', Number(e.target.value))} style={inputBase} onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)} onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
                </div>
                <div>
                  <label style={labelBase}>MRP / Original Price (৳)</label>
                  <input type="number" value={form.originalPrice} onChange={(e) => update('originalPrice', Number(e.target.value))} style={inputBase} onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)} onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
                </div>
                <div>
                  <label style={labelBase}>Stock Qty</label>
                  <input type="number" value={form.stock} onChange={(e) => update('stock', Number(e.target.value))} style={inputBase} onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)} onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
                </div>
                <div>
                  <label style={labelBase}>SKU</label>
                  <input type="text" value={form.sku} onChange={(e) => update('sku', e.target.value)} placeholder="Auto-generated" style={inputBase} onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)} onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
                </div>
              </div>
              {discountPct > 0 && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 14px', background: 'rgba(76,175,130,0.1)', border: `1px solid ${C.success}40`, borderRadius: 7 }}>
                  <span style={{ fontSize: 13, color: C.success, fontWeight: 700 }}>🏷 {discountPct}% OFF</span>
                  <span style={{ fontSize: 12, color: C.muted }}>Customer saves ৳{(form.originalPrice - form.price).toLocaleString()}</span>
                </div>
              )}

              {/* Row: Status toggles */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button type="button" onClick={() => update('isActive', !form.isActive)}
                  style={{ padding: '11px 12px', background: form.isActive ? 'rgba(76,175,130,0.12)' : 'rgba(224,90,90,0.1)', border: `1.5px solid ${form.isActive ? C.success : C.danger}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: form.isActive ? C.success : C.danger, cursor: 'pointer', textAlign: 'center' }}>
                  {form.isActive ? '🟢 Active (Visible in Store)' : '🔴 Inactive (Hidden)'}
                </button>
                <button type="button" onClick={() => update('isFreeDelivery', !form.isFreeDelivery)}
                  style={{ padding: '11px 12px', background: form.isFreeDelivery ? 'rgba(76,175,130,0.12)' : C.elevated, border: `1.5px solid ${form.isFreeDelivery ? C.success : C.border}`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: form.isFreeDelivery ? C.success : C.muted, cursor: 'pointer', textAlign: 'center' }}>
                  {form.isFreeDelivery ? '📦 Free Delivery (Enabled)' : '📦 Standard Shipping'}
                </button>
              </div>

              {/* Row: Main Image */}
              <div>
                <label style={labelBase}>Main Product Image <span style={{ color: C.danger }}>*</span></label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <input type="text" value={form.image} onChange={(e) => update('image', e.target.value)} placeholder="https://..." style={{ ...inputBase, marginBottom: 6 }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                      onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
                    <ImageUploadBtn onUrl={(url) => update('image', url)} productName={form.name} />
                  </div>
                  {form.image && (
                    <div style={{ width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}`, background: C.elevated, flexShrink: 0 }}>
                      <img src={form.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => (e.currentTarget.style.display = 'none')} />
                    </div>
                  )}
                </div>
              </div>

              {/* Row: Gallery Images */}
              <div>
                <label style={labelBase}>Gallery / Additional Images</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '10px', background: 'rgba(0,0,0,0.12)', border: `1px solid ${C.border}`, borderRadius: 8, marginBottom: 6 }}>
                  {form.galleryImages.length === 0 && (
                    <p style={{ fontSize: 12, color: C.muted, textAlign: 'center', padding: '8px 0' }}>No gallery images. Click "+ Add" below.</p>
                  )}
                  {form.galleryImages.map((url, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, color: C.muted, minWidth: 18 }}>#{i + 1}</span>
                      <input type="text" placeholder="https://..." value={url} onChange={(e) => updateGallery(i, e.target.value)}
                        style={{ ...inputBase, flex: 1, padding: '8px 10px' }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
                      <ImageUploadBtn onUrl={(u) => updateGallery(i, u)} productName={form.name} />
                      {url && <img src={url} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', border: `1px solid ${C.border}` }} onError={(e) => (e.currentTarget.style.display = 'none')} />}
                      <button type="button" onClick={() => removeGallery(i)} style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', padding: 4 }}><Trash2 size={14} /></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addGallerySlot}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'none', border: `1px dashed ${C.border}`, borderRadius: 6, fontSize: 12, color: C.textSec, cursor: 'pointer' }}>
                  <Plus size={12} /> Add Gallery Image
                </button>
              </div>

              {/* Row: Description */}
              <Input label="Product Description" type="textarea" value={form.description} onChange={(v: string) => update('description', v)} placeholder="Clinical description of this formulation..." required rows={4} />

              {/* Row: Variants */}
              <div style={{ padding: '18px 20px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${form.hasVariants ? C.accent + '35' : C.border}`, borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: form.hasVariants ? 14 : 0 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: form.hasVariants ? C.accent : C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Size / Variant Pricing</p>
                    <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Multiple sizes with different prices & stock levels</p>
                  </div>
                  <button type="button" onClick={() => update('hasVariants', !form.hasVariants)}
                    style={{ padding: '6px 14px', background: form.hasVariants ? 'rgba(76,175,130,0.15)' : 'rgba(255,255,255,0.04)', border: `1.5px solid ${form.hasVariants ? C.success : C.border}`, borderRadius: 8, fontSize: 12, fontWeight: 700, color: form.hasVariants ? C.success : C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: form.hasVariants ? C.success : C.muted }} />
                    {form.hasVariants ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
                {form.hasVariants && (
                  <div style={{ opacity: 1 }}>
                    {/* Header row */}
                    {form.variants.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', gap: 8, padding: '6px 8px', background: C.bg, borderRadius: 5, fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 6 }}>
                        <div>Size / Label</div><div>Price (৳)</div><div>Stock</div><div>SKU</div><div />
                      </div>
                    )}
                    {form.variants.map((v, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto', gap: 8, marginBottom: 6 }}>
                        {(['label', 'price', 'stock', 'sku'] as const).map((key) => (
                          <input key={key} type={key === 'label' || key === 'sku' ? 'text' : 'number'} value={v[key]}
                            onChange={(e) => updateVariant(i, key, e.target.value)}
                            placeholder={key === 'label' ? 'e.g. 30ml' : key === 'sku' ? 'SKU (opt)' : key === 'price' ? form.price.toString() : form.stock.toString()}
                            style={{ ...inputBase, padding: '8px 10px' }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                            onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
                        ))}
                        <button type="button" onClick={() => removeVariant(i)} style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', padding: 4, alignSelf: 'center' }}><Trash2 size={13} /></button>
                      </div>
                    ))}
                    <button type="button" onClick={addVariantRow}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'none', border: `1px dashed ${C.border}`, borderRadius: 6, fontSize: 12, color: C.textSec, cursor: 'pointer', marginTop: 4 }}>
                      <Plus size={12} /> Add Size
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ TAB 2: SKIN PROFILE & PLACEMENT ══════════════════════════════ */}
          {activeTab === 'skin' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Homepage Section Placement */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>🏠 Homepage Section Placement</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { key: 'isBestseller' as const, label: 'Bestseller 🔥', desc: 'Shown in top bestsellers grid', color: C.accent },
                    { key: 'isNew' as const, label: 'New Arrival ✨', desc: 'Shown in new arrivals strip', color: C.success },
                    { key: 'isFeatured' as const, label: 'Featured ⭐', desc: 'Highlighted hero product', color: C.warning },
                  ].map((s) => {
                    const active = form[s.key];
                    return (
                      <button key={s.key} type="button" onClick={() => update(s.key, !active)}
                        style={{ padding: '14px 12px', background: active ? `${s.color}14` : C.elevated, border: `1.5px solid ${active ? s.color : C.border}`, borderRadius: 10, cursor: 'pointer', textAlign: 'left', position: 'relative', transition: 'all 0.15s' }}>
                        {active && <span style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={9} color="#fff" /></span>}
                        <p style={{ fontSize: 13, fontWeight: 700, color: active ? s.color : C.text, marginBottom: 3 }}>{s.label}</p>
                        <p style={{ fontSize: 10, color: C.muted, lineHeight: 1.4 }}>{s.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Skin Concerns */}
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>
                    🎯 Skin Concerns
                    <span style={{ marginLeft: 8, fontSize: 10, color: C.muted, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>— affects quiz & skin analyzer results</span>
                  </p>
                  <button type="button" onClick={() => setShowConcernManager(!showConcernManager)}
                    style={{ padding: '4px 10px', background: showConcernManager ? `${C.accent}20` : 'none', border: `1px solid ${showConcernManager ? C.accent : C.border}`, borderRadius: 5, fontSize: 11, color: C.accent, fontWeight: 700, cursor: 'pointer' }}>
                    ⚙ Add/Remove Tags
                  </button>
                </div>
                {showConcernManager && (
                  <TagsManagerPanel
                    title="Skin Concern Tags"
                    items={skinConcernOptions}
                    onAdd={onSkinConcernAdded}
                    onDelete={onSkinConcernDeleted}
                    onClose={() => setShowConcernManager(false)}
                  />
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {skinConcernOptions.map((tag) => {
                    const selected = form.concerns.includes(tag);
                    return (
                      <button key={tag} type="button" onClick={() => toggleConcern(tag)}
                        style={{ padding: '7px 14px', background: selected ? `${C.accent}18` : C.elevated, border: `1.5px solid ${selected ? C.accent : C.border}`, borderRadius: 99, fontSize: 12, fontWeight: 600, color: selected ? C.accent : C.muted, cursor: 'pointer', transition: 'all 0.12s' }}>
                        {selected && '✓ '}{tag}
                      </button>
                    );
                  })}
                </div>
                {form.concerns.length > 0 && (
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Selected: <strong style={{ color: C.text }}>{form.concerns.join(', ')}</strong></p>
                )}
              </div>

              {/* Suitable Skin Types */}
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>👤 Suitable Skin Types</p>
                  <button type="button" onClick={() => setShowSkinTypeManager(!showSkinTypeManager)}
                    style={{ padding: '4px 10px', background: showSkinTypeManager ? `${C.accent}20` : 'none', border: `1px solid ${showSkinTypeManager ? C.accent : C.border}`, borderRadius: 5, fontSize: 11, color: C.accent, fontWeight: 700, cursor: 'pointer' }}>
                    ⚙ Add/Remove Types
                  </button>
                </div>
                {showSkinTypeManager && (
                  <TagsManagerPanel
                    title="Skin Types"
                    items={skinTypeOptions}
                    onAdd={onSkinTypeAdded}
                    onDelete={onSkinTypeDeleted}
                    onClose={() => setShowSkinTypeManager(false)}
                  />
                )}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {skinTypeOptions.map((type) => {
                    const sel = form.skinTypes.includes(type);
                    return (
                      <button key={type} type="button" onClick={() => toggleSkinType(type)}
                        style={{ padding: '7px 14px', background: sel ? 'rgba(139,157,119,0.15)' : C.elevated, border: `1.5px solid ${sel ? '#8B9D77' : C.border}`, borderRadius: 99, fontSize: 12, fontWeight: 600, color: sel ? '#A8C090' : C.muted, cursor: 'pointer', transition: 'all 0.12s' }}>
                        {sel && '✓ '}{type}
                      </button>
                    );
                  })}
                </div>
                {form.skinTypes.length > 0 && (
                  <p style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>Selected: <strong style={{ color: C.text }}>{form.skinTypes.join(', ')}</strong></p>
                )}
              </div>

              {/* Quiz Visibility Preview */}
              {(form.concerns.length > 0 || form.skinTypes.length > 0) && (
                <div style={{ background: 'rgba(201,149,109,0.06)', border: '1.5px solid rgba(201,149,109,0.22)', borderRadius: 12, padding: '16px 18px' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: C.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>🧪 Quiz & Skin Analyzer Visibility Preview</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {form.concerns.map((c) => (
                      <span key={c} style={{ fontSize: 11, padding: '4px 10px', background: `${C.success}18`, border: `1px solid ${C.success}40`, borderRadius: 6, color: C.success, fontWeight: 600 }}>
                        ✓ {c}
                      </span>
                    ))}
                    {form.skinTypes.map((t) => (
                      <span key={t} style={{ fontSize: 11, padding: '4px 10px', background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: 6, color: '#93C5FD', fontWeight: 600 }}>
                        👤 {t}
                      </span>
                    ))}
                  </div>
                  {form.concerns.length === 0 && (
                    <p style={{ fontSize: 11, color: C.warning, marginTop: 8 }}>⚠️ No skin concerns set — product won't appear in quiz/analyzer results</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══ TAB 3: ADVANCED DETAILS ═══════════════════════════════════════ */}
          {activeTab === 'advanced' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Active Ingredients — structured rows */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label style={labelBase}>🧪 Key Active Ingredients</label>
                  <button type="button" onClick={addActiveRow}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'none', border: `1px dashed ${C.border}`, borderRadius: 5, fontSize: 11, color: C.textSec, cursor: 'pointer' }}>
                    <Plus size={11} /> Add Ingredient
                  </button>
                </div>
                {form.actives.length === 0 ? (
                  <p style={{ fontSize: 12, color: C.muted, padding: '10px 0' }}>No key actives added yet. Click "+ Add Ingredient".</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px auto', gap: 8, padding: '5px 8px', background: C.bg, borderRadius: 5, fontSize: 9, fontWeight: 700, color: C.muted, textTransform: 'uppercase' }}>
                      <div>Ingredient Name</div><div>Concentration</div><div>Unit</div><div />
                    </div>
                    {form.actives.map((a, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px auto', gap: 8, alignItems: 'center' }}>
                        <input type="text" value={a.name} onChange={(e) => updateActive(i, 'name', e.target.value)} placeholder="e.g. NIACINAMIDE"
                          style={{ ...inputBase, padding: '8px 10px', textTransform: 'uppercase' }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                          onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
                        <input type="text" value={a.concentration} onChange={(e) => updateActive(i, 'concentration', e.target.value)} placeholder="e.g. 10"
                          style={{ ...inputBase, padding: '8px 10px' }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                          onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
                        <select value={a.unit} onChange={(e) => updateActive(i, 'unit', e.target.value)}
                          style={{ ...inputBase, padding: '8px 10px' }}
                          onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                          onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}>
                          <option value="%">%</option>
                          <option value="mg">mg</option>
                          <option value="mcg">mcg</option>
                          <option value="ppm">ppm</option>
                          <option value="g">g</option>
                          <option value="ml">ml</option>
                          <option value="IU">IU</option>
                        </select>
                        <button type="button" onClick={() => removeActive(i)} style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', padding: 4 }}><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* How to Use — line by line */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label style={labelBase}>📋 How to Use (Steps)</label>
                  <button type="button" onClick={addStep}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'none', border: `1px dashed ${C.border}`, borderRadius: 5, fontSize: 11, color: C.textSec, cursor: 'pointer' }}>
                    <Plus size={11} /> Add Step
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.usageSteps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: C.muted, minWidth: 22, textAlign: 'center', fontWeight: 700, background: C.elevated, borderRadius: 4, padding: '4px 0', flexShrink: 0 }}>{i + 1}</span>
                      <input type="text" value={step} onChange={(e) => updateStep(i, e.target.value)} placeholder={`Step ${i + 1} description...`}
                        style={{ ...inputBase, flex: 1, padding: '9px 12px' }}
                        onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                        onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
                      <button type="button" onClick={() => removeStep(i)} disabled={form.usageSteps.length <= 1} style={{ background: 'none', border: 'none', color: form.usageSteps.length > 1 ? C.danger : C.border, cursor: form.usageSteps.length > 1 ? 'pointer' : 'default', padding: 4 }}><Trash2 size={13} /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* INCI List */}
              <Input label="INCI — Full Ingredient List" type="textarea" value={form.inciList} onChange={(v: string) => update('inciList', v)} placeholder="Aqua (Water), Niacinamide, Zinc PCA, Sodium Hyaluronate..." rows={4} />

              {/* Product Specifications */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent, marginBottom: 14, paddingBottom: 10, borderBottom: `1px solid ${C.border}` }}>📦 Product Specifications</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Input label="Size / Volume" value={form.size} onChange={(v: string) => update('size', v)} placeholder="30ml" required />
                  <Input label="Net Weight" value={form.weight} onChange={(v: string) => update('weight', v)} placeholder="32g" />
                  <Input label="Shelf Life" value={form.shelfLife} onChange={(v: string) => update('shelfLife', v)} placeholder="24 months (12M after opening)" />
                  <Input label="Made In" value={form.madeIn} onChange={(v: string) => update('madeIn', v)} placeholder="Bangladesh" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 28px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.bg, gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {form.isBestseller && <span style={{ fontSize: 9, padding: '3px 8px', background: `${C.accent}20`, color: C.accent, borderRadius: 4, fontWeight: 700 }}>🔥 BESTSELLER</span>}
            {form.isNew && <span style={{ fontSize: 9, padding: '3px 8px', background: `${C.success}20`, color: C.success, borderRadius: 4, fontWeight: 700 }}>✨ NEW</span>}
            {form.isFeatured && <span style={{ fontSize: 9, padding: '3px 8px', background: `${C.warning}20`, color: C.warning, borderRadius: 4, fontWeight: 700 }}>⭐ FEATURED</span>}
            {!form.isActive && <span style={{ fontSize: 9, padding: '3px 8px', background: `${C.danger}20`, color: C.danger, borderRadius: 4, fontWeight: 700 }}>🔴 INACTIVE</span>}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" onClick={onClose} style={{ padding: '9px 20px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.muted, cursor: 'pointer' }}>Cancel</button>
            <button type="button" onClick={onSave}
              style={{ padding: '9px 24px', background: C.accent, border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: `0 4px 16px rgba(201,149,109,0.3)` }}>
              <Save size={14} /> {isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | number | null>(null);
  const [dbCategories, setDbCategories] = useState<{ id: string; name: string }[]>([]);
  const [dbBrands, setDbBrands] = useState<{ id: string; name: string; logo?: string; description?: string }[]>([]);
  const [skinConcernOptions, setSkinConcernOptions] = useState<string[]>([]);
  const [skinTypeOptions, setSkinTypeOptions] = useState<string[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.allSettled([
      fetch('/api/products?includeInactive=true').then(r => r.json()).then(data => { if (Array.isArray(data)) setItems(data); }),
      fetch('/api/categories').then(r => r.json()).then(data => { if (Array.isArray(data)) setDbCategories(data.map((c: any) => ({ id: c.id, name: c.name }))); }),
      fetch('/api/brands').then(r => r.json()).then(data => { if (Array.isArray(data)) setDbBrands(data.map((b: any) => ({ id: b.id, name: b.name, logo: b.logo || '', description: b.description || '' }))); }),
      fetch('/api/admin/product-tags').then(r => r.json()).then(data => {
        if (data.skinConcerns) setSkinConcernOptions(data.skinConcerns);
        if (data.skinTypes) setSkinTypeOptions(data.skinTypes);
      }),
    ]);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const saveTagsConfig = useCallback(async (concerns: string[], skinTypes: string[]) => {
    await fetch('/api/admin/product-tags', { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ skinConcerns: concerns, skinTypes }) });
  }, []);

  const handleSkinConcernAdded = useCallback(async (val: string) => {
    if (skinConcernOptions.includes(val)) return;
    const next = [...skinConcernOptions, val];
    setSkinConcernOptions(next);
    await saveTagsConfig(next, skinTypeOptions);
  }, [skinConcernOptions, skinTypeOptions, saveTagsConfig]);

  const handleSkinConcernDeleted = useCallback(async (val: string) => {
    const next = skinConcernOptions.filter((v) => v !== val);
    setSkinConcernOptions(next);
    await saveTagsConfig(next, skinTypeOptions);
  }, [skinConcernOptions, skinTypeOptions, saveTagsConfig]);

  const handleSkinTypeAdded = useCallback(async (val: string) => {
    if (skinTypeOptions.includes(val)) return;
    const next = [...skinTypeOptions, val];
    setSkinTypeOptions(next);
    await saveTagsConfig(skinConcernOptions, next);
  }, [skinConcernOptions, skinTypeOptions, saveTagsConfig]);

  const handleSkinTypeDeleted = useCallback(async (val: string) => {
    const next = skinTypeOptions.filter((v) => v !== val);
    setSkinTypeOptions(next);
    await saveTagsConfig(skinConcernOptions, next);
  }, [skinConcernOptions, skinTypeOptions, saveTagsConfig]);

  const activeCategories = dbCategories.length > 0
    ? dbCategories
    : categories.map((c) => ({ id: c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''), name: c }));

  const activeBrands = dbBrands.length > 0
    ? dbBrands
    : brands.map((b) => ({ id: b.id, name: b.name, logo: b.logo, description: b.description }));

  const filtered = items.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || (p.category || '').toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setEditTarget(null);
    setForm({
      ...EMPTY_FORM,
      brand: activeBrands[0]?.id || 'beauty-glowry',
      category: activeCategories[0]?.name || '',
    });
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditTarget(p);
    setForm({
      name: p.name,
      brand: (p as any).brand || 'beauty-glowry',
      category: p.category,
      sku: (p as any).sku || '',
      price: p.price,
      originalPrice: p.originalPrice,
      stock: p.stock,
      isBestseller: p.isBestseller,
      isNew: p.isNew,
      isFeatured: (p as any).isFeatured ?? false,
      isActive: (p as any).isActive !== false,
      isFreeDelivery: (p as any).isFreeDelivery ?? false,
      description: p.description,
      image: p.image,
      skinTypes: Array.isArray(p.skinTypes) ? p.skinTypes : (p.skinTypes as any)?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
      concerns: Array.isArray(p.concerns) ? p.concerns : (p.concerns as any)?.split(',').map((s: string) => s.trim()).filter(Boolean) || [],
      inciList: p.inciList || '',
      usageSteps: Array.isArray(p.usageSteps) && p.usageSteps.length > 0 ? p.usageSteps : [''],
      actives: Array.isArray(p.actives) && p.actives.length > 0
        ? p.actives.map((a) => ({ name: a.name || '', concentration: String(a.concentration ?? ''), unit: a.unit || '%' }))
        : [],
      variants: Array.isArray(p.variants) && p.variants.length > 0
        ? p.variants.map((v: any) => ({ label: v.label || v.size || 'Standard', price: String(v.price || p.price), stock: String(v.stock ?? p.stock ?? 0), sku: v.sku || '' }))
        : [],
      hasVariants: Array.isArray(p.variants) && p.variants.length > 0,
      galleryImages: Array.isArray(p.productImages) ? p.productImages.filter((img) => img !== p.image) : [],
      size: (p as any).size || '30ml',
      weight: (p as any).weight || '',
      shelfLife: (p as any).shelfLife || '',
      madeIn: (p as any).madeIn || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name) { alert('Product name is required'); return; }
    if (!form.image) { alert('Main product image is required'); return; }
    if (!form.category) { alert('Please select a category'); return; }

    const allImages = [form.image, ...form.galleryImages.filter((img) => img && img !== form.image)];

    const productPayload = {
      name: form.name,
      brand: form.brand || 'beauty-glowry',
      category: form.category,
      sku: form.sku || undefined,
      price: form.price,
      originalPrice: form.originalPrice,
      discountPrice: form.price,
      image: form.image,
      stock: form.stock,
      isBestseller: form.isBestseller,
      isNew: form.isNew,
      isFeatured: form.isFeatured,
      isActive: form.isActive,
      isFreeDelivery: form.isFreeDelivery,
      description: form.description,
      // Skin tags: combine skinTypes + concerns into skin_type_tags array
      skinTypes: form.skinTypes,
      concerns: form.concerns,
      inciList: form.inciList,
      usageSteps: form.usageSteps.filter(Boolean),
      actives: form.actives.filter((a) => a.name.trim()).map((a) => ({
        name: a.name.trim(),
        concentration: parseFloat(a.concentration) || 0,
        unit: a.unit,
      })),
      variants: form.hasVariants && form.variants.length > 0
        ? form.variants.filter((v) => v.label.trim()).map((v) => ({
            label: v.label.trim(),
            price: parseFloat(v.price) || form.price,
            stock: parseInt(v.stock) || form.stock,
            sku: v.sku.trim() || undefined,
          }))
        : undefined,
      productImages: allImages,
      size: form.size || '30ml',
      weight: form.weight || undefined,
      shelfLife: form.shelfLife || undefined,
      madeIn: form.madeIn || undefined,
    };

    try {
      let res;
      if (editTarget) {
        res = await fetch(`/api/products/${editTarget.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(productPayload) });
      } else {
        res = await fetch('/api/products', { method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify(productPayload) });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to save product');
      }

      if (editTarget) logActivity('Product updated', `Modified "${form.name}" (ID: ${editTarget.id})`);
      else logActivity('Product created', `Added new product "${form.name}"`);

      // Reload products
      const fetchRes = await fetch('/api/products?includeInactive=true');
      const latest = await fetchRes.json();
      if (Array.isArray(latest)) setItems(latest);
      setShowModal(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to save product');
    }
  };

  const handleDelete = async (id: number | string) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || 'Failed'); }
      setItems((prev) => prev.filter((p) => p.id !== id));
      logActivity('Product deleted', `Removed product ID ${id}`);
      setDeleteConfirm(null);
      setSelected((prev) => prev.filter((s) => s !== id));
    } catch (err: any) { alert(err.message || 'Failed to delete'); }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selected.length} selected products? This cannot be undone.`)) return;
    const toDelete = [...selected];
    try {
      await Promise.all(toDelete.map((id) => fetch(`/api/products/${id}`, { method: 'DELETE', headers: getAuthHeaders() })));
      setItems((prev) => prev.filter((p) => !toDelete.includes(p.id)));
      logActivity('Bulk delete', `Removed ${toDelete.length} products`);
      setSelected([]);
    } catch { alert('Failed to delete some products. Please refresh and retry.'); }
  };

  const toggleSelect = (id: number | string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  const selectAll = () =>
    setSelected(filtered.length === selected.length ? [] : filtered.map((p) => p.id));

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 12, color: C.muted, fontSize: 14 }}>
        <div style={{ width: 20, height: 20, border: `2px solid ${C.border}`, borderTopColor: C.accent, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        Loading products...
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>Products</h1>
          <p style={{ fontSize: 13, color: C.muted }}>{items.length} total · {items.filter((p) => (p as any).isActive).length} active</p>
        </div>
        <button onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: C.accent, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', boxShadow: `0 4px 16px rgba(201,149,109,0.25)` }}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
          <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
            onBlur={(e) => (e.currentTarget.style.borderColor = C.border)} />
        </div>
        <div style={{ position: 'relative' }}>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            style={{ padding: '9px 36px 9px 14px', appearance: 'none', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, cursor: 'pointer', outline: 'none' }}>
            <option value="All">All Categories</option>
            {activeCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
        </div>
        {selected.length > 0 && (
          <button onClick={handleBulkDelete}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: `${C.danger}18`, border: `1px solid ${C.danger}40`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: C.danger, cursor: 'pointer' }}>
            <Trash2 size={13} /> Delete ({selected.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '40px 60px 1fr 120px 80px 80px 130px 100px', gap: 12, padding: '12px 20px', borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>
          <div><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={selectAll} style={{ accentColor: C.accent, cursor: 'pointer' }} /></div>
          <div>Image</div><div>Product</div><div>Category</div><div>Price</div><div>Stock</div><div>Tags</div><div style={{ textAlign: 'right' }}>Actions</div>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: C.muted }}>
            <Package size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: 14 }}>No products found</p>
          </div>
        ) : (
          filtered.map((p, i) => (
            <div key={p.id}
              style={{ display: 'grid', gridTemplateColumns: '40px 60px 1fr 120px 80px 80px 130px 100px', gap: 12, padding: '14px 20px', alignItems: 'center', borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none', background: selected.includes(p.id) ? `${C.accent}08` : 'transparent', transition: 'background 0.15s' }}
              onMouseEnter={(e) => { if (!selected.includes(p.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
              onMouseLeave={(e) => { if (!selected.includes(p.id)) e.currentTarget.style.background = 'transparent'; }}>
              <div><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} style={{ accentColor: C.accent, cursor: 'pointer' }} /></div>
              <div style={{ width: 44, height: 44, borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.border}`, background: C.elevated }}>
                <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>{p.name.slice(0, 40)}{p.name.length > 40 ? '…' : ''}</p>
                <p style={{ fontSize: 11, color: C.muted }}>{(p as any).brand || 'Beauty Glowry'}</p>
              </div>
              <p style={{ fontSize: 11, color: C.muted }}>{(p.category || '').split(' ')[0]}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>৳{p.price.toLocaleString()}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {p.stock <= 10 && <AlertTriangle size={12} style={{ color: C.danger, flexShrink: 0 }} />}
                <span style={{ fontSize: 13, fontWeight: 600, color: p.stock <= 10 ? C.danger : p.stock <= 20 ? C.warning : C.success, fontFamily: "'DM Mono', monospace" }}>{p.stock}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {!(p as any).isActive && <span style={{ fontSize: 8, padding: '2px 5px', background: `${C.danger}20`, color: C.danger, borderRadius: 3, fontWeight: 700 }}>🔴 OFF</span>}
                {p.isBestseller && <span style={{ fontSize: 8, padding: '2px 5px', background: `${C.accent}20`, color: C.accent, borderRadius: 3, fontWeight: 700 }}>🔥</span>}
                {p.isNew && <span style={{ fontSize: 8, padding: '2px 5px', background: `${C.success}20`, color: C.success, borderRadius: 3, fontWeight: 700 }}>✨</span>}
                {(p as any).isFeatured && <span style={{ fontSize: 8, padding: '2px 5px', background: `${C.warning}20`, color: C.warning, borderRadius: 3, fontWeight: 700 }}>⭐</span>}
                {(p as any).isFreeDelivery && <span style={{ fontSize: 8, padding: '2px 5px', background: 'rgba(96,165,250,0.15)', color: '#60A5FA', borderRadius: 3, fontWeight: 700 }}>📦</span>}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                {deleteConfirm === p.id ? (
                  <>
                    <button onClick={() => handleDelete(p.id)} style={{ padding: '5px 10px', background: C.danger, border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Confirm</button>
                    <button onClick={() => setDeleteConfirm(null)} style={{ padding: '5px 10px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 11, color: C.muted, cursor: 'pointer' }}>No</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openEdit(p)}
                      style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer', color: C.muted, transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.accent; e.currentTarget.style.color = C.accent; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => setDeleteConfirm(p.id)}
                      style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer', color: C.muted, transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.danger; e.currentTarget.style.color = C.danger; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}>
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer stats */}
      <div style={{ display: 'flex', gap: 20, fontSize: 12, color: C.muted }}>
        <span>Showing {filtered.length} of {items.length} products</span>
        {selected.length > 0 && <span style={{ color: C.accent }}>{selected.length} selected</span>}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal
          title={editTarget ? `Edit: ${editTarget.name.slice(0, 36)}…` : 'Add New Product'}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          form={form}
          setForm={setForm}
          isEdit={!!editTarget}
          categoriesList={activeCategories}
          onCategoryCreated={(newCat) => { setDbCategories((prev) => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name))); setForm((prev) => ({ ...prev, category: newCat.name })); }}
          onCategoryDeleted={(catId) => {
            setDbCategories((prev) => prev.filter((c) => c.id !== catId));
            setForm((prev) => {
              const remaining = activeCategories.filter((c) => c.id !== catId);
              return prev.category === activeCategories.find((c) => c.id === catId)?.name ? { ...prev, category: remaining[0]?.name || '' } : prev;
            });
          }}
          brandsList={activeBrands}
          onBrandCreated={(nb) => { setDbBrands((prev) => [...prev, nb].sort((a, b) => a.name.localeCompare(b.name))); setForm((prev) => ({ ...prev, brand: nb.id })); }}
          onBrandDeleted={(bId) => {
            setDbBrands((prev) => prev.filter((b) => b.id !== bId));
            setForm((prev) => { const remaining = activeBrands.filter((b) => b.id !== bId); return prev.brand === bId ? { ...prev, brand: remaining[0]?.id || 'beauty-glowry' } : prev; });
          }}
          skinConcernOptions={skinConcernOptions}
          skinTypeOptions={skinTypeOptions}
          onSkinConcernAdded={handleSkinConcernAdded}
          onSkinConcernDeleted={handleSkinConcernDeleted}
          onSkinTypeAdded={handleSkinTypeAdded}
          onSkinTypeDeleted={handleSkinTypeDeleted}
        />
      )}
    </div>
  );
}
