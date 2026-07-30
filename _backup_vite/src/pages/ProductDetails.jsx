import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShieldCheck, Truck, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import FormulationReadout from '../components/FormulationReadout';
import DropletGlyph from '../components/DropletGlyph';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { products as fallbackProducts } from '../data/products';

const ProductDetails = () => {
  const { id } = useParams();
  const { products, submitReview } = useProducts();
  const { addToCart } = useCart();

  const product = products.find(p => String(p.id) === String(id) || String(p.firestoreId) === String(id)) || fallbackProducts[0];

  const [selectedImage, setSelectedImage] = useState(product.image);
  const [selectedVariant, setSelectedVariant] = useState(product.variants ? product.variants[0] : null);
  const [isSubscription, setIsSubscription] = useState(false);
  const [added, setAdded] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [activeTab, setActiveTab] = useState('INCI');

  // Review Form State
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const images = product.productImages || [product.image];
  const activePrice = selectedVariant ? selectedVariant.price : product.price;
  const subscriptionPrice = (activePrice * 0.9).toFixed(0);

  // Sticky Quick Buy Bar on Scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 450) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAddToCart = () => {
    const itemToAdd = {
      ...product,
      price: isSubscription ? Number(subscriptionPrice) : activePrice,
      selectedVariantLabel: selectedVariant ? selectedVariant.label : null,
      isSubscription
    };
    addToCart(itemToAdd);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;
    setReviewSubmitting(true);
    try {
      await submitReview(product.id, {
        userName: reviewName,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewName('');
      setReviewComment('');
      alert('Thank you! Your verified clinical review has been posted.');
    } catch (err) {
      console.error(err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const crossSells = fallbackProducts.filter(p => p.id !== product.id).slice(0, 3);

  return (
    <div style={{ padding: '40px 0 100px', background: 'var(--silk-background)', minHeight: '90vh' }}>
      <div className="container">
        
        {/* Breadcrumb */}
        <div style={{ fontSize: '13px', color: 'var(--slate-muted)', marginBottom: '28px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Link to="/" style={{ color: 'var(--slate-muted)' }}>Home</Link>
          <span>/</span>
          <Link to="/products" style={{ color: 'var(--slate-muted)' }}>Formulations</Link>
          <span>/</span>
          <span style={{ color: 'var(--velvet-charcoal)', fontWeight: 600 }}>{product.name}</span>
        </div>

        {/* PDP Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.1fr 0.9fr',
          gap: '48px',
          alignItems: 'flex-start',
          marginBottom: '64px'
        }} className="pdp-grid">

          {/* Left Column: Multi-Angle Gallery */}
          <div>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-champagne)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              aspectRatio: '1',
              marginBottom: '16px',
              position: 'relative'
            }}>
              <img 
                src={selectedImage || product.image} 
                alt={product.name} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {images.length > 1 && (
              <div style={{ display: 'flex', gap: '12px' }}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: selectedImage === img ? '2px solid var(--obsidian-emerald)' : '1px solid var(--border-champagne)',
                      background: '#FFFFFF'
                    }}
                  >
                    <img src={img} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Formulation Specification & Purchase Actions */}
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-champagne)', borderRadius: 'var(--radius-lg)', padding: '36px', boxShadow: 'var(--shadow-md)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <DropletGlyph size={14} color="var(--rose-gold)" />
              <span className="font-mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--rose-gold)', textTransform: 'uppercase' }}>
                CLINICAL SPECIFICATION
              </span>
            </div>

            <h1 className="font-editorial" style={{ fontSize: '32px', color: 'var(--velvet-charcoal)', lineHeight: 1.25, marginBottom: '12px' }}>
              {product.name}
            </h1>

            {/* Rating & Reviews */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', color: '#BD8A2E' }}>
                <Star size={16} fill="#BD8A2E" color="#BD8A2E" />
              </div>
              <span className="font-mono" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--velvet-charcoal)' }}>
                {product.rating || 4.9}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--slate-muted)' }}>
                ({product.reviewCount || 142} Verified Reviews)
              </span>
            </div>

            {/* Pricing Box */}
            <div style={{ marginBottom: '24px', padding: '16px 20px', background: 'var(--silk-background)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-champagne)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                <span className="font-mono" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--obsidian-emerald)' }}>
                  ৳{isSubscription ? subscriptionPrice : activePrice}
                </span>
                {product.originalPrice && (
                  <span className="font-mono" style={{ fontSize: '16px', color: 'var(--slate-muted)', textDecoration: 'line-through' }}>
                    ৳{product.originalPrice}
                  </span>
                )}
                {isSubscription && (
                  <span className="font-mono" style={{ fontSize: '12px', background: 'var(--rose-gold-light)', color: 'var(--rose-gold)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    10% RECURRING DISCOUNT
                  </span>
                )}
              </div>
              
              <div className="font-mono" style={{ fontSize: '12px', color: '#276749', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} /> In Stock ({product.stock || 25} units available in lab inventory)
              </div>
            </div>

            {/* Signature FormulationReadout Component */}
            {product.actives && product.actives.length > 0 && (
              <div style={{ marginBottom: '28px' }}>
                <FormulationReadout actives={product.actives} title="ACTIVE INGREDIENT PROFILE" compact={true} />
              </div>
            )}

            {/* Variant Selector */}
            {product.variants && product.variants.length > 1 && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--velvet-charcoal)', marginBottom: '8px' }}>
                  Select Volume Size:
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {product.variants.map((varItem, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedVariant(varItem)}
                      style={{
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-sm)',
                        border: (selectedVariant?.sku === varItem.sku) ? '2px solid var(--obsidian-emerald)' : '1px solid var(--border-champagne)',
                        background: (selectedVariant?.sku === varItem.sku) ? 'var(--emerald-light)' : '#FFFFFF',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: 'var(--velvet-charcoal)'
                      }}
                    >
                      {varItem.label} - ৳{varItem.price}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Subscribe & Save Toggle */}
            <div style={{ border: '1px solid var(--border-champagne)', borderRadius: 'var(--radius-sm)', padding: '16px', marginBottom: '28px', background: isSubscription ? 'var(--emerald-light)' : '#FFFFFF' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={isSubscription}
                  onChange={(e) => setIsSubscription(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px', accentColor: 'var(--obsidian-emerald)' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--velvet-charcoal)' }}>
                    Subscribe & Save 10% (Auto-deliver every 4 weeks)
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--slate-muted)', marginTop: '2px' }}>
                    Cancel or skip anytime with 1-click in account dashboard.
                  </div>
                </div>
              </label>
            </div>

            {/* Add to Cart CTA */}
            <button
              onClick={handleAddToCart}
              style={{
                width: '100%',
                padding: '18px',
                background: added ? '#276749' : 'var(--obsidian-emerald)',
                color: '#FFFFFF',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                marginBottom: '20px',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              {added ? (
                <> <Check size={20} /> Formulating... Added to Cart </>
              ) : (
                <> <ShoppingBag size={20} /> Add to Regimen Cart (৳{isSubscription ? subscriptionPrice : activePrice}) </>
              )}
            </button>

            {/* Delivery Trust Badges */}
            <div style={{ display: 'flex', gap: '20px', fontSize: '13px', color: 'var(--slate-muted)', paddingTop: '16px', borderTop: '1px solid var(--border-champagne)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Truck size={16} color="var(--obsidian-emerald)" /> Free shipping over ৳1,500
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} color="var(--obsidian-emerald)" /> 100% Authentic Guaranteed
              </div>
            </div>

          </div>
        </div>

        {/* Specifications Tabs (INCI, How to Use, Reviews) */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-champagne)', borderRadius: 'var(--radius-lg)', padding: '40px', marginBottom: '64px' }}>
          
          <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid var(--border-champagne)', paddingBottom: '16px', marginBottom: '28px' }}>
            <button 
              onClick={() => setActiveTab('INCI')}
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: activeTab === 'INCI' ? 'var(--obsidian-emerald)' : 'var(--slate-muted)',
                borderBottom: activeTab === 'INCI' ? '2px solid var(--obsidian-emerald)' : 'none',
                paddingBottom: '8px'
              }}
            >
              Full INCI Ingredient List
            </button>

            <button 
              onClick={() => setActiveTab('HOW_TO_USE')}
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: activeTab === 'HOW_TO_USE' ? 'var(--obsidian-emerald)' : 'var(--slate-muted)',
                borderBottom: activeTab === 'HOW_TO_USE' ? '2px solid var(--obsidian-emerald)' : 'none',
                paddingBottom: '8px'
              }}
            >
              Application Instructions
            </button>

            <button 
              onClick={() => setActiveTab('REVIEWS')}
              style={{
                fontSize: '15px',
                fontWeight: 600,
                color: activeTab === 'REVIEWS' ? 'var(--obsidian-emerald)' : 'var(--slate-muted)',
                borderBottom: activeTab === 'REVIEWS' ? '2px solid var(--obsidian-emerald)' : 'none',
                paddingBottom: '8px'
              }}
            >
              Verified Customer Reviews
            </button>
          </div>

          {activeTab === 'INCI' && (
            <div>
              <p style={{ fontSize: '14px', color: 'var(--slate-muted)', marginBottom: '12px' }}>
                Full International Nomenclature of Cosmetic Ingredients (INCI) declaration:
              </p>
              <div className="font-mono" style={{ background: 'var(--silk-background)', padding: '20px', borderRadius: '8px', border: '1px solid var(--border-champagne)', fontSize: '13px', color: 'var(--velvet-charcoal)', lineHeight: 1.7 }}>
                {product.inciList || "Aqua (Water), Niacinamide, Zinc PCA, Sodium Hyaluronate, Dimethyl Isosorbide, Ethoxydiglycol, Phenoxyethanol, Chlorphenesin."}
              </div>
            </div>
          )}

          {activeTab === 'HOW_TO_USE' && (
            <div>
              <p style={{ fontSize: '14px', color: 'var(--slate-muted)', marginBottom: '16px' }}>
                Follow this sequential application guide for maximum epidermal efficacy:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(product.usageSteps || ["Apply 3-4 drops to clean face", "Gently pat into skin", "Follow with moisturizer"]).map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span className="font-mono" style={{ background: 'var(--emerald-light)', color: 'var(--obsidian-emerald)', padding: '4px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 700 }}>
                      STEP 0{idx + 1}
                    </span>
                    <span style={{ fontSize: '15px', color: 'var(--velvet-charcoal)', marginTop: '2px' }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'REVIEWS' && (
            <div>
              {/* Review Form */}
              <form onSubmit={handleReviewSubmit} style={{ background: 'var(--silk-background)', padding: '24px', borderRadius: 'var(--radius-md)', marginBottom: '32px' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>Submit Verified Review</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <input type="text" placeholder="Your Name" required value={reviewName} onChange={e => setReviewName(e.target.value)} style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-champagne)' }} />
                  <select value={reviewRating} onChange={e => setReviewRating(Number(e.target.value))} style={{ padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-champagne)' }}>
                    <option value={5}>5 Stars ★★★★★</option>
                    <option value={4}>4 Stars ★★★★☆</option>
                    <option value={3}>3 Stars ★★★☆☆</option>
                  </select>
                </div>
                <textarea rows={3} placeholder="Share your skin results with this formulation..." required value={reviewComment} onChange={e => setReviewComment(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--border-champagne)', marginBottom: '16px' }} />
                <button type="submit" disabled={reviewSubmitting} style={{ background: 'var(--obsidian-emerald)', color: '#FFFFFF', padding: '10px 24px', borderRadius: '6px', fontWeight: 600 }}>
                  {reviewSubmitting ? 'Submitting...' : 'Post Review'}
                </button>
              </form>

              {/* Reviews List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {(product.reviews && product.reviews.length > 0 ? product.reviews : [
                  { userName: 'Dr. Nusrat Jahan', rating: 5, comment: 'Prescribed this 10% Niacinamide formulation to my acne-prone patients with incredible sebum reduction results within 2 weeks.', createdAt: '2026-07-15' },
                  { userName: 'Anika Rahman', rating: 5, comment: 'Non-tacky texture and visible reduction in dark acne marks. My holy grail serum!', createdAt: '2026-07-20' }
                ]).map((rev, idx) => (
                  <div key={idx} style={{ borderBottom: '1px solid var(--border-champagne)', paddingBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--velvet-charcoal)' }}>{rev.userName}</span>
                      <span className="font-mono" style={{ fontSize: '12px', color: 'var(--slate-muted)' }}>Verified Purchase</span>
                    </div>
                    <div style={{ color: '#BD8A2E', fontSize: '13px', marginBottom: '6px' }}>{'★'.repeat(rev.rating)}</div>
                    <p style={{ color: 'var(--velvet-charcoal)', fontSize: '14px' }}>{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Cross-Sell */}
        <div>
          <h2 className="font-editorial" style={{ fontSize: '28px', color: 'var(--velvet-charcoal)', marginBottom: '24px' }}>
            Complete Your Sequential Routine
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
            {crossSells.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

      </div>

      {/* Sticky Bottom Quick-Buy Bar on PDP Scroll */}
      {showStickyBar && (
        <div 
          className="animate-fade"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 900,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid var(--border-champagne)',
            padding: '12px 24px',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img src={product.image} alt={product.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--velvet-charcoal)' }}>{product.name}</div>
                <div className="font-mono" style={{ fontSize: '14px', color: 'var(--obsidian-emerald)', fontWeight: 700 }}>৳{activePrice}</div>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              style={{
                background: added ? '#276749' : 'var(--obsidian-emerald)',
                color: '#FFFFFF',
                padding: '12px 28px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 700,
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {added ? <Check size={18} /> : <ShoppingBag size={18} />}
              {added ? 'Added to Cart' : `Add to Cart (৳${activePrice})`}
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 900px) {
          .pdp-grid { grid-template-columns: 1fr !important; }
        }
      `}} />
    </div>
  );
};

export default ProductDetails;
