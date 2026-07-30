import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Award } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const Hero = () => {
  const { settings } = useSettings();

  const heroImageSrc = settings?.heroImage || settings?.heroBanner || "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=1000&auto=format&fit=crop";

  return (
    <section style={{ padding: '64px 0', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-light)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'center' }} className="hero-split">
          
          <div>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'inline-block', marginBottom: '12px' }}>
              Precision Clinical Skincare
            </span>

            <h1 style={{ fontSize: '44px', lineHeight: 1.15, marginBottom: '16px', fontWeight: 700 }}>
              Dermatological Formulations for Real Results
            </h1>

            <p style={{ fontSize: '16px', color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.6 }}>
              High-potency active ingredient concentrations engineered to target acne, hyperpigmentation, and barrier repair.
            </p>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link 
                to="/products"
                style={{ background: 'var(--primary-color)', color: '#FFFFFF', padding: '14px 28px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                Shop Formulations <ArrowRight size={16} />
              </Link>
              <Link 
                to="/quiz"
                style={{ background: '#FFFFFF', color: 'var(--text-main)', border: '1px solid var(--border-light)', padding: '14px 24px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '15px' }}
              >
                Take Skin Quiz
              </Link>
            </div>
          </div>

          <div>
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-light)', background: '#FFFFFF', aspectRatio: '1' }}>
              <img 
                src={heroImageSrc} 
                alt="Hero Banner" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1000&auto=format&fit=crop";
                }}
              />
            </div>
          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 850px) {
          .hero-split { grid-template-columns: 1fr !important; }
        }
      `}} />
    </section>
  );
};

export default Hero;
