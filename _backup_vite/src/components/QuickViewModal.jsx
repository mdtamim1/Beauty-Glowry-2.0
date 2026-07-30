import React, { useState } from 'react';
import { X, Star, ShoppingBag, Check, ArrowRight } from 'lucide-react';
import FormulationReadout from './FormulationReadout';
import DropletGlyph from './DropletGlyph';
import { useCart } from '../context/CartContext';

const QuickViewModal = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(product?.variants ? product.variants[0] : null);

  if (!isOpen || !product) return null;

  const activePrice = selectedVariant ? selectedVariant.price : product.price;

  const handleAddToCart = () => {
    addToCart({
      ...product,
      price: activePrice,
      selectedVariantLabel: selectedVariant ? selectedVariant.label : null
    });
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(6px)' }} />

      {/* Modal Content */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '840px', background: '#FFFFFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', overflow: 'hidden', zIndex: 1001, display: 'grid', gridTemplateColumns: '1fr 1fr' }} className="quick-view-grid">
        
        {/* Close Button */}
        <button onClick={onClose} aria-label="Close modal" style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 10, background: '#FFFFFF', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
          <X size={20} color="var(--velvet-charcoal)" />
        </button>

        {/* Product Image */}
        <div style={{ background: 'var(--silk-background)', aspectRatio: '1', overflow: 'hidden' }}>
          <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Details & Actions */}
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <DropletGlyph size={14} color="var(--rose-gold)" />
              <span className="font-mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--rose-gold)', textTransform: 'uppercase' }}>
                QUICK SPECIFICATION
              </span>
            </div>

            <h3 className="font-editorial" style={{ fontSize: '24px', color: 'var(--velvet-charcoal)', lineHeight: 1.25, marginBottom: '8px' }}>
              {product.name}
            </h3>

            {/* Rating & Price */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <span className="font-mono" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--obsidian-emerald)' }}>
                ৳{activePrice}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--slate-muted)' }}>
                <Star size={14} fill="#BD8A2E" color="#BD8A2E" />
                <span className="font-mono" style={{ fontWeight: 600, color: 'var(--velvet-charcoal)' }}>{product.rating || 4.9}</span>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: 'var(--slate-muted)', lineHeight: 1.5, marginBottom: '20px' }}>
              {product.description}
            </p>

            {/* Formulation Readout Component */}
            {product.actives && product.actives.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <FormulationReadout actives={product.actives} compact={true} title="ACTIVE FORMULATION" />
              </div>
            )}
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={handleAddToCart}
            style={{
              width: '100%',
              padding: '14px',
              background: added ? '#276749' : 'var(--obsidian-emerald)',
              color: '#FFFFFF',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {added ? (
              <> <Check size={18} /> Added to Cart </>
            ) : (
              <> <ShoppingBag size={18} /> Add to Cart (৳{activePrice}) </>
            )}
          </button>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 700px) {
          .quick-view-grid { grid-template-columns: 1fr !important; }
        }
      `}} />
    </div>
  );
};

export default QuickViewModal;
