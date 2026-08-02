'use client';

import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit2, Trash2, X, Check, ChevronDown,
  Package, AlertTriangle, Save, Star, LayoutGrid,
  Flame, Sparkles, Leaf, Heart, Target, Eye,
} from 'lucide-react';
import { products as initialProducts, Product, categories, brands } from '../../../data/products';
import { logActivity, getAuthHeaders } from '../utils';

function compressImage(file: File, quality = 0.82, maxWidth = 1600): Promise<File> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !window.FileReader || !window.HTMLCanvasElement) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const dotIndex = file.name.lastIndexOf('.');
              const baseName = dotIndex !== -1 ? file.name.substring(0, dotIndex) : file.name;
              const newFileName = `${baseName}.jpg`;
              const compressedFile = new File([blob], newFileName, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

const C = {
  bg: '#0F0F0D', surface: '#1A1A17', elevated: '#222220',
  border: 'rgba(255,255,255,0.07)', borderHover: 'rgba(255,255,255,0.13)',
  text: '#F0EBE3', textSec: '#B0A8A0', muted: '#7A7470',
  accent: '#C9956D', success: '#4CAF82', warning: '#F0A54B', danger: '#E05A5A',
};

// ─── Section definitions (matches homepage logic) ───────────────────────────
const SECTIONS = [
  {
    key: 'isBestseller',
    label: 'Bestselling Formulations',
    desc: 'Shown in homepage "Bestselling" grid (top 4)',
    icon: <Flame size={16} />,
    color: '#C9956D',
  },
  {
    key: 'isNew',
    label: 'New Arrivals',
    desc: 'Shown in homepage "New Arrivals" strip (top 3)',
    icon: <Sparkles size={16} />,
    color: '#4CAF82',
  },
  {
    key: 'isFeatured',
    label: 'Featured / Hero Pick',
    desc: 'Highlighted prominently across the site',
    icon: <Star size={16} />,
    color: '#F0A54B',
  },
  {
    key: 'inSkinCare',
    label: 'Skin Concern Section',
    desc: 'Appears when matching skin concerns are filtered',
    icon: <Target size={16} />,
    color: '#9B8FE8',
  },
  {
    key: 'inCleansers',
    label: 'All Products Grid',
    desc: 'Always visible in All Products (no extra flag needed)',
    icon: <LayoutGrid size={16} />,
    color: '#60A5FA',
    alwaysOn: true,
  },
  {
    key: 'isWishlistable',
    label: 'Wishlist / Saved',
    desc: 'Can be saved to wishlist by customers',
    icon: <Heart size={16} />,
    color: '#EF4444',
    alwaysOn: true,
  },
];

// ─── Skin concern tag options ────────────────────────────────────────────────
const SKIN_CONCERN_TAGS = [
  'Acne', 'Brightening', 'Hydration', 'Aging',
  'Dark Spots', 'Sensitive', 'Pores', 'Oiliness',
];

const EMPTY_FORM = {
  name: '', brand: 'beauty-glowry', category: categories[0], price: 1000, originalPrice: 1200,
  stock: 20, rating: 4.5, reviewCount: 0,
  isBestseller: false, isNew: false, isFeatured: false, isActive: true, isFreeDelivery: false,
  description: '', image: '',
  skinTypes: 'All Skin Types', concerns: '',
  inciList: '', usageSteps: '', actives: '', variants: '', hasVariants: false, productImages: '',
  size: '30ml', weight: '32g', shelfLife: '24 months', madeIn: 'Bangladesh',
};

type FormData = typeof EMPTY_FORM;

// ─── Reusable Input component ────────────────────────────────────────────────
function Input({ label, type = 'text', value, onChange, placeholder, required, hint }: any) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>
          {label}{required && <span style={{ color: C.danger }}> *</span>}
        </label>
        {hint && <span style={{ fontSize: 10, color: C.muted, fontStyle: 'italic' }}>{hint}</span>}
      </div>
      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          style={{
            width: '100%', padding: '10px 12px', background: C.elevated,
            border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13,
            color: C.text, fontFamily: "'DM Sans', sans-serif", resize: 'vertical', outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange(type === 'number' ? Number(e.target.value) : e.target.value)
          }
          placeholder={placeholder}
          style={{
            width: '100%', padding: '10px 12px', background: C.elevated,
            border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13,
            color: C.text, fontFamily: "'DM Sans', sans-serif", outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
          onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
        />
      )}
    </div>
  );
}

// ─── Section Placement Card ──────────────────────────────────────────────────
function SectionCard({
  section, active, onClick,
}: {
  section: typeof SECTIONS[0];
  active: boolean;
  onClick: () => void;
}) {
  const isAlwaysOn = !!section.alwaysOn;
  return (
    <button
      type="button"
      onClick={isAlwaysOn ? undefined : onClick}
      disabled={isAlwaysOn}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: 6,
        padding: '14px 14px',
        background: active ? `${section.color}14` : C.elevated,
        border: `1.5px solid ${active ? section.color : C.border}`,
        borderRadius: 10,
        cursor: isAlwaysOn ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        transition: 'all 0.18s ease',
        opacity: isAlwaysOn ? 0.55 : 1,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Active checkmark */}
      {active && (
        <div style={{
          position: 'absolute', top: 8, right: 8,
          width: 18, height: 18, borderRadius: '50%',
          background: section.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Check size={10} style={{ color: '#fff' }} />
        </div>
      )}

      {/* Icon */}
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: `${section.color}20`,
        border: `1px solid ${section.color}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: section.color,
      }}>
        {section.icon}
      </div>

      <p style={{ fontSize: 12, fontWeight: 700, color: C.text, lineHeight: 1.3, marginTop: 2 }}>
        {section.label}
      </p>
      <p style={{ fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
        {section.desc}
      </p>
      {isAlwaysOn && (
        <span style={{ fontSize: 9, fontWeight: 700, color: section.color, background: `${section.color}18`, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.08em' }}>
          AUTO
        </span>
      )}
    </button>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────
function Modal({ title, onClose, onSave, form, setForm, isEdit, categoriesList, onCategoryCreated, onCategoryDeleted }: {
  title: string; onClose: () => void; onSave: () => void;
  form: FormData; setForm: (f: FormData) => void; isEdit: boolean;
  categoriesList: { id: string; name: string }[];
  onCategoryCreated: (cat: { id: string; name: string }) => void;
  onCategoryDeleted: (catId: string) => void;
}) {
  const update = (key: keyof FormData, val: any) => setForm({ ...form, [key]: val });
  const [activeTab, setActiveTab] = useState<'basic' | 'sections' | 'advanced'>('basic');
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isSavingCat, setIsSavingCat] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setIsSavingCat(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name: newCatName.trim() })
      });
      if (!res.ok) throw new Error('Failed to save category');
      const data = await res.json();
      onCategoryCreated({ id: data.id, name: data.name });
      setNewCatName('');
      setIsCreatingCat(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save new category');
    } finally {
      setIsSavingCat(false);
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('Are you sure you want to delete this category? All products in this category will be set to Uncategorized.')) return;
    try {
      const res = await fetch(`/api/categories?id=${catId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete category');
      onCategoryDeleted(catId);
    } catch (err) {
      console.error(err);
      alert('Failed to delete category');
    }
  };

  // ─── Size Variants Helper Logic ──────────────────────────────────────────
  const currentVariants = form.variants
    ? form.variants.split(',').filter(Boolean).map((v) => {
        const [label, price, stock, sku] = v.split(':');
        return {
          label: label || '',
          price: Number(price) || 0,
          stock: Number(stock) || 0,
          sku: sku || '',
        };
      })
    : [];

  const [newVarLabel, setNewVarLabel] = useState('');
  const [newVarPrice, setNewVarPrice] = useState<number | ''>('');
  const [newVarStock, setNewVarStock] = useState<number | ''>('');
  const [newVarSku, setNewVarSku] = useState('');

  const addVariant = () => {
    if (!newVarLabel) return;
    const vPrice = Number(newVarPrice) || form.price;
    const vStock = Number(newVarStock) || form.stock;
    const vSku = newVarSku.trim();

    const newVarStr = `${newVarLabel}:${vPrice}:${vStock}:${vSku}`;
    const nextVariants = form.variants
      ? [...form.variants.split(',').filter(Boolean), newVarStr].join(',')
      : newVarStr;

    update('variants', nextVariants);

    setNewVarLabel('');
    setNewVarPrice('');
    setNewVarStock('');
    setNewVarSku('');
  };

  const removeVariant = (index: number) => {
    const list = form.variants.split(',').filter(Boolean);
    list.splice(index, 1);
    update('variants', list.join(','));
  };

  // ─── Gallery Images Helper Logic ─────────────────────────────────────────
  const galleryImages = form.productImages
    ? form.productImages.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  const updateImage = (index: number, val: string) => {
    const list = [...galleryImages];
    list[index] = val;
    update('productImages', list.join(','));
  };

  const addImageField = () => {
    const list = [...galleryImages, ''];
    update('productImages', list.join(','));
  };

  const removeImageField = (index: number) => {
    const list = [...galleryImages];
    list.splice(index, 1);
    update('productImages', list.join(','));
  };

  const tabs = [
    { key: 'basic', label: '📝 Basic Info' },
    { key: 'sections', label: '🗂️ Section Placement' },
    { key: 'advanced', label: '🔬 Advanced' },
  ] as const;

  // Concern tag toggle helper
  const concernList = form.concerns ? form.concerns.split(',').map((s) => s.trim()).filter(Boolean) : [];
  const toggleConcernTag = (tag: string) => {
    if (concernList.includes(tag)) {
      update('concerns', concernList.filter((t) => t !== tag).join(', '));
    } else {
      update('concerns', [...concernList, tag].join(', '));
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(0,0,0,0.7)' }} />
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 100, width: '94%', maxWidth: 820,
          background: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.65)',
          maxHeight: '92vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', borderBottom: `1px solid ${C.border}` }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>{title}</h2>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Fill in product details and choose where it appears on the site</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, background: C.bg, padding: '0 28px' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 18px',
                background: 'none',
                border: 'none',
                borderBottom: `2px solid ${activeTab === tab.key ? C.accent : 'transparent'}`,
                fontSize: 12,
                fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? C.accent : C.muted,
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>

          {/* ── TAB: BASIC INFO ── */}
          {activeTab === 'basic' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <Input label="Product Name" value={form.name} onChange={(v: string) => update('name', v)} placeholder="e.g. Niacinamide 10% Clarifying Serum" required />
                </div>

                {/* Brand Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
                    Brand <span style={{ color: C.danger }}>*</span>
                  </label>
                  <select
                    value={form.brand}
                    onChange={(e) => update('brand', e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as any }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} — {b.tagline}</option>
                    ))}
                  </select>
                  {form.brand && (() => {
                    const selectedBrand = brands.find((b) => b.id === form.brand);
                    return selectedBrand ? (
                      <p style={{ fontSize: 10, color: C.muted, marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 14 }}>{selectedBrand.logo}</span>
                        {selectedBrand.name} · {selectedBrand.country} · Est. {selectedBrand.founded}
                      </p>
                    ) : null;
                  })()}
                </div>

                {/* Category Selector */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>Category</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      value={form.category}
                      onChange={(e) => update('category', e.target.value)}
                      style={{ flex: 1, padding: '10px 12px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' as any }}
                    >
                      {categoriesList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => setIsCreatingCat(!isCreatingCat)}
                      style={{ padding: '0 12px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, color: C.accent, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      {isCreatingCat ? 'Cancel' : '⚙️ Manage'}
                    </button>
                  </div>

                  {isCreatingCat && (
                    <div style={{ marginTop: 12, padding: 12, background: C.bg, borderRadius: 8, border: `1.5px dashed ${C.border}`, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Create New Form */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="text"
                          placeholder="New Category Name"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          style={{ flex: 1, padding: '6px 10px', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, color: C.text, outline: 'none' }}
                        />
                        <button
                          type="button"
                          onClick={handleCreateCategory}
                          disabled={isSavingCat || !newCatName}
                          style={{ padding: '6px 12px', background: C.accent, border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer', opacity: (!newCatName || isSavingCat) ? 0.5 : 1 }}
                        >
                          {isSavingCat ? 'Saving...' : 'Save'}
                        </button>
                      </div>

                      {/* Existing Categories List with Delete option */}
                      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                        <p style={{ fontSize: 10, fontWeight: 700, color: C.muted, textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>
                          Manage Existing Categories ({categoriesList.length})
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 150, overflowY: 'auto', paddingRight: 4 }}>
                          {categoriesList.map((cat) => (
                            <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: C.elevated, borderRadius: 5, border: `1px solid ${C.border}` }}>
                              <span style={{ fontSize: 12, color: C.text }}>{cat.name}</span>
                              <button
                                type="button"
                                onClick={() => handleDeleteCategory(cat.id)}
                                style={{ background: 'none', border: 'none', color: C.danger, cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
                                title="Delete Category"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <Input label="Price (৳)" type="number" value={form.price} onChange={(v: number) => update('price', v)} />
                <Input label="Original Price (৳)" type="number" value={form.originalPrice} onChange={(v: number) => update('originalPrice', v)} hint="Before discount" />
                <Input label="Stock Qty" type="number" value={form.stock} onChange={(v: number) => update('stock', v)} />
                <Input label="Rating" type="number" value={form.rating} onChange={(v: number) => update('rating', v)} placeholder="4.5" hint="0 – 5" />
                
                {/* Active Status Toggle */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
                    Active Status
                  </label>
                  <button
                    type="button"
                    onClick={() => update('isActive', !form.isActive)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: form.isActive ? 'rgba(76,175,130,0.12)' : 'rgba(224,90,90,0.12)',
                      border: `1.5px solid ${form.isActive ? C.success : C.danger}`,
                      borderRadius: 7,
                      fontSize: 13,
                      fontWeight: 600,
                      color: form.isActive ? C.success : C.danger,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {form.isActive ? '🟢 Active (Visible in Store)' : '🔴 Inactive (Hidden from Store)'}
                  </button>
                </div>
                
                {/* Free Delivery Toggle */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 6 }}>
                    📦 Free Delivery
                  </label>
                  <button
                    type="button"
                    onClick={() => update('isFreeDelivery', !form.isFreeDelivery)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: form.isFreeDelivery ? 'rgba(76,175,130,0.12)' : C.elevated,
                      border: `1.5px solid ${form.isFreeDelivery ? C.success : C.border}`,
                      borderRadius: 7,
                      fontSize: 13,
                      fontWeight: 600,
                      color: form.isFreeDelivery ? C.success : C.muted,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s',
                    }}
                  >
                    {form.isFreeDelivery ? '🟢 Free Delivery (Waived)' : '⚪ Standard Shipping'}
                  </button>
                </div>

                <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>
                    Main Image URL
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="text"
                        value={form.image}
                        onChange={(e) => update('image', e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        style={{
                          width: '100%', padding: '10px 12px', background: C.elevated,
                          border: `1px solid ${C.border}`, borderRadius: 7,
                          fontSize: 13, color: C.text, fontFamily: "'DM Sans', sans-serif", outline: 'none'
                        }}
                      />
                    </div>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <button
                        type="button"
                        style={{
                          padding: '10px 16px', background: C.elevated, border: `1px solid ${C.border}`,
                          borderRadius: 7, fontSize: 12, fontWeight: 600, color: C.textSec, cursor: 'pointer'
                        }}
                      >
                        Upload File
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          // Compress image client side
                          const compressed = await compressImage(file, 0.82, 1600);
                          
                          const fd = new FormData();
                          fd.append('file', compressed);
                          if (form.name) {
                            fd.append('productName', form.name);
                          }
                          try {
                            const res = await fetch('/api/admin/upload', {
                              method: 'POST',
                              body: fd
                            });
                            if (res.ok) {
                              const out = await res.json();
                              update('image', out.url);
                            } else {
                              alert('Upload failed');
                            }
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        style={{
                          position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%'
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Gallery Images Builder Section */}
                <div style={{
                  gridColumn: '1/-1',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  marginTop: 6,
                  marginBottom: 6,
                }}>
                  <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>
                    Product Gallery Images
                  </label>
                  
                  {/* Scrollable Viewport */}
                  <div style={{
                    maxHeight: 180,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    padding: '8px 8px 8px 0',
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    background: 'rgba(0,0,0,0.15)',
                    boxSizing: 'border-box',
                  }}>
                    {galleryImages.length === 0 ? (
                      <div style={{ padding: '20px 12px', textAlign: 'center', color: C.muted, fontSize: 12 }}>
                        No gallery images added yet. Click "+ Add Gallery Image" below.
                      </div>
                    ) : (
                      galleryImages.map((url, index) => (
                        <div key={index} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '0 8px' }}>
                          <span style={{ fontSize: 11, color: C.muted, minWidth: 20, textAlign: 'center' }}>
                            #{index + 1}
                          </span>
                          <input
                            type="text"
                            placeholder="https://images.unsplash.com/..."
                            value={url}
                            onChange={(e) => updateImage(index, e.target.value)}
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              background: C.elevated,
                              border: `1px solid ${C.border}`,
                              borderRadius: 6,
                              fontSize: 13,
                              color: C.text,
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
                            onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
                          />

                          {/* File upload trigger */}
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <button
                              type="button"
                              style={{
                                padding: '8px 12px', background: C.elevated, border: `1px solid ${C.border}`,
                                borderRadius: 6, fontSize: 11, fontWeight: 600, color: C.textSec, cursor: 'pointer'
                              }}
                            >
                              Upload
                            </button>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                
                                // Compress image client side
                                const compressed = await compressImage(file, 0.82, 1600);
                                
                                const fd = new FormData();
                                fd.append('file', compressed);
                                if (form.name) {
                                  fd.append('productName', form.name);
                                }
                                try {
                                  const res = await fetch('/api/admin/upload', {
                                    method: 'POST',
                                    body: fd
                                  });
                                  if (res.ok) {
                                    const out = await res.json();
                                    updateImage(index, out.url);
                                  } else {
                                    alert('Upload failed');
                                  }
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              style={{
                                position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%'
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => removeImageField(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: C.danger,
                              cursor: 'pointer',
                              padding: 6,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 4,
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(224,90,90,0.12)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Image Button */}
                  <button
                    type="button"
                    onClick={addImageField}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 14px',
                      background: 'rgba(255,255,255,0.04)',
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      color: C.textSec,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      alignSelf: 'flex-start',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.07)';
                      e.currentTarget.style.borderColor = C.accent;
                      e.currentTarget.style.color = C.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.color = C.textSec;
                    }}
                  >
                    <Plus size={12} /> Add Gallery Image
                  </button>
                </div>

                <div style={{ gridColumn: '1/-1' }}>
                  <Input label="Description" type="textarea" value={form.description} onChange={(v: string) => update('description', v)} placeholder="Clinical description of this formulation..." required />
                </div>

                {/* Size-wise Pricing (Variants) Section */}
                <div style={{
                  gridColumn: '1/-1',
                  marginTop: 8,
                  padding: '20px 24px',
                  background: 'rgba(255,255,255,0.015)',
                  border: `1px solid ${form.hasVariants ? C.accent + '35' : C.border}`,
                  borderRadius: 10,
                  transition: 'all 0.2s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 13, fontWeight: 700, color: form.hasVariants ? C.accent : C.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Size-wise Pricing & Variants
                      </h3>
                      <p style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
                        Enable this to add specific pricing and stock levels for different sizes, weights, or dimensions.
                      </p>
                    </div>
                    {/* Enable/Disable Toggle */}
                    <button
                      type="button"
                      onClick={() => update('hasVariants', !form.hasVariants)}
                      style={{
                        padding: '6px 14px',
                        background: form.hasVariants ? 'rgba(76,175,130,0.15)' : 'rgba(255,255,255,0.04)',
                        border: `1.5px solid ${form.hasVariants ? '#4CAF82' : C.border}`,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        color: form.hasVariants ? '#8BC34A' : C.muted,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: form.hasVariants ? '#4CAF82' : C.muted }}></span>
                      {form.hasVariants ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>

                  {/* Form & Table Content wrapper with opacity and disable state */}
                  <div style={{
                    opacity: form.hasVariants ? 1 : 0.35,
                    pointerEvents: form.hasVariants ? 'auto' : 'none',
                    transition: 'all 0.2s',
                  }}>
                    {/* Variant List Table */}
                    {currentVariants.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '150px 100px 100px 1fr auto',
                          gap: 12,
                          padding: '8px 12px',
                          background: C.bg,
                          borderRadius: 6,
                          fontSize: 10,
                          fontWeight: 700,
                          color: C.muted,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          <div>Size / Weight / Inch</div>
                          <div>Price (৳)</div>
                          <div>Stock Qty</div>
                          <div>SKU (optional)</div>
                          <div style={{ textAlign: 'right', minWidth: 50 }}>Actions</div>
                        </div>

                        {currentVariants.map((v, i) => (
                          <div key={i} style={{
                            display: 'grid',
                            gridTemplateColumns: '150px 100px 100px 1fr auto',
                            gap: 12,
                            padding: '10px 12px',
                            borderBottom: `1px solid ${C.border}`,
                            fontSize: 13,
                            color: C.text,
                            alignItems: 'center',
                          }}>
                            <div style={{ fontWeight: 600 }}>{v.label}</div>
                            <div style={{ fontFamily: "'DM Mono', monospace", color: C.accent }}>৳{v.price.toLocaleString()}</div>
                            <div style={{ fontFamily: "'DM Mono', monospace" }}>{v.stock}</div>
                            <div style={{ fontFamily: "'DM Mono', monospace", color: C.muted, fontSize: 11 }}>{v.sku || 'Auto-generated'}</div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', minWidth: 50 }}>
                              <button
                                type="button"
                                onClick={() => removeVariant(i)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: C.danger,
                                  cursor: 'pointer',
                                  padding: 4,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  borderRadius: 4,
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = `${C.danger}15`}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ padding: '20px 12px', textAlign: 'center', color: C.muted, fontSize: 12, border: `1px dashed ${C.border}`, borderRadius: 8, marginBottom: 16 }}>
                        No variants added yet. Configure size/value parameters below.
                      </div>
                    )}

                    {/* Add Variant Form Row */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '150px 100px 100px 1fr auto',
                      gap: 12,
                      alignItems: 'flex-end',
                      background: C.elevated,
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                    }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: 'uppercase' }}>Size / Weight / Inch</label>
                        <input
                          type="text"
                          placeholder="e.g. 50ml, 100g, 12 inch"
                          value={newVarLabel}
                          onChange={e => setNewVarLabel(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, color: C.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: 'uppercase' }}>Price (৳)</label>
                        <input
                          type="number"
                          placeholder={`e.g. ${form.price || 1000}`}
                          value={newVarPrice}
                          onChange={e => setNewVarPrice(e.target.value === '' ? '' : Number(e.target.value))}
                          style={{ width: '100%', padding: '6px 8px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, color: C.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: 'uppercase' }}>Stock</label>
                        <input
                          type="number"
                          placeholder={`e.g. ${form.stock || 20}`}
                          value={newVarStock}
                          onChange={e => setNewVarStock(e.target.value === '' ? '' : Number(e.target.value))}
                          style={{ width: '100%', padding: '6px 8px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, color: C.text, outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 9, fontWeight: 700, color: C.muted, marginBottom: 6, textTransform: 'uppercase' }}>SKU (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. BG-SERUM-50"
                          value={newVarSku}
                          onChange={e => setNewVarSku(e.target.value)}
                          style={{ width: '100%', padding: '6px 8px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 12, color: C.text, outline: 'none' }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addVariant}
                        disabled={!newVarLabel}
                        style={{
                          padding: '7px 14px',
                          background: newVarLabel ? C.accent : C.elevated,
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          color: newVarLabel ? '#fff' : C.muted,
                          cursor: newVarLabel ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          height: 28,
                          alignSelf: 'center',
                          boxShadow: newVarLabel ? '0 2px 8px rgba(201,149,109,0.2)' : 'none',
                        }}
                      >
                        <Plus size={12} /> Add Size
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: SECTION PLACEMENT ── */}
          {activeTab === 'sections' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Section Cards Grid */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 14 }}>
                  Choose Sections — where will this product appear?
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {SECTIONS.map((section) => {
                    const isActive = section.alwaysOn || !!(form as any)[section.key];
                    return (
                      <SectionCard
                        key={section.key}
                        section={section}
                        active={isActive}
                        onClick={() => update(section.key as keyof FormData, !(form as any)[section.key])}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Summary panel */}
              <div style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>
                  📍 Where This Product Will Appear
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { on: true, label: 'All Products page', icon: '🛒', note: 'Always' },
                    { on: form.isBestseller, label: 'Bestselling Formulations (Homepage)', icon: '🔥', note: 'Top 4 shown' },
                    { on: form.isNew, label: 'New Arrivals (Homepage)', icon: '✨', note: 'Top 3 shown' },
                    { on: form.isFeatured, label: 'Featured / Hero Section', icon: '⭐', note: '' },
                    { on: concernList.length > 0, label: `Skin Concerns (${concernList.join(', ') || 'none set'})`, icon: '🎯', note: 'Based on concern tags' },
                  ].map((row) => (
                    <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        background: row.on ? `${C.success}20` : `rgba(255,255,255,0.05)`,
                        border: `1px solid ${row.on ? C.success : C.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {row.on && <Check size={9} style={{ color: C.success }} />}
                      </div>
                      <span style={{ fontSize: 12, color: row.on ? C.text : C.muted }}>
                        {row.icon} {row.label}
                      </span>
                      {row.note && (
                        <span style={{ fontSize: 9, color: C.muted, background: C.elevated, border: `1px solid ${C.border}`, padding: '1px 6px', borderRadius: 4 }}>
                          {row.note}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Skin Concern Tags */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>
                  🎯 Skin Concern Tags
                  <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: C.muted }}>
                    — affects which concern filter shows this product
                  </span>
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SKIN_CONCERN_TAGS.map((tag) => {
                    const selected = concernList.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleConcernTag(tag)}
                        style={{
                          padding: '7px 14px',
                          background: selected ? `${C.accent}18` : C.elevated,
                          border: `1.5px solid ${selected ? C.accent : C.border}`,
                          borderRadius: 99,
                          fontSize: 12, fontWeight: 600,
                          color: selected ? C.accent : C.muted,
                          cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                          transition: 'all 0.15s',
                        }}
                      >
                        {selected && '✓ '}{tag}
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>
                  Selected: <strong style={{ color: C.text }}>{concernList.length > 0 ? concernList.join(', ') : 'None'}</strong>
                </p>
              </div>

              {/* Skin Type checkboxes */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted, marginBottom: 12 }}>
                  👤 Suitable Skin Types
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {['Oily', 'Dry', 'Combination', 'Normal', 'Sensitive', 'All Skin Types'].map((type) => {
                    const skinTypeList = form.skinTypes ? form.skinTypes.split(',').map((s) => s.trim()).filter(Boolean) : [];
                    const sel = skinTypeList.includes(type);
                    const toggle = () => {
                      if (type === 'All Skin Types') {
                        update('skinTypes', 'All Skin Types');
                        return;
                      }
                      const next = sel
                        ? skinTypeList.filter((t) => t !== type && t !== 'All Skin Types')
                        : [...skinTypeList.filter((t) => t !== 'All Skin Types'), type];
                      update('skinTypes', next.join(', '));
                    };
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={toggle}
                        style={{
                          padding: '7px 14px',
                          background: sel ? 'rgba(139,157,119,0.15)' : C.elevated,
                          border: `1.5px solid ${sel ? '#8B9D77' : C.border}`,
                          borderRadius: 99,
                          fontSize: 12, fontWeight: 600,
                          color: sel ? '#A8C090' : C.muted,
                          cursor: 'pointer',
                          fontFamily: "'DM Sans', sans-serif",
                          transition: 'all 0.15s',
                        }}
                      >
                        {sel && '✓ '}{type}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: ADVANCED ── */}
          {activeTab === 'advanced' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                <div style={{ gridColumn: '1/-1' }}>
                  <Input
                    label="Active Ingredients"
                    type="textarea"
                    value={form.actives}
                    onChange={(v: string) => update('actives', v)}
                    placeholder="NIACINAMIDE:10:%,ZINC PCA:1:%"
                    hint="Format: NAME:CONC:UNIT"
                  />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <Input label="Usage Steps (one per line)" type="textarea" value={form.usageSteps} onChange={(v: string) => update('usageSteps', v)} placeholder={'Step 1\nStep 2'} />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <Input label="INCI List (full ingredient list)" type="textarea" value={form.inciList} onChange={(v: string) => update('inciList', v)} placeholder="Aqua, Niacinamide..." />
                </div>

                {/* Specs */}
                <div style={{ gridColumn: '1/-1', borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.accent, marginBottom: 12 }}>
                    📦 Product Specifications
                  </p>
                </div>
                <Input label="Size / Volume" value={form.size} onChange={(v: string) => update('size', v)} placeholder="30ml" required />
                <Input label="Net Weight" value={form.weight} onChange={(v: string) => update('weight', v)} placeholder="32g" />
                <Input label="Shelf Life" value={form.shelfLife} onChange={(v: string) => update('shelfLife', v)} placeholder="24 months (12M after opening)" />
                <Input label="Made In" value={form.madeIn} onChange={(v: string) => update('madeIn', v)} placeholder="Bangladesh" />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div style={{ padding: '16px 28px', borderTop: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          {/* Section quick summary */}
          <div style={{ display: 'flex', gap: 6 }}>
            {form.isBestseller && (
              <span style={{ fontSize: 9, padding: '3px 8px', background: `${C.accent}20`, color: C.accent, borderRadius: 4, fontWeight: 700 }}>🔥 BESTSELLER</span>
            )}
            {form.isNew && (
              <span style={{ fontSize: 9, padding: '3px 8px', background: `${C.success}20`, color: C.success, borderRadius: 4, fontWeight: 700 }}>✨ NEW</span>
            )}
            {form.isFeatured && (
              <span style={{ fontSize: 9, padding: '3px 8px', background: `${C.warning}20`, color: C.warning, borderRadius: 4, fontWeight: 700 }}>⭐ FEATURED</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '9px 20px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, color: C.muted, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              style={{
                padding: '9px 24px', background: C.accent, border: 'none', borderRadius: 7,
                fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: `0 4px 16px rgba(201,149,109,0.3)`,
              }}
            >
              <Save size={14} /> {isEdit ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminProducts() {
  const [items, setItems] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<FormData>({ ...EMPTY_FORM });
  const [selected, setSelected] = useState<(string | number)[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | number | null>(null);
  const [dbCategories, setDbCategories] = useState<{ id: string, name: string }[]>([]);

  useEffect(() => {
    fetch('/api/products?includeInactive=true')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setItems(data);
        }
      })
      .catch((err) => console.error('Failed to load products from live database:', err));

    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDbCategories(data.map((c) => ({ id: c.id, name: c.name })));
        }
      })
      .catch((err) => console.error('Failed to load categories from live database:', err));
  }, []);

  const activeCategories = dbCategories.length > 0
    ? dbCategories
    : categories.map((c) => ({ id: c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''), name: c }));

  const filtered = items.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'All' || p.category === catFilter;
    return matchSearch && matchCat;
  });

  const openAdd = () => { setForm({ ...EMPTY_FORM }); setEditTarget(null); setShowModal(true); };
  const openEdit = (p: Product) => {
    setEditTarget(p);
    setForm({
      name: p.name, brand: p.brand || 'beauty-glowry', category: p.category, price: p.price, originalPrice: p.originalPrice,
      stock: p.stock, rating: p.rating, reviewCount: p.reviewCount,
      isBestseller: p.isBestseller, isNew: p.isNew,
      isFeatured: (p as any).isFeatured ?? false,
      isActive: (p as any).isActive !== false,
      isFreeDelivery: (p as any).isFreeDelivery ?? false,
      description: p.description,
      image: p.image, skinTypes: p.skinTypes.join(', '), concerns: p.concerns.join(', '),
      inciList: p.inciList, usageSteps: p.usageSteps.join('\n'),
      actives: p.actives.map((a) => `${a.name}:${a.concentration}:${a.unit}`).join(','),
      variants: p.variants.map((v) => `${v.label || 'Standard'}:${v.price}:${v.stock || p.stock || 0}:${v.sku || ''}`).join(','),
      hasVariants: p.variants && p.variants.length > 0,
      productImages: p.productImages.join(', '),
      size: p.size || '30ml', weight: p.weight || '', shelfLife: p.shelfLife || '', madeIn: p.madeIn || '',
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.image) return;
    const parseActives = form.actives.split(',').filter(Boolean).map((a) => {
      const [name, concentration, unit] = a.split(':');
      return { name: name?.trim() || '', concentration: Number(concentration) || 0, unit: unit?.trim() || '%' };
    });
    const parseVariants = form.hasVariants ? form.variants.split(',').filter(Boolean).map((v) => {
      const [label, price, stock, sku] = v.split(':');
      return {
        label: label?.trim() || 'Standard',
        price: Number(price) || form.price,
        stock: Number(stock) || form.stock,
        sku: sku?.trim() || undefined
      };
    }) : undefined;
    const productPayload = {
      name: form.name, brand: form.brand || 'beauty-glowry', category: form.category, price: form.price,
      originalPrice: form.originalPrice, discountPrice: form.price,
      image: form.image, stock: form.stock, rating: form.rating,
      reviewCount: form.reviewCount, isBestseller: form.isBestseller, isNew: form.isNew,
      isActive: form.isActive,
      description: form.description,
      actives: parseActives,
      variants: parseVariants,
      skinTypes: form.skinTypes.split(',').map((s) => s.trim()).filter(Boolean),
      concerns: form.concerns.split(',').map((s) => s.trim()).filter(Boolean),
      inciList: form.inciList,
      usageSteps: form.usageSteps.split('\n').filter(Boolean),
      productImages: form.productImages.split(',').map((s) => s.trim()).filter(Boolean).length > 0
        ? form.productImages.split(',').map((s) => s.trim()).filter(Boolean)
        : [form.image],
      size: form.size || '30ml',
      weight: form.weight || undefined,
      shelfLife: form.shelfLife || undefined,
      madeIn: form.madeIn || undefined,
      isFeatured: form.isFeatured,
      isFreeDelivery: form.isFreeDelivery
    };

    try {
      let res;
      if (editTarget) {
        res = await fetch(`/api/products/${editTarget.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(productPayload)
        });
      } else {
        res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(productPayload)
        });
      }

      if (!res.ok) throw new Error('Failed to save product');

      // Log the product modification or creation
      if (editTarget) {
        logActivity('Product updated', `Modified product details for "${form.name}" (ID: ${editTarget.id})`);
      } else {
        logActivity('Product created', `Added new product "${form.name}" to inventory`);
      }

      // Re-fetch products from DB
      const fetchRes = await fetch('/api/products?includeInactive=true');
      const latestProducts = await fetchRes.json();
      if (Array.isArray(latestProducts)) {
        setItems(latestProducts);
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save product to database');
    }
  };

  const handleDelete = async (id: number | string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error('Failed to delete product');

      setItems((prev) => prev.filter((p) => p.id !== id));
      logActivity('Product deleted', `Removed product ID ${id} from database`);
      setDeleteConfirm(null);
      setSelected((prev) => prev.filter((s) => s !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete product from database');
    }
  };

  const handleBulkDelete = () => {
    setItems((prev) => prev.filter((p) => !selected.includes(p.id)));
    logActivity('Bulk products deleted', `Removed ${selected.length} products in bulk operation`);
    setSelected([]);
  };

  const toggleSelect = (id: number | string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);

  const selectAll = () =>
    setSelected(filtered.length === selected.length ? [] : filtered.map((p) => p.id));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4 }}>Products</h1>
          <p style={{ fontSize: 13, color: C.muted }}>{items.length} total products</p>
        </div>
        <button
          onClick={openAdd}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
            background: C.accent, border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
            boxShadow: `0 4px 16px rgba(201,149,109,0.25)`,
          }}
        >
          <Plus size={15} /> Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, outline: 'none', boxSizing: 'border-box' }}
            onFocus={(e) => (e.currentTarget.style.borderColor = C.accent)}
            onBlur={(e) => (e.currentTarget.style.borderColor = C.border)}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            style={{ padding: '9px 36px 9px 14px', appearance: 'none', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, color: C.text, cursor: 'pointer', outline: 'none' }}
          >
            <option value="All">All Categories</option>
            {activeCategories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <ChevronDown size={13} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, pointerEvents: 'none' }} />
        </div>
        {selected.length > 0 && (
          <button
            onClick={handleBulkDelete}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: `${C.danger}18`, border: `1px solid ${C.danger}40`, borderRadius: 8, fontSize: 13, fontWeight: 600, color: C.danger, cursor: 'pointer' }}
          >
            <Trash2 size={13} /> Delete ({selected.length})
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        {/* Table Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px 60px 1fr 120px 80px 80px 120px 100px', gap: 12, padding: '12px 20px', borderBottom: `1px solid ${C.border}`, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.muted }}>
          <div><input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={selectAll} style={{ accentColor: C.accent, cursor: 'pointer' }} /></div>
          <div>Image</div>
          <div>Product</div>
          <div>Category</div>
          <div>Price</div>
          <div>Stock</div>
          <div>Sections</div>
          <div style={{ textAlign: 'right' }}>Actions</div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: C.muted }}>
            <Package size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: 14 }}>No products found</p>
          </div>
        ) : (
          filtered.map((p, i) => (
            <div
              key={p.id}
              style={{
                display: 'grid', gridTemplateColumns: '40px 60px 1fr 120px 80px 80px 120px 100px',
                gap: 12, padding: '14px 20px', alignItems: 'center',
                borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : 'none',
                background: selected.includes(p.id) ? `${C.accent}08` : 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => { if (!selected.includes(p.id)) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
              onMouseLeave={(e) => { if (!selected.includes(p.id)) e.currentTarget.style.background = 'transparent'; }}
            >
              <div><input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} style={{ accentColor: C.accent, cursor: 'pointer' }} /></div>
              <div style={{ width: 44, height: 44, borderRadius: 6, overflow: 'hidden', border: `1px solid ${C.border}`, background: C.elevated }}>
                <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{p.name.slice(0, 38)}{p.name.length > 38 ? '...' : ''}</p>
                </div>
                <p style={{ fontSize: 11, color: C.muted, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Star size={10} style={{ color: C.accent }} /> {p.rating} · {p.reviewCount} reviews
                </p>
              </div>
              <p style={{ fontSize: 11, color: C.muted }}>{p.category.split(' ')[0]}</p>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.text, fontFamily: "'DM Mono', monospace" }}>৳{p.price.toLocaleString()}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {p.stock <= 10 && <AlertTriangle size={12} style={{ color: C.danger, flexShrink: 0 }} />}
                <span style={{ fontSize: 13, fontWeight: 600, color: p.stock <= 10 ? C.danger : p.stock <= 20 ? C.warning : C.success, fontFamily: "'DM Mono', monospace" }}>
                  {p.stock}
                </span>
              </div>
              {/* Section tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {!(p as any).isActive && <span style={{ fontSize: 8, padding: '2px 6px', background: `${C.danger}20`, color: C.danger, borderRadius: 3, fontWeight: 700, whiteSpace: 'nowrap' }}>🔴 INACTIVE</span>}
                {p.isBestseller && <span style={{ fontSize: 8, padding: '2px 6px', background: `${C.accent}20`, color: C.accent, borderRadius: 3, fontWeight: 700, whiteSpace: 'nowrap' }}>🔥 BEST</span>}
                {p.isNew && <span style={{ fontSize: 8, padding: '2px 6px', background: `${C.success}20`, color: C.success, borderRadius: 3, fontWeight: 700, whiteSpace: 'nowrap' }}>✨ NEW</span>}
                {(p as any).isFeatured && <span style={{ fontSize: 8, padding: '2px 6px', background: `${C.warning}20`, color: C.warning, borderRadius: 3, fontWeight: 700, whiteSpace: 'nowrap' }}>⭐ FEAT</span>}
                {(p as any).isActive && !p.isBestseller && !p.isNew && !(p as any).isFeatured && (
                  <span style={{ fontSize: 8, padding: '2px 6px', background: 'rgba(255,255,255,0.05)', color: C.muted, borderRadius: 3 }}>Standard</span>
                )}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                {deleteConfirm === p.id ? (
                  <>
                    <button onClick={() => handleDelete(p.id)} style={{ padding: '5px 10px', background: C.danger, border: 'none', borderRadius: 5, fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer' }}>Confirm</button>
                    <button onClick={() => setDeleteConfirm(null)} style={{ padding: '5px 10px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 5, fontSize: 11, color: C.muted, cursor: 'pointer' }}>Cancel</button>
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
          title={editTarget ? `Edit: ${editTarget.name.slice(0, 32)}...` : 'Add New Product'}
          onClose={() => setShowModal(false)}
          onSave={handleSave}
          form={form}
          setForm={setForm}
          isEdit={!!editTarget}
          categoriesList={activeCategories}
          onCategoryCreated={(newCat) => {
            setDbCategories((prev) => [...prev, newCat].sort((a, b) => a.name.localeCompare(b.name)));
            setForm((prev) => ({ ...prev, category: newCat.name }));
          }}
          onCategoryDeleted={(catId) => {
            setDbCategories((prev) => prev.filter((c) => c.id !== catId));
            setForm((prev) => {
              const remaining = activeCategories.filter((c) => c.id !== catId);
              return prev.category === activeCategories.find((c) => c.id === catId)?.name
                ? { ...prev, category: remaining[0]?.name || '' }
                : prev;
            });
          }}
        />
      )}
    </div>
  );
}
