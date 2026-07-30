import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Calendar, User, Mail, Phone, Clock, Sparkles } from 'lucide-react';
import DropletGlyph from '../components/DropletGlyph';
import FormulationReadout from '../components/FormulationReadout';
import { products } from '../data/products';

const SkinQuiz = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState({
    skinType: '',
    concerns: [],
    goals: '',
    routineComplexity: '',
    budget: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [bookingModal, setBookingModal] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({ name: '', email: '', phone: '', timeSlot: '' });
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  const steps = [
    {
      id: 1,
      title: 'Identify Your Epidermal Skin Type',
      subtitle: 'How does your skin feel 2 hours after washing without applying moisturizer?',
      options: [
        { label: 'Oily / Shiny All Over', value: 'Oily' },
        { label: 'Tight, Flaky, or Rough', value: 'Dry' },
        { label: 'Oily T-Zone (Forehead & Nose), Dry Cheeks', value: 'Combination' },
        { label: 'Red, Easily Irritated, Reacts to New Products', value: 'Sensitive' },
        { label: 'Balanced, Comfortable, No Excess Oil', value: 'Normal' }
      ]
    },
    {
      id: 2,
      title: 'Select Primary Dermatological Concerns',
      subtitle: 'Which skin challenges do you want to target clinically? (Select up to 2)',
      isMulti: true,
      options: [
        { label: 'Active Acne, Breakouts & Blackheads', value: 'Acne & Blemishes' },
        { label: 'Hyperpigmentation & Dark Acne Scars', value: 'Dullness & Uneven Tone' },
        { label: 'Dehydration & Weak Skin Barrier', value: 'Dehydration & Dryness' },
        { label: 'Fine Lines, Wrinkles & Loss of Firmness', value: 'Aging & Fine Lines' },
        { label: 'Redness, Inflammation & Rosacea', value: 'Redness & Sensitivity' }
      ]
    },
    {
      id: 3,
      title: 'Primary Skincare Objective',
      subtitle: 'What result is most important to you over the next 60 days?',
      options: [
        { label: 'Clear Active Blemishes & Prevent Pores', value: 'Clear Acne' },
        { label: 'Fade Dark Spots & Achieve Uniform Tone', value: 'Fade Spots' },
        { label: 'Restore Barrier Moisture & Plumpness', value: 'Restore Moisture' },
        { label: 'Calm Inflammation & Redness Sensitivity', value: 'Calm Redness' }
      ]
    },
    {
      id: 4,
      title: 'Current Skincare Routine Complexity',
      subtitle: 'How many products do you currently use daily?',
      options: [
        { label: 'Minimalist (1-2 products: Cleanser + Moisturizer)', value: 'Minimalist' },
        { label: 'Moderate (3-4 products: Serum & Sunscreen included)', value: 'Moderate' },
        { label: 'Advanced (5+ products: Multiple serums & treatments)', value: 'Advanced' }
      ]
    },
    {
      id: 5,
      title: 'Target Investment Budget',
      subtitle: 'Select your preferred clinical regimen price range.',
      options: [
        { label: 'Essential (৳1,000 - ৳2,500 total)', value: 'Essential' },
        { label: 'Advanced Clinical (৳2,500 - ৳4,500 total)', value: 'Advanced' },
        { label: 'Complete Regimen (৳4,500+ total)', value: 'Complete' }
      ]
    }
  ];

  const handleSelectOption = (value) => {
    const stepKey = currentStep === 1 ? 'skinType' : currentStep === 3 ? 'goals' : currentStep === 4 ? 'routineComplexity' : 'budget';
    setAnswers(prev => ({ ...prev, [stepKey]: value }));
  };

  const handleMultiSelectOption = (value) => {
    setAnswers(prev => {
      const current = prev.concerns || [];
      if (current.includes(value)) {
        return { ...prev, concerns: current.filter(c => c !== value) };
      } else {
        if (current.length >= 2) return prev;
        return { ...prev, concerns: [...current, value] };
      }
    });
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    } else {
      setSubmitted(true);
    }
  };

  const recommendedProducts = products.filter(p => {
    if (!answers.skinType) return true;
    return p.skinTypes.includes(answers.skinType) || p.skinTypes.includes("All Skin Types");
  }).slice(0, 3);

  const handleBookConsultation = (e) => {
    e.preventDefault();
    setBookingConfirmed(true);
    setTimeout(() => {
      setBookingModal(false);
      setBookingConfirmed(false);
    }, 2500);
  };

  return (
    <div style={{ padding: '60px 0', minHeight: '85vh', background: 'var(--porcelain)' }}>
      <div className="container" style={{ maxWidth: '800px' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--titrate-teal-light)', padding: '6px 12px', borderRadius: '20px', marginBottom: '12px' }}>
            <DropletGlyph size={14} color="var(--titrate-teal)" />
            <span className="font-mono" style={{ fontSize: '11px', fontWeight: 600, color: 'var(--titrate-teal)', textTransform: 'uppercase' }}>
              DERMATOLOGICAL CONSULTATION
            </span>
          </div>
          <h1 className="font-editorial" style={{ fontSize: '38px', color: 'var(--ink)', marginBottom: '10px' }}>
            5-Step Clinical Skin Diagnostic
          </h1>
          <p style={{ color: 'var(--slate)', fontSize: '15px' }}>
            Answer 5 precise clinical questions to generate your personalized active formulation regimen.
          </p>
        </div>

        {!submitted ? (
          <div style={{ background: '#FFFFFF', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-lg)', padding: '40px', boxShadow: 'var(--shadow)' }}>
            
            {/* Step Progress Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="font-mono" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--titrate-teal)' }}>
                  0{currentStep}
                </span>
                <span style={{ fontSize: '14px', color: 'var(--slate)' }}>/ 05</span>
              </div>
              <div className="font-mono" style={{ fontSize: '12px', color: 'var(--dropper-amber)', background: 'var(--dropper-amber-light)', padding: '4px 10px', borderRadius: '4px' }}>
                STEP {currentStep} OF 5
              </div>
            </div>

            {/* Question Title */}
            <h2 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>
              {steps[currentStep - 1].title}
            </h2>
            <p style={{ color: 'var(--slate)', fontSize: '14px', marginBottom: '28px' }}>
              {steps[currentStep - 1].subtitle}
            </p>

            {/* Options List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
              {steps[currentStep - 1].options.map((opt, idx) => {
                const isSelected = steps[currentStep - 1].isMulti
                  ? (answers.concerns || []).includes(opt.value)
                  : (currentStep === 1 ? answers.skinType : currentStep === 3 ? answers.goals : currentStep === 4 ? answers.routineComplexity : answers.budget) === opt.value;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => steps[currentStep - 1].isMulti ? handleMultiSelectOption(opt.value) : handleSelectOption(opt.value)}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? '2px solid var(--titrate-teal)' : '1px solid var(--border-light)',
                      background: isSelected ? 'var(--titrate-teal-light)' : '#FFFFFF',
                      color: 'var(--ink)',
                      textAlign: 'left',
                      fontWeight: isSelected ? 600 : 400,
                      fontSize: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'var(--transition)'
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <CheckCircle2 size={18} color="var(--titrate-teal)" />}
                  </button>
                );
              })}
            </div>

            {/* Navigation Controls */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                disabled={currentStep === 1}
                style={{ opacity: currentStep === 1 ? 0.3 : 1, color: 'var(--slate)', fontWeight: 600, fontSize: '14px' }}
              >
                ← Previous Step
              </button>

              <button
                type="button"
                onClick={handleNext}
                style={{
                  background: 'var(--titrate-teal)',
                  color: '#FFFFFF',
                  padding: '14px 28px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                  fontSize: '15px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {currentStep === 5 ? 'Generate Clinical Regimen' : 'Next Step →'}
              </button>
            </div>

          </div>
        ) : (
          /* Results View */
          <div className="animate-fade">
            <div style={{ background: '#FFFFFF', border: '1px solid var(--border-dark)', borderRadius: 'var(--radius-lg)', padding: '40px', marginBottom: '40px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#276749', marginBottom: '16px' }}>
                <CheckCircle2 size={24} />
                <span className="font-mono" style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em' }}>DIAGNOSTIC COMPLETE</span>
              </div>
              
              <h2 className="font-editorial" style={{ fontSize: '32px', color: 'var(--ink)', marginBottom: '12px' }}>
                Your Recommended Prescription Regimen
              </h2>
              <p style={{ color: 'var(--slate)', fontSize: '15px', marginBottom: '24px' }}>
                Based on your <strong>{answers.skinType || 'Combination'}</strong> profile targeting <strong>{(answers.concerns || []).join(', ') || 'Blemishes & Dark Spots'}</strong>.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                {recommendedProducts.map(prod => (
                  <div key={prod.id} style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '16px', background: 'var(--porcelain)' }}>
                    <img src={prod.image} alt={prod.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '6px', marginBottom: '12px' }} />
                    <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '6px' }}>{prod.name}</h4>
                    <span className="font-mono" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--titrate-teal)' }}>৳{prod.price}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <Link to="/cart" style={{ background: 'var(--titrate-teal)', color: '#FFFFFF', padding: '14px 28px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '15px' }}>
                  Add Full Regimen to Cart (৳{recommendedProducts.reduce((sum, p) => sum + p.price, 0)})
                </Link>
                
                <button 
                  onClick={() => setBookingModal(true)}
                  style={{ border: '1px solid var(--titrate-teal)', color: 'var(--titrate-teal)', padding: '14px 24px', borderRadius: 'var(--radius-sm)', fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Calendar size={18} /> Book Live Consultation with Specialist
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Live Consultation Modal */}
        {bookingModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(22, 33, 28, 0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: '#FFFFFF', borderRadius: 'var(--radius-lg)', padding: '36px', maxWidth: '480px', width: '100%', position: 'relative' }}>
              {bookingConfirmed ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <CheckCircle2 size={48} color="var(--titrate-teal)" style={{ marginBottom: '16px' }} />
                  <h3 className="font-editorial" style={{ fontSize: '24px', marginBottom: '8px' }}>Consultation Confirmed!</h3>
                  <p style={{ color: 'var(--slate)', fontSize: '14px' }}>Our dermatologist specialist will reach out via WhatsApp/Phone at your chosen time slot.</p>
                </div>
              ) : (
                <form onSubmit={handleBookConsultation}>
                  <h3 className="font-editorial" style={{ fontSize: '24px', marginBottom: '8px' }}>Schedule Live Skincare Consultation</h3>
                  <p style={{ color: 'var(--slate)', fontSize: '13px', marginBottom: '20px' }}>Select your preferred 1-on-1 advice time slot with our certified specialist.</p>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Full Name</label>
                    <input type="text" required placeholder="e.g. Tamim Ahmed" value={bookingDetails.name} onChange={e => setBookingDetails({...bookingDetails, name: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-dark)', borderRadius: '6px' }} />
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Phone / WhatsApp Number</label>
                    <input type="tel" required placeholder="e.g. 01712345678" value={bookingDetails.phone} onChange={e => setBookingDetails({...bookingDetails, phone: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-dark)', borderRadius: '6px' }} />
                  </div>

                  <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Preferred Time Slot</label>
                    <select required value={bookingDetails.timeSlot} onChange={e => setBookingDetails({...bookingDetails, timeSlot: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid var(--border-dark)', borderRadius: '6px' }}>
                      <option value="">Choose a time slot...</option>
                      <option value="Tomorrow 11:00 AM">Tomorrow 11:00 AM - 12:00 PM</option>
                      <option value="Tomorrow 4:00 PM">Tomorrow 4:00 PM - 5:00 PM</option>
                      <option value="Tomorrow 8:00 PM">Tomorrow 8:00 PM - 9:00 PM</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button type="button" onClick={() => setBookingModal(false)} style={{ flex: 1, padding: '12px', border: '1px solid var(--border-dark)', borderRadius: '6px' }}>Cancel</button>
                    <button type="submit" style={{ flex: 1, padding: '12px', background: 'var(--titrate-teal)', color: '#FFFFFF', borderRadius: '6px', fontWeight: 600 }}>Confirm Appointment</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SkinQuiz;
