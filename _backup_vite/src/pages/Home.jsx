import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star } from 'lucide-react';
import Hero from '../components/Hero';
import ProductCard from '../components/ProductCard';
import FormulationReadout from '../components/FormulationReadout';
import { products, skinConcerns } from '../data/products';

const Home = () => {
  const bestsellers = products.filter(p => p.isBestseller).slice(0, 4);

  return (
    <div style={{ background: 'var(--bg-main)', minHeight: '100vh' }}>
      
      {/* 1. Hero */}
      <Hero />

      {/* 2. Shop by Skin Concern */}
      <section style={{ padding: '60px 0', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              Targeted Skin Solutions
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
              Select your primary concern to filter clinical formulations.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
            {skinConcerns.map((c) => (
              <Link 
                key={c.id} 
                to={`/products?concern=${encodeURIComponent(c.name)}`}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '20px', textAlign: 'center', transition: 'all 0.2s ease' }}
              >
                <div style={{ fontWeight: 600, fontSize: '15px', color: 'var(--text-main)' }}>{c.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Bestsellers Grid */}
      <section style={{ padding: '64px 0', borderBottom: '1px solid var(--border-light)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '36px' }}>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '4px' }}>
                Bestselling Formulations
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                Dermatologist-formulated active serums and daily treatments.
              </p>
            </div>
            <Link to="/products" style={{ color: 'var(--accent-color)', fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All <ArrowRight size={16} />
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {bestsellers.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. Formulation Transparency */}
      <section style={{ padding: '64px 0', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 40px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
              100% Formulation Transparency
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
              Every active percentage is declared directly on our label and backed by clinical testing.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <FormulationReadout 
              title="CLARIFYING & SEBUM CONTROL"
              actives={[
                { name: 'NIACINAMIDE', concentration: 10.0, unit: '%' },
                { name: 'ZINC PCA', concentration: 1.0, unit: '%' }
              ]}
            />
            <FormulationReadout 
              title="ANTIOXIDANT RADIANCE"
              actives={[
                { name: 'L-ASCORBIC ACID', concentration: 15.0, unit: '%' },
                { name: 'FERULIC ACID', concentration: 0.5, unit: '%' }
              ]}
            />
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
