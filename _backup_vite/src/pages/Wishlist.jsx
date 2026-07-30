import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { Heart, ShoppingBag } from 'lucide-react';

const Wishlist = () => {
  const { wishlist } = useCart();

  if (wishlist.length === 0) {
    return (
      <div className="container empty-wishlist">
        <div className="empty-content animate-fade">
          <div className="wish-icon-bg"><Heart size={80} /></div>
          <h2>Your Wishlist is Empty</h2>
          <p>You haven't saved any items yet. Start exploring our collection!</p>
          <Link to="/products" className="btn btn-primary">Discover Products</Link>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          .empty-wishlist { padding: 120px 0; display: flex; align-items: center; justify-content: center; }
          .empty-content { text-align: center; max-width: 400px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
          .wish-icon-bg { width: 160px; height: 160px; background: var(--primary-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary-dark); }
          .empty-content h2 { font-size: 32px; }
          .empty-content p { color: var(--text-muted); }
        ` }} />
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        <div className="page-header">
            <h1 className="page-title">My Wishlist ({wishlist.length})</h1>
            <p>Your curated collection of premium skincare.</p>
        </div>
        
        <div className="product-grid animate-fade">
          {wishlist.map(product => (
            <ProductCard key={product.firestoreId || product.id} product={product} />
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .wishlist-page { padding: 60px 0 100px; background: #fdfdfd; }
        .page-header { margin-bottom: 48px; text-align: center; }
        .page-title { font-size: 36px; margin-bottom: 8px; }
        .page-header p { color: var(--text-muted); font-size: 18px; }
        
        .product-grid { 
          display: grid; 
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); 
          gap: 32px; 
        }

        @media (max-width: 768px) {
          .page-title { font-size: 28px; }
        }
      ` }} />
    </div>
  );
};

export default Wishlist;
