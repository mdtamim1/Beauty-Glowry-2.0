import React from 'react';
import { Download, Printer, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const InvoicePreview = ({ order, products, onClose, storeName = 'BEAUTY GLOWRY' }) => {
  const { settings } = useSettings();
  const currencySymbol = settings?.currency?.split(' ')[0] || '৳';
  
  if (!order) return null;

  const generateInvoiceNumber = () => {
    const date = new Date();
    return `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${order.id.split('-')[1] || 'NEW'}`;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(document.querySelector('.invoice-container').innerHTML);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleDownloadPDF = () => {
    alert('PDF download feature coming soon!');
  };

  const deliveryZones = {
    dhaka: 'Inside Dhaka',
    outside: 'Outside Dhaka'
  };

  const getProductDetails = (product) => {
    const foundProduct = products.find(p => p.id === product.productId);
    return foundProduct || product;
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000 }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .invoice-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          padding: 20px;
        }

        .invoice-modal {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }

        .invoice-header-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          border-bottom: 2px solid #1a365d;
          background: linear-gradient(135deg, #1a365d 0%, #2c5aa0 100%);
          color: white;
          flex-shrink: 0;
        }

        .invoice-header-bar h2 {
          margin: 0;
          font-size: 16px;
          font-weight: 800;
        }

        .invoice-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .invoice-action-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.2);
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          font-size: 16px;
        }

        .invoice-action-btn:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.05);
        }

        .invoice-container {
          padding: 40px;
          background: white;
          flex: 1;
          overflow-y: auto;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #1a365d;
        }

        .invoice-branding {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .invoice-brand-name {
          font-size: 28px;
          font-weight: 900;
          color: #1a365d;
          letter-spacing: -0.5px;
        }

        .invoice-brand-name .highlight {
          color: #f472b6;
        }

        .invoice-brand-tagline {
          font-size: 12px;
          color: #718096;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .invoice-info {
          text-align: right;
        }

        .invoice-info-item {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-bottom: 6px;
          font-size: 12px;
          color: #4a5568;
        }

        .invoice-info-label {
          font-weight: 700;
          color: #2d3748;
        }

        .invoice-body {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 40px;
        }

        .invoice-section {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .invoice-section-title {
          font-size: 12px;
          font-weight: 800;
          text-transform: uppercase;
          color: #2d3748;
          letter-spacing: 0.5px;
        }

        .invoice-section-content {
          font-size: 13px;
          line-height: 1.8;
          color: #4a5568;
        }

        .invoice-products {
          grid-column: 1 / -1;
        }

        .invoice-products table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 12px;
        }

        .invoice-products th {
          background: #f7fafc;
          border: 1px solid #e2e8f0;
          padding: 10px 12px;
          text-align: left;
          font-size: 11px;
          font-weight: 800;
          color: #2d3748;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .invoice-products td {
          border: 1px solid #e2e8f0;
          padding: 12px;
          font-size: 13px;
          color: #4a5568;
        }

        .invoice-products tr:hover td {
          background: #f7fafc;
        }

        .invoice-products .text-right {
          text-align: right;
        }

        .invoice-products .font-bold {
          font-weight: 700;
        }

        .invoice-totals {
          grid-column: 1 / -1;
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 30px;
          border-top: 2px solid #e2e8f0;
          padding-top: 20px;
        }

        .invoice-totals-table {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: #f7fafc;
          padding: 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }

        .invoice-total-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #4a5568;
        }

        .invoice-total-row.final {
          border-top: 2px solid #1a365d;
          padding-top: 12px;
          font-size: 16px;
          font-weight: 800;
          color: #1a365d;
        }

        .invoice-notes {
          background: #fffbeb;
          border: 1px solid #fcd34d;
          border-radius: 8px;
          padding: 12px;
          font-size: 12px;
        }

        .invoice-notes-title {
          font-weight: 700;
          color: #92400e;
          margin-bottom: 6px;
          text-transform: uppercase;
          font-size: 11px;
        }

        .invoice-notes-content {
          color: #78350f;
          line-height: 1.5;
          white-space: pre-wrap;
        }

        .invoice-footer {
          text-align: center;
          padding-top: 30px;
          border-top: 1px solid #e2e8f0;
          font-size: 11px;
          color: #718096;
        }

        @media print {
          .invoice-header-bar,
          .invoice-overlay {
            display: none !important;
          }

          .invoice-modal {
            box-shadow: none;
            border-radius: 0;
            max-height: none;
            background: white;
          }

          .invoice-container {
            padding: 0;
            background: white;
          }

          body {
            background: white;
          }
        }

        @media (max-width: 768px) {
          .invoice-container {
            padding: 20px;
          }

          .invoice-body {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .invoice-totals {
            grid-template-columns: 1fr;
          }

          .invoice-products table {
            font-size: 12px;
          }

          .invoice-products th,
          .invoice-products td {
            padding: 8px;
          }
        }
      ` }} />

      <div className="invoice-modal">
        <div className="invoice-header-bar">
          <h2>📄 Invoice Preview</h2>
          <div className="invoice-actions">
            <button className="invoice-action-btn" onClick={handlePrint} title="Print Invoice">
              <Printer size={18} />
            </button>
            <button className="invoice-action-btn" onClick={handleDownloadPDF} title="Download PDF">
              <Download size={18} />
            </button>
            <button className="invoice-action-btn" onClick={onClose} title="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="invoice-container">
          <div className="invoice-header">
            <div className="invoice-branding">
              <div className="invoice-brand-name">BEAUTY <span className="highlight">GLOWRY</span></div>
              <div className="invoice-brand-tagline">Premium Beauty & Skincare</div>
            </div>
            <div className="invoice-info">
              <div className="invoice-info-item">
                <span className="invoice-info-label">Invoice #</span>
                <span>{generateInvoiceNumber()}</span>
              </div>
              <div className="invoice-info-item">
                <span className="invoice-info-label">Order #</span>
                <span>{order.id}</span>
              </div>
              <div className="invoice-info-item">
                <span className="invoice-info-label">Date</span>
                <span>{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
              </div>
              <div className="invoice-info-item">
                <span className="invoice-info-label">Status</span>
                <span style={{ color: order.paymentStatus === 'Paid' ? '#48bb78' : '#f6ad55', fontWeight: 700 }}>{order.paymentStatus}</span>
              </div>
            </div>
          </div>

          <div className="invoice-body">
            <div className="invoice-section">
              <div className="invoice-section-title">📦 Bill To</div>
              <div className="invoice-section-content">
                <strong>{order.customer.name}</strong><br />
                {order.customer.email}<br />
                {order.customer.phone}
              </div>
            </div>

            <div className="invoice-section">
              <div className="invoice-section-title">🚚 Delivery To</div>
              <div className="invoice-section-content">
                <strong>{deliveryZones[order.deliveryZone]}</strong><br />
                {order.deliveryAddress}
              </div>
            </div>

            <div className="invoice-section">
              <div className="invoice-section-title">💳 Payment Information</div>
              <div className="invoice-section-content">
                <strong>Method:</strong> {order.paymentMethod}<br />
                <strong>Status:</strong> {order.paymentStatus}
              </div>
            </div>

            <div className="invoice-section">
              <div className="invoice-section-title">📋 Delivery Status</div>
              <div className="invoice-section-content">
                <strong>{order.deliveryStatus}</strong>
              </div>
            </div>

            <div className="invoice-products">
              <div className="invoice-section-title">📦 Ordered Products</div>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {(order.products || []).map((product, idx) => (
                    <tr key={idx}>
                      <td>{product.name}</td>
                      <td>{product.quantity}</td>
                      <td>{currencySymbol} {Number(product.price).toFixed(0)}</td>
                      <td>{currencySymbol} {(Number(product.price) * (product.quantity || 1)).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="invoice-totals">
              <div></div>
              <div className="invoice-totals-table">
                <div className="invoice-total-row">
                  <span>Sub Total</span>
                  <span>{currencySymbol} {order.subtotal}</span>
                </div>
                <div className="total-item">
                  <span>Delivery Charge</span>
                  <span>{currencySymbol} {order.deliveryCharge}</span>
                </div>
                <div className="total-item">
                  <span>Discount</span>
                  <span>-{currencySymbol} {order.discount || 0}</span>
                </div>
                <div className="net-total-row">
                  <span>TOTAL (NET)</span>
                  <span>{currencySymbol} {order.total}</span>
                </div>
              </div>
            </div>
          </div>

          {(order.notes?.customer || order.notes?.internal) && (
            <div className="invoice-notes">
              {order.notes?.customer && (
                <div>
                  <div className="invoice-notes-title">👤 Customer Note</div>
                  <div className="invoice-notes-content">{order.notes.customer}</div>
                </div>
              )}
              {order.notes?.internal && (
                <div style={{ marginTop: '12px' }}>
                  <div className="invoice-notes-title">🔒 Admin Note</div>
                  <div className="invoice-notes-content">{order.notes.internal}</div>
                </div>
              )}
            </div>
          )}

          {order.history && order.history.length > 0 && (
            <div style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <div className="invoice-section-title">📜 Recent Order History</div>
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {order.orderHistory && order.orderHistory.slice(-5).reverse().map((event, idx) => (
                  <div key={idx} style={{ fontSize: '12px', color: '#4a5568', padding: '8px', background: '#f7fafc', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    <strong>{event.status}</strong> • {new Date(event.date).toLocaleDateString()} • {event.note}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="invoice-footer">
            <p>Thank you for your order! For support, contact us at {settings?.storeEmail || 'contact@beautyglowry.com'} | Phone: {settings?.storePhone || '01785659807'}</p>
            <p>© 2026 BEAUTY GLOWRY. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
