import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../supabase/config';
import { useOrders } from '../context/OrderContext';
import { useSettings } from '../context/SettingsContext';

const Invoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const { orders } = useOrders();
  const { settings } = useSettings();
  const currencySymbol = settings?.currency?.split(' ')[0] || '৳';

  useEffect(() => {
    const fetchOrder = async () => {
      // 1. Try local OrderContext orders first
      const existing = orders.find(o => o.id === id || o.firestoreId === id);
      if (existing) {
        setOrder(existing);
        setLoading(false);
        return;
      }

      // 2. Fetch from Supabase / PostgreSQL if available
      if (isSupabaseConfigured) {
        try {
          const { data } = await supabase.from('orders').select('*').eq('id', id).single();
          if (data) {
            const customer = typeof data.customer === 'object' ? data.customer : { name: data.customer || 'Guest', phone: '', email: '' };
            const products = data.items || [];
            setOrder({
              id: data.id,
              customer,
              deliveryAddress: data.customer?.address || '',
              status: data.status,
              createdAt: data.created_at,
              products,
              subtotal: Number(data.subtotal),
              deliveryCharge: Number(data.shipping),
              discount: Number(data.discount),
              total: Number(data.total)
            });
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error('Error fetching order from PostgreSQL', err);
        }
      }

      alert('Order not found');
      navigate('/admin');
      setLoading(false);
    };

    fetchOrder();
  }, [id, navigate, orders]);

  if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading invoice...</div>;
  if (!order) return null;

  return (
    <div className="invoice-page">
      <div className="invoice-container">
        <div className="invoice-header">
          <div className="brand">
            <h1>BEAUTY GLOWRY</h1>
            <p>Your Trusted Skincare Partner</p>
          </div>
          <div className="invoice-meta">
            <h2>INVOICE</h2>
            <p><strong>Order ID:</strong> #{order.id}</p>
            <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
            <p><strong>Status:</strong> {order.status}</p>
          </div>
        </div>

        <div className="invoice-addresses">
          <div className="address-box">
            <h3>Billed To:</h3>
            <p><strong>{order.customer?.name || 'Guest'}</strong></p>
            <p>{order.customer?.phone || ''}</p>
            <p>{order.deliveryAddress || ''}</p>
          </div>
          <div className="address-box">
            <h3>Payment Details:</h3>
            <p><strong>Method:</strong> {order.paymentMethod || 'Cash on Delivery'}</p>
            <p><strong>Payment Status:</strong> {order.paymentStatus || 'Pending'}</p>
          </div>
        </div>

        <table className="invoice-items-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {(order.products || []).map((item, idx) => (
              <tr key={idx}>
                <td>{item.name}</td>
                <td>{currencySymbol}{item.price}</td>
                <td>{item.quantity || 1}</td>
                <td>{currencySymbol}{(item.price * (item.quantity || 1)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-summary">
          <div className="summary-line">
            <span>Subtotal:</span>
            <span>{currencySymbol}{order.subtotal?.toFixed(2) || '0.00'}</span>
          </div>
          <div className="summary-line">
            <span>Delivery Fee:</span>
            <span>{currencySymbol}{order.deliveryCharge?.toFixed(2) || '0.00'}</span>
          </div>
          {order.discount > 0 && (
            <div className="summary-line discount">
              <span>Discount:</span>
              <span>-{currencySymbol}{order.discount?.toFixed(2)}</span>
            </div>
          )}
          <div className="summary-line total">
            <span>Total:</span>
            <span>{currencySymbol}{order.total?.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        <div className="invoice-footer">
          <p>Thank you for shopping with Beauty Glowry!</p>
          <button className="no-print print-btn" onClick={() => window.print()}>Print Invoice</button>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        .invoice-page { padding: 40px 20px; background: #f7fafc; min-height: 100vh; font-family: system-ui, sans-serif; }
        .invoice-container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .invoice-header { display: flex; justify-content: space-between; margin-bottom: 40px; border-bottom: 2px solid #edf2f7; padding-bottom: 20px; }
        .brand h1 { margin: 0; font-size: 24px; color: #2d3748; }
        .brand p { margin: 4px 0 0; color: #718096; font-size: 14px; }
        .invoice-meta { text-align: right; }
        .invoice-meta h2 { margin: 0 0 8px; color: #4a5568; font-size: 20px; }
        .invoice-meta p { margin: 2px 0; font-size: 14px; color: #4a5568; }
        .invoice-addresses { display: flex; gap: 40px; margin-bottom: 40px; }
        .address-box { flex: 1; }
        .address-box h3 { font-size: 14px; color: #a0aec0; text-transform: uppercase; margin-bottom: 8px; }
        .address-box p { margin: 4px 0; color: #2d3748; font-size: 14px; }
        .invoice-items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        .invoice-items-table th { text-align: left; padding: 12px; background: #f7fafc; border-bottom: 2px solid #edf2f7; color: #4a5568; font-size: 14px; }
        .invoice-items-table td { padding: 12px; border-bottom: 1px solid #edf2f7; font-size: 14px; color: #2d3748; }
        .invoice-summary { width: 300px; margin-left: auto; margin-bottom: 40px; }
        .summary-line { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; color: #4a5568; }
        .summary-line.total { border-top: 2px solid #edf2f7; font-weight: bold; font-size: 18px; color: #2d3748; margin-top: 6px; padding-top: 12px; }
        .invoice-footer { text-align: center; border-top: 1px solid #edf2f7; padding-top: 20px; color: #a0aec0; font-size: 14px; }
        .print-btn { margin-top: 12px; padding: 10px 20px; background: #3182ce; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
        @media print { .no-print { display: none; } .invoice-page { padding: 0; background: white; } .invoice-container { box-shadow: none; } }
      `}} />
    </div>
  );
};

export default Invoice;
