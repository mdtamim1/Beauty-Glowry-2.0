import React, { useEffect } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ShoppingBag, ArrowRight, Package, Clock, Phone } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const OrderSuccess = () => {
  const location = useLocation();
  const order = location.state?.order;
  const { settings } = useSettings();
  const currencySymbol = settings?.currency?.split(' ')[0] || '৳';

  // Scroll to top on mount and track purchase
  useEffect(() => {
    window.scrollTo(0, 0);
    if (order && window.trackPurchase) {
      // Prevent double tracking by storing tracked order IDs in sessionStorage
      const trackedOrders = JSON.parse(sessionStorage.getItem('tracked_orders') || '[]');
      if (!trackedOrders.includes(order.id)) {
        window.trackPurchase(order.total, 'BDT');
        trackedOrders.push(order.id);
        sessionStorage.setItem('tracked_orders', JSON.stringify(trackedOrders));
      }
    }
  }, [order]);

  // If someone tries to access this page directly without an order in state
  if (!order) {
    return <Navigate to="/" replace />;
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const checkmarkVariants = {
    hidden: { scale: 0, rotate: -45 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: { 
        type: "spring", 
        stiffness: 260, 
        damping: 20,
        delay: 0.3
      }
    }
  };

  return (
    <div className="order-success-page">
      <div className="container">
        <motion.div 
          className="success-card"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="success-icon-wrapper">
            <motion.div 
              className="success-icon-bg"
              variants={checkmarkVariants}
            >
              <Check size={48} strokeWidth={3} color="white" />
            </motion.div>
            <div className="confetti-placeholder"></div>
          </div>

          <motion.h1 variants={itemVariants} className="success-title">
            Order Confirmed!
          </motion.h1>
          
          <motion.p variants={itemVariants} className="success-subtitle">
            Thank you for shopping with Beauty Glowry.
          </motion.p>

          <motion.div variants={itemVariants} className="contact-notice">
            <Phone size={18} />
            <span>Our staff member will contact with you soon.</span>
          </motion.div>

          <motion.div variants={itemVariants} className="order-info-box">
            <div className="info-row">
              <span className="label">Order ID:</span>
              <span className="value">#{order.id}</span>
            </div>
            <div className="info-row">
              <span className="label">Total Amount:</span>
              <span className="value">{currencySymbol}{order.total}</span>
            </div>
            <div className="info-row">
              <span className="label">Estimated Delivery:</span>
              <span className="value">3-5 Working Days</span>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="next-steps">
            <h3>What's Next?</h3>
            <div className="steps-grid">
              <div className="step-item">
                <div className="step-icon"><Clock size={20} /></div>
                <p>Order processing (1-2 hours)</p>
              </div>
              <div className="step-item">
                <div className="step-icon"><Phone size={20} /></div>
                <p>Confirmation call from our team</p>
              </div>
              <div className="step-item">
                <div className="step-icon"><Package size={20} /></div>
                <p>Package dispatched & delivered</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="success-actions">
            <Link to="/account" className="btn-secondary">
              View Order History
            </Link>
            <Link to="/" className="btn-primary">
              Continue Shopping <ArrowRight size={18} />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .order-success-page {
          padding: 80px 0 120px;
          background: #fdfdfd;
          min-height: 80vh;
          display: flex;
          align-items: center;
        }

        .success-card {
          max-width: 600px;
          margin: 0 auto;
          background: white;
          padding: 60px 40px;
          border-radius: 32px;
          text-align: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.02);
          border: 1px solid #f1f5f9;
        }

        .success-icon-wrapper {
          margin-bottom: 32px;
          display: flex;
          justify-content: center;
          position: relative;
        }

        .success-icon-bg {
          width: 100px;
          height: 100px;
          background: #22c55e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 20px rgba(34, 197, 94, 0.2);
        }

        .success-title {
          font-size: 36px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
        }

        .success-subtitle {
          font-size: 18px;
          color: #64748b;
          margin-bottom: 24px;
        }

        .contact-notice {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #f0fdf4;
          color: #166534;
          padding: 12px 24px;
          border-radius: 100px;
          font-weight: 600;
          margin-bottom: 40px;
          border: 1px solid #dcfce7;
        }

        .order-info-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          padding: 24px;
          margin-bottom: 40px;
        }

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
        }

        .info-row .label {
          color: #64748b;
          font-weight: 500;
        }

        .info-row .value {
          color: #0f172a;
          font-weight: 700;
        }

        .next-steps {
          text-align: left;
          margin-bottom: 48px;
        }

        .next-steps h3 {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 20px;
          color: #0f172a;
        }

        .steps-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
        }

        .step-item {
          text-align: center;
        }

        .step-icon {
          width: 44px;
          height: 44px;
          background: #f1f5f9;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          color: #64748b;
        }

        .step-item p {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
          line-height: 1.4;
        }

        .success-actions {
          display: flex;
          gap: 16px;
        }

        .success-actions .btn-primary,
        .success-actions .btn-secondary {
          flex: 1;
          height: 56px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 14px;
          font-weight: 700;
          transition: all 0.2s;
          text-decoration: none;
        }

        .btn-primary {
          background: #ff4d8d;
          color: white;
        }

        .btn-primary:hover {
          background: #e63d7a;
          transform: translateY(-2px);
        }

        .btn-secondary {
          background: white;
          color: #0f172a;
          border: 1px solid #e2e8f0;
        }

        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        @media (max-width: 640px) {
          .success-card {
            padding: 40px 24px;
            border-radius: 24px;
          }
          .success-title { font-size: 28px; }
          .steps-grid { grid-template-columns: 1fr; gap: 24px; }
          .success-actions { flex-direction: column; }
          .contact-notice { font-size: 14px; padding: 10px 20px; text-align: left; }
        }
      ` }} />
    </div>
  );
};

export default OrderSuccess;
