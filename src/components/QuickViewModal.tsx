"use client";

import React, { useState } from 'react';
import { X, Star, ShoppingBag, Check } from 'lucide-react';
import FormulationReadout from './FormulationReadout';
import DropletGlyph from './DropletGlyph';
import { useCartStore } from '../store/useCartStore';
import { Product } from '../data/products';

interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, isOpen, onClose }) => {
  const { addToCart } = useCartStore();
  const [isAdded, setIsAdded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(
    product?.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  if (!isOpen || !product) return null;

  const activePrice = selectedVariant ? selectedVariant.price : product.price;

  const handleAddToCart = () => {
    addToCart(product, selectedVariant);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-4xl bg-bg-secondary rounded-lg shadow-2xl overflow-hidden z-10 grid grid-cols-1 md:grid-cols-2 max-h-[90vh] md:max-h-none overflow-y-auto">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          aria-label="Close modal" 
          className="absolute top-4 right-4 z-20 w-9 h-9 bg-bg-primary/90 backdrop-blur-xs rounded-full flex items-center justify-center border border-soft-border shadow-md hover:bg-bg-primary transition-all"
        >
          <X size={18} className="text-dark-text" />
        </button>

        {/* Left Column: Product Image */}
        <div className="relative aspect-square w-full bg-bg-primary">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right Column: Details & Actions */}
        <div className="p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <DropletGlyph size={13} color="var(--premium-green)" />
              <span className="font-mono text-[10px] font-bold text-premium-green tracking-wider uppercase">
                Quick Specifications
              </span>
            </div>

            <h3 className="font-serif text-2xl font-bold text-dark-text mb-2 leading-tight">
              {product.name}
            </h3>

            {/* Price & Rating */}
            <div className="flex items-center gap-4 mb-4">
              <span className="font-mono text-2xl font-bold text-dark-text">
                ৳{activePrice}
              </span>
              
              <div className="flex items-center gap-1 text-sm text-secondary-text">
                <Star size={14} fill="#B88A44" color="#B88A44" />
                <span className="font-mono font-bold text-dark-text">{product.rating}</span>
                <span>({product.reviewCount} reviews)</span>
              </div>
            </div>

            <p className="text-xs text-secondary-text leading-relaxed mb-6">
              {product.description}
            </p>

            {/* Formulation Specs */}
            {product.actives && product.actives.length > 0 && (
              <div className="mb-6">
                <FormulationReadout 
                  actives={product.actives} 
                  compact={true} 
                  title="ACTIVE INGREDIENT DOSAGE" 
                />
              </div>
            )}

            {/* Variants Selector */}
            {product.variants && product.variants.length > 1 && (
              <div className="mb-6">
                <span className="text-xs font-bold text-dark-text block mb-2">Select Formulation Size:</span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedVariant(v)}
                      className={`text-xs font-semibold px-3 py-2 rounded-md border transition-all ${
                        selectedVariant?.sku === v.sku
                          ? 'border-premium-green bg-[#8FA88C]/15 text-premium-green'
                          : 'border-soft-border hover:border-dark-text text-dark-text bg-bg-secondary'
                      }`}
                    >
                      {v.label} - ৳{v.price}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add to Cart CTA */}
          <button
            onClick={handleAddToCart}
            className={`w-full py-3.5 rounded-md font-bold text-sm tracking-wide transition-all flex items-center justify-center gap-2 ${
              isAdded 
                ? 'bg-emerald-600 text-white' 
                : 'premium-btn-primary hover:bg-premium-green'
            }`}
          >
            {isAdded ? (
              <>
                <Check size={16} /> Added to Cart
              </>
            ) : (
              <>
                <ShoppingBag size={16} /> Add to Cart (৳{activePrice})
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default QuickViewModal;
