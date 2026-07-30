import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer style={{ background: 'var(--text-main)', color: '#FFFFFF', padding: '60px 0 30px', borderTop: '1px solid var(--border-light)' }}>
      <div className="container">
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '48px' }}>
          <div>
            <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', marginBottom: '12px' }}>
              BEAUTY GLOWRY
            </h3>
            <p style={{ fontSize: '13px', color: '#9CA3AF', lineHeight: 1.6 }}>
              Dermatological precision formulations engineered for high-efficacy skincare across Bangladesh.
            </p>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>
              Catalog
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#9CA3AF', listStyle: 'none' }}>
              <li><Link to="/products" style={{ color: '#9CA3AF' }}>All Formulations</Link></li>
              <li><Link to="/products?concern=Acne%20%26%20Blemishes" style={{ color: '#9CA3AF' }}>Acne Care</Link></li>
              <li><Link to="/products?concern=Dullness%20%26%20Uneven%20Tone" style={{ color: '#9CA3AF' }}>Radiance Serums</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>
              Tools & Quiz
            </h4>
            <ul style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '14px', color: '#9CA3AF', listStyle: 'none' }}>
              <li><Link to="/quiz" style={{ color: '#9CA3AF' }}>5-Step Skin Quiz</Link></li>
              <li><Link to="/routine" style={{ color: '#9CA3AF' }}>Routine Builder</Link></li>
              <li><Link to="/glossary" style={{ color: '#9CA3AF' }}>Ingredient Glossary</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>
              Payments
            </h4>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '12px', color: '#9CA3AF' }}>
              {['bKash', 'Nagad', 'SSLCommerz', 'Cards', 'COD'].map((p, i) => (
                <span key={i} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '13px', color: '#9CA3AF', textAlign: 'center' }}>
          © {new Date().getFullYear()} BEAUTY GLOWRY. All Rights Reserved.
        </div>

      </div>
    </footer>
  );
};

export default Footer;
