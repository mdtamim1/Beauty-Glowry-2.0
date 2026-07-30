import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
import DropletGlyph from '../components/DropletGlyph';
import { products } from '../data/products';

const ingredientsData = [
  {
    name: 'Niacinamide (Vitamin B3)',
    inci: 'Niacinamide',
    category: 'Barrier & Sebum Control',
    concentrationRange: '2.0% – 10.0%',
    benefits: 'Regulates sebum synthesis, reduces pore diameter, fades post-inflammatory hyperpigmentation (PIH), and strengthens lipid barrier.',
    cautions: 'Generally tolerated by all skin types. High 10% concentration may cause temporary mild flushing on ultra-sensitive skin.',
    productIds: [1]
  },
  {
    name: 'L-Ascorbic Acid (Vitamin C)',
    inci: 'Ascorbic Acid',
    category: 'Antioxidant & Brightening',
    concentrationRange: '10.0% – 20.0%',
    benefits: 'Potent direct antioxidant that neutralizes free radicals, inhibits tyrosinase for dark spot fading, and stimulates collagen synthesis.',
    cautions: 'Formulated at pH < 3.5. Avoid combining in same routine with strong AHAs/BHAs or Direct Retinoids.',
    productIds: [2]
  },
  {
    name: 'Centella Asiatica (Cica)',
    inci: 'Centella Asiatica Leaf Extract',
    category: 'Soothing & Anti-Inflammatory',
    concentrationRange: '10.0% – 84.0%',
    benefits: 'Rich in Asiaticoside and Madecassoside. Calms erythema, accelerates wound healing, and relieves compromised skin barriers.',
    cautions: 'Non-irritating, suitable for rosacea and eczema-prone skin.',
    productIds: [3]
  },
  {
    name: 'Salicylic Acid (BHA)',
    inci: 'Salicylic Acid',
    category: 'Lipophilic Exfoliant',
    concentrationRange: '0.5% – 2.0%',
    benefits: 'Oil-soluble beta-hydroxy acid that penetrates follicular pores to dissolve sebum plugs, blackheads, and acne bacteria.',
    cautions: 'Use sunscreen daily. Limit to 1-2 times daily to prevent over-drying.',
    productIds: [4]
  },
  {
    name: 'Ceramide NP / AP / EOP Complex',
    inci: 'Ceramide NP, Ceramide AP, Ceramide EOP',
    category: 'Barrier Lipid Recovery',
    concentrationRange: '1.0% – 3.0%',
    benefits: 'Bio-identical skin-identical lipids that replenish intercellular cement, prevent transepidermal water loss (TEWL), and shield against allergens.',
    cautions: 'Non-comedogenic, suitable for all skin types including compromised post-procedure skin.',
    productIds: [5]
  },
  {
    name: 'Hyaluronic Acid (Triple Weight)',
    inci: 'Sodium Hyaluronate, Hydrolyzed Hyaluronic Acid',
    category: 'Humectant Hydrator',
    concentrationRange: '1.0% – 2.0%',
    benefits: 'Holds 1,000x its weight in water. Multi-weight matrix hydrates both surface and deeper epidermal layers for immediate plumping.',
    cautions: 'Best applied to slightly damp skin followed by an occlusive moisturizer.',
    productIds: [1, 6]
  }
];

const IngredientGlossary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredIngredients = ingredientsData.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          ing.inci.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          ing.benefits.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ padding: '60px 0', minHeight: '85vh', background: 'var(--porcelain)' }}>
      <div className="container">
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--titrate-teal-light)', padding: '6px 12px', borderRadius: '20px', marginBottom: '12px' }}>
            <DropletGlyph size={14} color="var(--titrate-teal)" />
            <span className="font-mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--titrate-teal)', textTransform: 'uppercase' }}>
              DERMATOLOGICAL DICTIONARY
            </span>
          </div>
          <h1 className="font-editorial" style={{ fontSize: '40px', color: 'var(--ink)', marginBottom: '10px' }}>
            Clinical Ingredient Glossary
          </h1>
          <p style={{ color: 'var(--slate)', fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>
            Explore physiological benefits, scientific INCI designations, and clinical concentrations of our active ingredients.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ maxWidth: '640px', margin: '0 auto 48px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={20} color="var(--slate)" style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search active ingredient by name or INCI (e.g. Niacinamide, Salicylic Acid)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px 16px 52px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-dark)',
                background: '#FFFFFF',
                fontSize: '15px',
                boxShadow: 'var(--shadow)'
              }}
            />
          </div>
        </div>

        {/* Ingredient Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {filteredIngredients.map((ing, idx) => {
            const matchingProds = products.filter(p => ing.productIds.includes(p.id));

            return (
              <div key={idx} style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow)' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <span className="lab-badge lab-badge-teal" style={{ fontSize: '10px' }}>
                      {ing.category}
                    </span>
                    <span className="font-mono" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dropper-amber)', background: 'var(--dropper-amber-light)', padding: '2px 8px', borderRadius: '4px' }}>
                      {ing.concentrationRange}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
                    {ing.name}
                  </h3>

                  <div className="font-mono" style={{ fontSize: '12px', color: 'var(--slate)', marginBottom: '16px', fontStyle: 'italic' }}>
                    INCI: {ing.inci}
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--titrate-teal)', fontWeight: 700, marginBottom: '4px' }}>Clinical Benefits</h4>
                    <p style={{ color: 'var(--ink)', fontSize: '14px', lineHeight: 1.5 }}>{ing.benefits}</p>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--dropper-amber)', fontWeight: 700, marginBottom: '4px' }}>Compatibility & Cautions</h4>
                    <p style={{ color: 'var(--slate)', fontSize: '13px', lineHeight: 1.5 }}>{ing.cautions}</p>
                  </div>
                </div>

                {/* Linked Products */}
                {matchingProds.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '16px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--slate)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                      FORMULATIONS CONTAINING THIS ACTIVE:
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {matchingProds.map(p => (
                        <Link key={p.id} to={`/product/${p.id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--porcelain)', borderRadius: '6px', fontSize: '13px', color: 'var(--ink)', fontWeight: 500 }}>
                          <span>{p.name}</span>
                          <ExternalLink size={14} color="var(--titrate-teal)" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default IngredientGlossary;
