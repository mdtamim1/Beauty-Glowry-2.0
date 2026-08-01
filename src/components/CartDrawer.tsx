'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '../store/useCartStore';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { cart, removeFromCart, updateQty, clearCart } = useCartStore();
  const [storeConfig, setStoreConfig] = useState<any>(null);

  const subtotal = cart.reduce((acc, item) => {
    const price = item.variant?.price ?? item.product.price;
    return acc + price * item.quantity;
  }, 0);

  const threshold = storeConfig ? Number(storeConfig.freeShippingThreshold || 1500) : 1500;
  const hasFreeDeliveryProduct = cart.some(item => item.product.isFreeDelivery === true);
  const isFreeShipping = subtotal >= threshold || hasFreeDeliveryProduct;
  const amountNeeded = hasFreeDeliveryProduct ? 0 : Math.max(0, threshold - subtotal);
  const percentage = hasFreeDeliveryProduct ? 100 : Math.min(100, (subtotal / threshold) * 100);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    
    // Fetch dynamic free shipping threshold settings
    fetch('/api/admin/store-config')
      .then((res) => res.json())
      .then((data) => {
        if (data) setStoreConfig(data);
      })
      .catch((err) => console.error('Failed to load store config in CartDrawer:', err));

    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="animate-fade-in"
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 80,
          background: 'rgba(26,26,24,0.55)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Drawer */}
      <div
        className="animate-slide-left"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 440,
          zIndex: 90,
          background: 'var(--bg-surface)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-20px 0 60px rgba(26,26,24,0.15)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 28px',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 22,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '0.02em',
              }}
            >
              Your Cart
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {cart.length} {cart.length === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close cart"
            style={{
              padding: 8,
              background: 'none',
              border: '1px solid var(--border-default)',
              borderRadius: 2,
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
          {cart.length > 0 && (
            <div style={{
              background: 'rgba(201,149,109,0.05)',
              border: '1px solid rgba(201,149,109,0.12)',
              borderRadius: 6,
              padding: '14px 16px',
              marginBottom: 20,
              boxSizing: 'border-box',
            }}>
              {isFreeShipping ? (
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--sage-dark)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  🎉 Congratulations! You've unlocked <strong>Free Shipping</strong> {hasFreeDeliveryProduct && <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--sage-dark)' }}>(Free Delivery Item in Cart)</span>}
                </p>
              ) : (
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Add <strong>৳{amountNeeded.toLocaleString()}</strong> more to your cart to get <strong>Free Shipping</strong>
                </p>
              )}
              <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  width: `${percentage}%`, height: '100%',
                  background: isFreeShipping ? 'var(--sage)' : 'var(--accent)',
                  borderRadius: 3, transition: 'width 0.4s ease'
                }} />
              </div>
            </div>
          )}

          {cart.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                gap: 20,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShoppingBag size={28} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>Your cart is empty</p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Add a formulation to get started</p>
              </div>
              <Link href="/products" onClick={onClose} className="btn-primary" style={{ marginTop: 8 }}>
                Browse Products
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {cart.map((item) => {
                const price = item.variant?.price ?? item.product.price;
                return (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      gap: 16,
                      paddingBottom: 20,
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        width: 80,
                        height: 80,
                        borderRadius: 3,
                        overflow: 'hidden',
                        flexShrink: 0,
                        border: '1px solid var(--border-default)',
                        background: 'var(--bg-elevated)',
                      }}
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          marginBottom: 4,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.product.name}
                      </p>
                      {item.variant?.label && (
                        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>{item.variant.label}</p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* Qty controls */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            border: '1px solid var(--border-default)',
                            borderRadius: 2,
                          }}
                        >
                          <button
                            onClick={() => updateQty(item.id, item.quantity - 1)}
                            style={{ padding: '4px 10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ padding: '4px 10px', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', minWidth: 28, textAlign: 'center' }}>
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, item.quantity + 1)}
                            style={{ padding: '4px 10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16 }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                          ৳{(price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      aria-label="Remove"
                      style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', alignSelf: 'flex-start' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div
            style={{
              padding: '24px 28px',
              borderTop: '1px solid var(--border-default)',
              background: 'var(--bg-elevated)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Subtotal</span>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                ৳{subtotal.toLocaleString()}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 20 }}>
              Shipping calculated at checkout
            </p>

            <Link
              href="/checkout"
              onClick={onClose}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
            >
              Secure Checkout <ArrowRight size={14} />
            </Link>
            <Link
              href="/products"
              onClick={onClose}
              className="btn-outline"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
