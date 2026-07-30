import React from 'react';
import { Link } from 'react-router-dom';
import { X, Trash2, ShoppingBag, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import DropletGlyph from './DropletGlyph';

const CartDrawer = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity } = useCart();

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  const freeShippingThreshold = 1500;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const shippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', justifyContent: 'flex-end' }}>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          transition: 'var(--transition)'
        }}
      />

      {/* Drawer Panel */}
      <div 
        className="animate-drawer"
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          background: '#FFFFFF',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001
        }}
      >
        {/* Drawer Header */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--border-champagne)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--silk-background)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} color="var(--obsidian-emerald)" />
            <h3 className="font-editorial" style={{ fontSize: '20px', color: 'var(--velvet-charcoal)' }}>
              Your Clinical Cart ({cart.reduce((sum, i) => sum + (i.quantity || 1), 0)})
            </h3>
          </div>
          <button onClick={onClose} aria-label="Close cart" style={{ color: 'var(--slate-muted)' }}>
            <X size={22} />
          </button>
        </div>

        {/* Free Shipping Progress Indicator */}
        <div style={{ padding: '16px 24px', background: 'var(--rose-gold-light)', borderBottom: '1px solid rgba(197, 155, 39, 0.2)' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--velvet-charcoal)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <DropletGlyph size={14} color="var(--rose-gold)" />
            {remainingForFreeShipping > 0 ? (
              <span>Add <strong className="font-mono" style={{ color: 'var(--rose-gold)' }}>৳{remainingForFreeShipping}</strong> more for <strong>FREE Delivery</strong> across BD!</span>
            ) : (
              <span style={{ color: '#276749' }}>🎉 You unlocked <strong>FREE Express Shipping!</strong></span>
            )}
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(197, 155, 39, 0.2)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${shippingProgress}%`, height: '100%', background: 'var(--rose-gold)', transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Items List */}
        <div style={{ flexGrow: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--slate-muted)' }}>
              <DropletGlyph size={40} color="var(--slate-muted)" />
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--velvet-charcoal)', marginTop: '16px', marginBottom: '8px' }}>
                Your Cart is Empty
              </h4>
              <p style={{ fontSize: '13px', marginBottom: '20px' }}>Explore active formulations tailored to your skin profile.</p>
              <Link to="/products" onClick={onClose} style={{ background: 'var(--obsidian-emerald)', color: '#FFFFFF', padding: '10px 20px', borderRadius: '6px', fontSize: '14px', fontWeight: 600 }}>
                Browse Formulations
              </Link>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '14px', paddingBottom: '16px', borderBottom: '1px solid var(--border-champagne)', alignItems: 'center' }}>
                <img src={item.image} alt={item.name} style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '8px', background: 'var(--silk-background)' }} />
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--velvet-charcoal)', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.name}
                  </h4>
                  {item.selectedVariantLabel && (
                    <div style={{ fontSize: '11px', color: 'var(--slate-muted)', marginBottom: '4px' }}>
                      {item.selectedVariantLabel}
                    </div>
                  )}
                  <div className="font-mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--obsidian-emerald)' }}>
                    ৳{(item.price * (item.quantity || 1))}
                  </div>

                  {/* Quantity Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-champagne)', borderRadius: '4px' }}>
                      <button onClick={() => updateQuantity(item.id, Math.max(1, (item.quantity || 1) - 1))} style={{ padding: '2px 8px', fontSize: '14px' }}>-</button>
                      <span className="font-mono" style={{ padding: '0 8px', fontSize: '13px', fontWeight: 600 }}>{item.quantity || 1}</span>
                      <button onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)} style={{ padding: '2px 8px', fontSize: '14px' }}>+</button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} style={{ color: '#e53e3e', fontSize: '12px', padding: '4px' }} aria-label="Remove item">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '24px', borderTop: '1px solid var(--border-champagne)', background: 'var(--silk-background)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '18px', fontWeight: 700 }}>
              <span>Subtotal:</span>
              <span className="font-mono" style={{ color: 'var(--obsidian-emerald)' }}>৳{subtotal}</span>
            </div>

            <Link 
              to="/checkout" 
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '100%',
                padding: '16px',
                background: 'var(--obsidian-emerald)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '15px',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              Proceed to Secure Checkout <ArrowRight size={18} />
            </Link>

            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '12px', color: 'var(--slate-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              <ShieldCheck size={14} color="var(--obsidian-emerald)" /> 256-Bit SSL Encrypted Checkout
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default CartDrawer;
