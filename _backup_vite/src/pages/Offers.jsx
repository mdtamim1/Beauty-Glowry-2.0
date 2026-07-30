import React from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductContext';
import { useSettings } from '../context/SettingsContext';
import { Tag, Zap, Clock, Calendar } from 'lucide-react';

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = React.useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  React.useEffect(() => {
    if (!targetDate) return;
    
    const calculate = () => {
      const difference = new Date(targetDate) - new Date();
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          mins: Math.floor((difference / 1000 / 60) % 60),
          secs: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
      }
    };

    calculate();
    const timer = setInterval(calculate, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div className="countdown">
      <div className="time"><span>{String(timeLeft.days).padStart(2, '0')}</span><label>Days</label></div>
      <div className="time"><span>{String(timeLeft.hours).padStart(2, '0')}</span><label>Hours</label></div>
      <div className="time"><span>{String(timeLeft.mins).padStart(2, '0')}</span><label>Mins</label></div>
      <div className="time"><span>{String(timeLeft.secs).padStart(2, '0')}</span><label>Secs</label></div>
    </div>
  );
};

const Offers = () => {
  const { products } = useProducts();
  const { settings } = useSettings();
  
  const discountedProducts = products.filter(p => p.publishedSections?.includes('Offers'));

  const isSaleActive = settings.showFlashSale && new Date(settings.flashSaleEndsAt) > new Date();

  return (
    <div className="offers-page">
      <div className="offers-hero animate-fade">
        <div className="container">
          <div className="badge-offer"><Zap size={16} /> {settings.flashSaleTitle || 'Seasonal Sale'}</div>
          <h1>{isSaleActive ? 'Exclusive Flash Sale' : 'Exclusive Beauty Offers'}</h1>
          <p>{isSaleActive ? 'Grab your favorites before time runs out!' : 'Unbeatable prices on premium skincare. Limited stock available!'}</p>
          
          {isSaleActive && <CountdownTimer targetDate={settings.flashSaleEndsAt} />}
          
          {!isSaleActive && !settings.showFlashSale && (
            <div className="no-sale-badge">
                <Calendar size={16} /> New Offers Coming Soon
            </div>
          )}
        </div>
      </div>

      <section className="section-padding">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Special Discounts</h2>
            <p className="section-subtitle">Up to 30% off on premium collections</p>
          </div>
          
          <div className="product-grid animate-fade">
             {discountedProducts.map(product => (
               <ProductCard key={product.firestoreId || product.id} product={product} />
             ))}
          </div>
        </div>
      </section>

      <section className="container section-padding">
         <div className="bundle-grid">
            <div className="bundle-card animate-fade">
               <div className="bundle-content">
                  <h3>Hydration Hero Bundle</h3>
                  <p>Get Serum + Moisturizer and save 15% more!</p>
                  <button className="btn btn-primary">Claim Bundle</button>
               </div>
               <div className="bundle-img">🎁</div>
            </div>
            <div className="bundle-card animate-fade" style={{ background: 'var(--lavender)' }}>
                <div className="bundle-content">
                  <h3>Night Repair Set</h3>
                  <p>Restore your glow while you sleep.</p>
                  <button className="btn btn-primary">Shop Now</button>
               </div>
               <div className="bundle-img">✨</div>
            </div>
         </div>
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        .offers-hero { background: var(--primary-dark); color: white; padding: 100px 0; text-align: center; }
        .badge-offer { background: rgba(255,255,255,0.2); width: fit-content; margin: 0 auto 24px; padding: 8px 16px; border-radius: 50px; font-weight: 700; font-size: 14px; display: flex; align-items: center; gap: 8px; }
        .offers-hero h1 { font-size: 48px; margin-bottom: 16px; }
        .offers-hero p { font-size: 18px; opacity: 0.9; margin-bottom: 40px; }

        .countdown { display: flex; justify-content: center; gap: 24px; }
        .time { display: flex; flex-direction: column; align-items: center; background: rgba(255,255,255,0.1); padding: 16px; border-radius: 12px; min-width: 80px; }
        .time span { font-size: 32px; font-weight: 800; }
        .time label { font-size: 12px; font-weight: 700; text-transform: uppercase; }

        .no-sale-badge { background: rgba(255,255,255,0.1); width: fit-content; margin: 0 auto; padding: 12px 24px; border-radius: 12px; font-weight: 600; display: flex; align-items: center; gap: 10px; }

        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 32px; }

        .bundle-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .bundle-card { background: var(--mint); padding: 40px; border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: space-between; }
        .bundle-content h3 { font-size: 24px; margin-bottom: 12px; }
        .bundle-content p { color: var(--text-muted); margin-bottom: 24px; }
        .bundle-img { font-size: 80px; }

        @media (max-width: 768px) {
           .offers-hero h1 { font-size: 32px; }
           .bundle-grid { grid-template-columns: 1fr; }
        }
      ` }} />
    </div>
  );
};

export default Offers;
