import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ShoppingBag, User, Menu, X, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import CartDrawer from './CartDrawer';
import LiveSearchModal from './LiveSearchModal';

const Navbar = () => {
  const { cart } = useCart();
  const { user } = useAuth();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalCartCount = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <>
      <header style={{ background: '#FFFFFF', borderBottom: '1px solid var(--border-light)', position: 'sticky', top: 0, zIndex: 100 }}>
        
        {/* Top Banner */}
        <div style={{ background: 'var(--text-main)', color: '#FFFFFF', padding: '6px 16px', fontSize: '12px', textAlign: 'center' }}>
          Free Express Delivery across Bangladesh on orders over <strong>৳1,500</strong>
        </div>

        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '70px' }}>
          
          {/* Mobile Menu Toggle */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mobile-toggle" aria-label="Toggle Menu" style={{ display: 'none' }}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link to="/" style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '0.02em', color: 'var(--text-main)' }}>
            BEAUTY GLOWRY
          </Link>

          {/* Navigation Links */}
          <nav style={{ display: 'flex', gap: '28px', fontSize: '14px', fontWeight: 500 }} className="desktop-links">
            <Link to="/products">All Formulations</Link>
            <Link to="/products?concern=Acne%20%26%20Blemishes">Acne & Pores</Link>
            <Link to="/quiz" style={{ color: 'var(--accent-color)', fontWeight: 600 }}>Skin Quiz</Link>
            <Link to="/routine">Routine Builder</Link>
            <Link to="/glossary">Ingredient Glossary</Link>
          </nav>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <button onClick={() => setSearchModalOpen(true)} aria-label="Search">
              <Search size={20} color="var(--text-main)" />
            </button>
            <Link to="/wishlist" aria-label="Wishlist">
              <Heart size={20} color="var(--text-main)" />
            </Link>
            <Link to={user ? "/account" : "/login"} aria-label="Account">
              <User size={20} color="var(--text-main)" />
            </Link>
            <button onClick={() => setCartDrawerOpen(true)} aria-label="Cart" style={{ position: 'relative' }}>
              <ShoppingBag size={20} color="var(--text-main)" />
              {totalCartCount > 0 && (
                <span className="font-mono" style={{ position: 'absolute', top: '-6px', right: '-8px', background: 'var(--accent-color)', color: '#FFF', fontSize: '11px', fontWeight: 700, width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div style={{ padding: '20px', background: '#FFFFFF', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '15px' }}>
            <Link to="/products" onClick={() => setMobileMenuOpen(false)}>All Formulations</Link>
            <Link to="/quiz" onClick={() => setMobileMenuOpen(false)} style={{ color: 'var(--accent-color)', fontWeight: 600 }}>5-Step Skin Quiz</Link>
            <Link to="/routine" onClick={() => setMobileMenuOpen(false)}>Routine Builder</Link>
            <Link to="/glossary" onClick={() => setMobileMenuOpen(false)}>Ingredient Glossary</Link>
          </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: `
          @media (max-width: 850px) {
            .desktop-links { display: none !important; }
            .mobile-toggle { display: block !important; }
          }
        `}} />
      </header>

      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
      <LiveSearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </>
  );
};

export default Navbar;
