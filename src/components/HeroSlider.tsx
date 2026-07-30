"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSettingsStore, HeroSlide } from '../store/useSettingsStore';

const HeroSlider: React.FC = () => {
  const { heroSlides } = useSettingsStore();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  if (!heroSlides.length) return null;

  const activeSlide = heroSlides[current];

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % heroSlides.length);
  };

  return (
    <section className="relative w-full h-[540px] sm:h-[600px] bg-bg-primary overflow-hidden border-b border-soft-border">
      
      {/* Slides Container */}
      <div className="absolute inset-0 w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 w-full h-full"
          >
            {activeSlide.isVideo ? (
              <video 
                src={activeSlide.image} 
                autoPlay 
                muted 
                loop 
                className="w-full h-full object-cover" 
              />
            ) : (
              <img 
                src={activeSlide.image} 
                alt={activeSlide.title} 
                className="w-full h-full object-cover" 
              />
            )}
            
            {/* Ambient Dark Overlay */}
            <div className="absolute inset-0 bg-black/35" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Content Layer */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-center">
        <div className="max-w-2xl text-white space-y-4">
          
          <motion.span
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-block text-[10px] sm:text-xs font-bold tracking-widest text-[#B88A44] bg-white/10 backdrop-blur-md px-3 py-1 rounded-full uppercase"
          >
            Clinical Precision & Clarity
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="font-serif text-3xl sm:text-5xl font-bold leading-tight"
          >
            {activeSlide.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xs sm:text-sm text-white/80 leading-relaxed max-w-lg"
          >
            {activeSlide.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="pt-4"
          >
            <Link 
              href={activeSlide.link}
              className="inline-flex items-center gap-2 bg-white text-neutral-900 hover:bg-premium-green hover:text-white transition-all text-xs font-bold px-6 py-3 rounded-md shadow-md"
            >
              Explore Formulations <ArrowRight size={14} />
            </Link>
          </motion.div>

        </div>
      </div>

      {/* Left/Right Navigation Arrows */}
      {heroSlides.length > 1 && (
        <>
          <button 
            onClick={handlePrev}
            aria-label="Previous slide"
            className="absolute top-1/2 left-4 z-20 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs text-white hover:bg-white/40 transition-colors flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            onClick={handleNext}
            aria-label="Next slide"
            className="absolute top-1/2 right-4 z-20 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-xs text-white hover:bg-white/40 transition-colors flex items-center justify-center"
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {/* Indicators Dots */}
      {heroSlides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                current === index ? 'bg-white w-6' : 'bg-white/40'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

    </section>
  );
};

export default HeroSlider;
