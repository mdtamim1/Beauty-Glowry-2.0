import React, { createContext, useContext, useState, useEffect } from 'react';

import { useSettings } from './SettingsContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [wishlist, setWishlist] = useState(() => {
    const savedWishlist = localStorage.getItem('wishlist');
    return savedWishlist ? JSON.parse(savedWishlist) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const addToCart = (product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      
      if (window.trackAddToCart) {
        window.trackAddToCart(product.name, product.discountPrice || product.price);
      }

      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id, delta) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (product) => {
    setWishlist(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.filter(item => item.id !== product.id);
      return [...prev, product];
    });
  };

  const { settings } = useSettings();

  const subtotal = cart.reduce((acc, item) => acc + (item.discountPrice || item.price) * item.quantity, 0);
  const threshold = Number(settings?.freeShippingThreshold ?? 1500);
  const deliveryCharge = subtotal > threshold ? 0 : Number(settings?.deliveryDhaka ?? 60); 
  const total = subtotal + deliveryCharge;

  return (
    <CartContext.Provider value={{
      cart, addToCart, removeFromCart, updateQuantity, clearCart, 
      subtotal, deliveryCharge, total,
      wishlist, toggleWishlist
    }}>
      {children}
    </CartContext.Provider>
  );
};
