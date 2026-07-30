"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';

const CountdownTimer: React.FC = () => {
  const { flashSaleEnd } = useSettingsStore();
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    if (!flashSaleEnd) return;

    const calculateTimeLeft = () => {
      const difference = +new Date(flashSaleEnd) - +new Date();
      if (difference <= 0) return null;

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [flashSaleEnd]);

  if (!timeLeft) return null;

  return (
    <section className="bg-[#202124] py-12 border-b border-soft-border text-white text-center relative overflow-hidden">
      {/* Decorative gradient elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-premium-green/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-gold-accent/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="max-w-4xl mx-auto px-4 relative z-10 flex flex-col items-center">
        
        <span className="text-[10px] font-bold text-premium-green bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5 mb-4">
          <Sparkles size={11} className="animate-pulse" /> Limited Flash Sale
        </span>

        <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight mb-2">
          Clinical Essentials Flash Sale
        </h2>
        <p className="text-white/60 text-xs sm:text-sm mb-8 max-w-md">
          Receive up to <strong>15% OFF</strong> on premium dermatologist-recommended formulations. Offer expiring soon.
        </p>

        {/* Ticking Clock Layout */}
        <div className="flex gap-4 sm:gap-6 justify-center items-center mb-8">
          {[
            { label: 'Days', value: timeLeft.days },
            { label: 'Hours', value: timeLeft.hours },
            { label: 'Min', value: timeLeft.minutes },
            { label: 'Sec', value: timeLeft.seconds },
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/5 border border-white/10 rounded-md flex items-center justify-center font-mono text-xl sm:text-2xl font-bold shadow-inner">
                {String(item.value).padStart(2, '0')}
              </div>
              <span className="text-[9px] sm:text-[10px] text-white/55 uppercase font-bold tracking-wider mt-2">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <Link 
          href="/products?on_sale=true"
          className="inline-flex items-center gap-2 text-xs font-bold px-6 py-3.5 rounded-md btn-3d-white"
        >
          Shop Flash Deals <ArrowRight size={14} />
        </Link>

      </div>
    </section>
  );
};

export default CountdownTimer;
