"use client";

import React, { useState, useEffect } from 'react';
import { X, Sparkles, ShieldCheck, Mail } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

const NewsletterPopup: React.FC = () => {
  const { newsletterActive } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (!newsletterActive) return;

    // Check if user has already dismissed or subscribed before
    const isDismissed = localStorage.getItem('beautyglowry_newsletter_dismissed');
    if (isDismissed === 'true') return;

    // 1. Time delay trigger (5 seconds)
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 5000);

    // 2. Exit Intent Trigger (mouse leaves viewport top boundary)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 20) {
        setIsOpen(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [newsletterActive]);

  if (!isOpen) return null;

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem('beautyglowry_newsletter_dismissed', 'true');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;
    
    setSubscribed(true);
    setTimeout(() => {
      setIsOpen(false);
      localStorage.setItem('beautyglowry_newsletter_dismissed', 'true');
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={handleDismiss} 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
      />

      {/* Popup Dialog Panel */}
      <div className="relative w-full max-w-lg bg-bg-secondary rounded-lg shadow-2xl overflow-hidden z-10 p-6 sm:p-8 flex flex-col items-center text-center animate-fade-in border border-soft-border">
        
        {/* Close */}
        <button 
          onClick={handleDismiss} 
          className="absolute top-4 right-4 text-secondary-text hover:text-dark-text transition-colors p-1"
          aria-label="Close newsletter popup"
        >
          <X size={18} />
        </button>

        <span className="text-[9px] font-bold text-premium-green bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 mb-4">
          <Sparkles size={10} className="animate-pulse" /> Welcome Reward
        </span>

        <h3 className="font-serif text-xl sm:text-2xl font-bold text-dark-text mb-2 leading-tight">
          Unlock 10% Off Your First Order
        </h3>
        <p className="text-secondary-text text-xs sm:text-sm leading-relaxed mb-6 max-w-sm">
          Subscribe to our clinical skin newsletter. Get early access to formulations, dermatological guides, and exclusive offers.
        </p>

        {subscribed ? (
          <div className="py-4 text-premium-green font-bold text-sm animate-pulse">
            🎉 Thank you! Check your inbox for your 10% coupon code.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full space-y-3">
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary-text" size={16} />
              <input 
                type="email" 
                required
                placeholder="Enter your professional email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-soft-border rounded-md text-xs sm:text-sm text-dark-text bg-bg-primary focus:outline-hidden focus:border-premium-green transition-all"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-3 bg-dark-text text-white rounded-md text-xs sm:text-sm font-bold tracking-wide hover:bg-premium-green transition-all"
            >
              Get 10% Discount Code
            </button>
          </form>
        )}

        <div className="mt-5 text-[10px] text-secondary-text flex items-center gap-1">
          <ShieldCheck size={12} className="text-premium-green" /> We respect your privacy. Unsubscribe anytime.
        </div>

      </div>
    </div>
  );
};

export default NewsletterPopup;
