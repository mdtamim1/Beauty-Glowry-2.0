import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Eye, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import QuickViewModal from './QuickViewModal';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const primaryActive = product.actives && product.actives.length > 0
    ? `${product.actives[0].name} ${product.actives[0].concentration}${product.actives[0].unit}`
    : null;

  return (
    <>
      <div style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        
        {/* Product Image */}
        <div style={{ position: 'relative', aspectRatio: '1', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
          <Link to={`/product/${product.id}`} style={{ display: 'block', width: '100%', height: '100%' }}>
            <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Link>
          
          <button
            onClick={() => setQuickViewOpen(true)}
            aria-label="Quick view"
            style={{ position: 'absolute', top: '10px', right: '10px', background: '#FFFFFF', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            <Eye size={16} color="var(--text-main)" />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'space-between' }}>
          <div>
            {primaryActive && (
              <span className="font-mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--accent-color)', background: '#ECFDF5', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', marginBottom: '6px' }}>
                {primaryActive}
              </span>
            )}
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>{product.category}</div>
            
            <Link to={`/product/${product.id}`}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.3 }}>
                {product.name}
              </h3>
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              <Star size={13} fill="#F59E0B" color="#F59E0B" />
              <span className="font-mono" style={{ fontWeight: 600, color: 'var(--text-main)' }}>{product.rating || 4.9}</span>
              <span>({product.reviewCount || 42})</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
            <span className="font-mono" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-main)' }}>
              ৳{product.price}
            </span>
            
            <button
              onClick={handleAddToCart}
              style={{ background: added ? '#10B981' : 'var(--primary-color)', color: '#FFFFFF', padding: '8px 14px', borderRadius: 'var(--radius-sm)', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {added ? <Check size={14} /> : <ShoppingBag size={14} />}
              {added ? 'Added' : 'Add'}
            </button>
          </div>

        </div>

      </div>

      <QuickViewModal product={product} isOpen={quickViewOpen} onClose={() => setQuickViewOpen(false)} />
    </>
  );
};

export default ProductCard;
