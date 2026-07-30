import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Plus, Check, ShoppingBag, ArrowRight } from 'lucide-react';
import DropletGlyph from '../components/DropletGlyph';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';

const RoutineBuilder = () => {
  const [activeTab, setActiveTab] = useState('AM'); // AM or PM
  const [routine, setRoutine] = useState({
    AM: { 1: products[3], 2: products[0], 3: products[4], 4: null }, // Cleanser, Serum, Moisturizer, Sunscreen
    PM: { 1: products[3], 2: products[1], 3: products[4], 4: null }
  });
  const { addToCart } = useCart();
  const [addedAll, setAddedAll] = useState(false);

  const stepsAM = [
    { stepNum: '01', title: 'Gentle Cleansing', desc: 'Remove overnight lipid build-up without stripping.' },
    { stepNum: '02', title: 'Targeted Treatment', desc: 'Apply high-potency actives (Niacinamide / Vitamin C).' },
    { stepNum: '03', title: 'Barrier Hydration', desc: 'Seal in hydration with lightweight lipid moisture.' },
    { stepNum: '04', title: 'Broad-Spectrum SPF 50', desc: 'Shield against UVA/UVB photo-aging & spot dark pigmentation.' }
  ];

  const stepsPM = [
    { stepNum: '01', title: 'Deep Pore Cleansing', desc: 'Dissolve daily pollution, sebum, and micro-particles.' },
    { stepNum: '02', title: 'Cellular Repair Actives', desc: 'Apply concentrated repair serums during peak renewal.' },
    { stepNum: '03', title: 'Nourishing Lipid Recovery', desc: 'Reinforce lipid barrier with bio-identical Ceramides.' },
    { stepNum: '04', title: 'Overnight Seal / Mask', desc: 'Lock in transepidermal water retention overnight.' }
  ];

  const currentSteps = activeTab === 'AM' ? stepsAM : stepsPM;
  const currentRoutine = routine[activeTab];

  const handleAddFullRoutine = () => {
    Object.values(currentRoutine).forEach(prod => {
      if (prod) addToCart(prod);
    });
    setAddedAll(true);
    setTimeout(() => setAddedAll(false), 2000);
  };

  return (
    <div style={{ padding: '60px 0', minHeight: '85vh', background: 'var(--porcelain)' }}>
      <div className="container">
        
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--titrate-teal-light)', padding: '6px 12px', borderRadius: '20px', marginBottom: '12px' }}>
            <DropletGlyph size={14} color="var(--titrate-teal)" />
            <span className="font-mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--titrate-teal)', textTransform: 'uppercase' }}>
              STEP-BASED CHRONO-ROUTINE
            </span>
          </div>
          <h1 className="font-editorial" style={{ fontSize: '40px', color: 'var(--ink)', marginBottom: '10px' }}>
            AM / PM Clinical Routine Builder
          </h1>
          <p style={{ color: 'var(--slate)', fontSize: '15px', maxWidth: '600px', margin: '0 auto' }}>
            Structure your morning protection & evening cellular recovery regimens in optimal physiological sequence.
          </p>
        </div>

        {/* AM / PM Toggle Tabs */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '48px' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-dark)', borderRadius: '30px', padding: '4px', display: 'inline-flex', gap: '4px' }}>
            <button
              onClick={() => setActiveTab('AM')}
              style={{
                padding: '12px 32px',
                borderRadius: '26px',
                background: activeTab === 'AM' ? 'var(--titrate-teal)' : 'transparent',
                color: activeTab === 'AM' ? '#FFFFFF' : 'var(--ink)',
                fontWeight: 600,
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Sun size={18} /> AM Morning Routine
            </button>

            <button
              onClick={() => setActiveTab('PM')}
              style={{
                padding: '12px 32px',
                borderRadius: '26px',
                background: activeTab === 'PM' ? 'var(--ink)' : 'transparent',
                color: activeTab === 'PM' ? '#FFFFFF' : 'var(--ink)',
                fontWeight: 600,
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Moon size={18} /> PM Evening Routine
            </button>
          </div>
        </div>

        {/* 4 Numbered Steps Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '48px' }}>
          {currentSteps.map((step, idx) => {
            const stepProduct = currentRoutine[idx + 1];

            return (
              <div key={idx} style={{ background: '#FFFFFF', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: 'var(--shadow)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span className="font-mono" style={{ fontSize: '24px', fontWeight: 700, color: activeTab === 'AM' ? 'var(--titrate-teal)' : 'var(--dropper-amber)' }}>
                      {step.stepNum}
                    </span>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--slate)', fontWeight: 600 }}>
                      STEP {idx + 1}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '17px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                    {step.title}
                  </h3>
                  <p style={{ color: 'var(--slate)', fontSize: '13px', lineHeight: 1.5, marginBottom: '20px' }}>
                    {step.desc}
                  </p>
                </div>

                {/* Selected Product in Step */}
                {stepProduct ? (
                  <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', padding: '12px', background: 'var(--porcelain)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={stepProduct.image} alt={stepProduct.name} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }} />
                    <div style={{ flexGrow: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {stepProduct.name}
                      </div>
                      <div className="font-mono" style={{ fontSize: '12px', color: 'var(--titrate-teal)', fontWeight: 700 }}>
                        ৳{stepProduct.price}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ border: '1px dashed var(--border-dark)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center', color: 'var(--slate)', fontSize: '13px' }}>
                    + Select formulation for step {step.stepNum}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Bar */}
        <div style={{ background: '#FFFFFF', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-lg)', padding: '28px 36px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h3 className="font-editorial" style={{ fontSize: '22px', color: 'var(--ink)', marginBottom: '4px' }}>
              Complete {activeTab} Regimen Package
            </h3>
            <p style={{ color: 'var(--slate)', fontSize: '14px' }}>
              Formulations formulated for sequential synergy.
            </p>
          </div>

          <button
            onClick={handleAddFullRoutine}
            style={{
              background: addedAll ? '#276749' : 'var(--titrate-teal)',
              color: '#FFFFFF',
              padding: '16px 36px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 600,
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            {addedAll ? (
              <> <Check size={20} /> Added {activeTab} Routine to Cart </>
            ) : (
              <> <ShoppingBag size={20} /> Add Full {activeTab} Routine to Cart </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default RoutineBuilder;
