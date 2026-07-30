import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Plus, Trash2, X, Save, Loader2, Check, Search, Calendar, MapPin, Truck, Store, Hash, FileText, ShoppingBag } from 'lucide-react';
import { useOrders } from '../context/OrderContext';
import { useProducts } from '../context/ProductContext';
import { useSettings } from '../context/SettingsContext';
import locationsData from '../../locations';

const OrderEditorModal = ({ isOpen, onClose, editingOrder = null }) => {
  if (!isOpen) return null;

  // State Management
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { settings } = useSettings();
  const currencySymbol = settings?.currency?.split(' ')[0] || '৳';
  const deliveryRates = {
    dhaka: Number(settings?.deliveryDhaka ?? 60),
    outside: Number(settings?.deliveryOutside ?? 130)
  };
  const [errors, setErrors] = useState({});
  const [recentShopNotes, setRecentShopNotes] = useState([]);
  const [showNoteSuggestions, setShowNoteSuggestions] = useState(false);

  // Form data
  const [formData, setFormData] = useState(() => {
    if (editingOrder) {
      return {
        storeName: editingOrder.storeName || "BEAUTY GLOWRY",
        invoiceNumber: editingOrder.id || `TR${Math.floor(1000000 + Math.random() * 9000000)}`,
        customer: editingOrder.customer || { name: '', phone: '' },
        deliveryAddress: editingOrder.deliveryAddress || '',
        courierName: editingOrder.courierName || 'Pathao',
        orderDate: editingOrder.orderDate || new Date().toISOString().split('T')[0],
        district: editingOrder.district || 'Dhaka',
        thana: editingOrder.thana || '',
        area: editingOrder.area || '',
        customerNote: editingOrder.notes?.customer || '',
        shopNote: editingOrder.notes?.internal || '',
        products: editingOrder.products || [],
        paymentMethod: editingOrder.paymentMethod || 'Select a payment type',
        memoNumber: editingOrder.memoNumber || '',
        discount: editingOrder.discount || 0,
        deliveryCharge: editingOrder.deliveryCharge || (editingOrder.district === 'Dhaka' ? deliveryRates.dhaka : deliveryRates.outside),
        paidAmount: editingOrder.paidAmount || 0,
        deliveryStatus: editingOrder.status || 'Processing'
      };
    }
    return {
      storeName: "BEAUTY GLOWRY",
      invoiceNumber: `TR${Math.floor(1000000 + Math.random() * 9000000)}`,
      customer: { name: '', phone: '' },
      deliveryAddress: '',
      courierName: 'Pathao',
      orderDate: new Date().toISOString().split('T')[0],
      district: 'Dhaka',
      thana: '',
      area: '',
      customerNote: '',
      shopNote: '',
      products: [],
      paymentMethod: 'Select a payment type',
      memoNumber: '',
      discount: 0,
      deliveryCharge: deliveryRates.dhaka,
      paidAmount: 0,
      deliveryStatus: 'Processing'
    };
  });

  const { addOrder, editOrder } = useOrders();
  const { products } = useProducts();
  const dropdownRef = useRef(null);

  // Filtered products for search
  const filteredProductsBySearch = useMemo(() => {
    if (!productSearch) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.category.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [productSearch, products]);

  // Calculate totals
  const calculations = useMemo(() => {
    const subtotal = formData.products.reduce((sum, item) => {
      return sum + (Number(item.price) * Number(item.quantity || 1));
    }, 0);

    const total = subtotal - Number(formData.discount || 0) + Number(formData.deliveryCharge || 0);
    const finalTotal = Math.max(0, total);

    return {
      subtotal,
      deliveryCharge: Number(formData.deliveryCharge || 0),
      discount: Number(formData.discount || 0),
      total: finalTotal
    };
  }, [formData]);

  const addProduct = (product) => {
    const existingProduct = formData.products.find(p => p.productId === product.id);

    if (existingProduct) {
      setFormData(prev => ({
        ...prev,
        products: prev.products.map(p =>
          p.productId === product.id
            ? { ...p, quantity: (p.quantity || 1) + 1 }
            : p
        )
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, {
          productId: product.id,
          name: product.name,
          price: product.discountPrice || product.price,
          quantity: 1,
          color: '-',
          size: '-',
          code: `BG-${product.id.toString().slice(-4)}`
        }]
      }));
    }

    setProductSearch('');
    setShowProductDropdown(false);
  };

  const removeProduct = (productId) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.filter(p => p.productId !== productId)
    }));
  };

  const updateProductQuantity = (productId, quantity) => {
    setFormData(prev => ({
      ...prev,
      products: prev.products.map(p =>
        p.productId === productId ? { ...p, quantity: Math.max(1, quantity) } : p
      )
    }));
  };

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.customer?.name) newErrors.customerName = 'Required';
    if (!formData.customer?.phone) newErrors.customerPhone = 'Required';
    if (formData.products.length === 0) newErrors.products = 'Add products';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    
    // Save current shop note to recent notes
    if (formData.shopNote.trim()) {
      const updatedNotes = [formData.shopNote.trim(), ...recentShopNotes.filter(n => n !== formData.shopNote.trim())].slice(0, 5);
      setRecentShopNotes(updatedNotes);
      localStorage.setItem('recent_shop_notes', JSON.stringify(updatedNotes));
    }

    setTimeout(() => {
      try {
        const orderData = {
          ...formData,
          id: formData.invoiceNumber,
          customer: formData.customer,
          deliveryAddress: formData.deliveryAddress,
          deliveryZone: formData.district === 'Dhaka' ? 'dhaka' : 'outside',
          subtotal: Number(calculations.subtotal),
          deliveryCharge: Number(calculations.deliveryCharge),
          discount: Number(calculations.discount),
          total: Number(calculations.total),
          notes: {
            customer: formData.customerNote,
            internal: formData.shopNote
          },
          status: formData.deliveryStatus
        };

        if (editingOrder) {
          editOrder(editingOrder.firestoreId || editingOrder.id, orderData);
        } else {
          addOrder(orderData);
        }
        setSubmitSuccess(true);
        setTimeout(() => {
          onClose();
        }, 1500);
      } catch (error) {
        setErrors({ submit: 'Failed to save' });
        setIsSubmitting(false);
      }
    }, 800);
  };

  useEffect(() => {
    const saved = localStorage.getItem('recent_shop_notes');
    if (saved) {
      setRecentShopNotes(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="order-modal-wrapper">
      <style dangerouslySetInnerHTML={{ __html: `
        .order-modal-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .order-modal-container {
          width: 98vw;
          max-width: 1400px;
          background: #ffffff;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-header {
          padding: 8px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #f1f5f9;
          background: #fff;
        }

        .modal-header h2 {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
        }

        .close-btn {
          background: transparent;
          border: 1px solid #e2e8f0;
          color: #64748b;
          border-radius: 4px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
        }

        .modal-body {
          padding: 16px;
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 40px;
          background: #ffffff;
          overflow-y: auto;
          max-height: 85vh;
        }

        .form-section {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .form-group label {
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .form-group input, 
        .form-group select, 
        .form-group textarea {
          padding: 8px 12px;
          background: white;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          font-size: 13px;
          color: #334155;
          transition: all 0.2s;
        }

        .form-group input:focus, 
        .form-group select:focus, 
        .form-group textarea:focus {
          border-color: #3182ce;
          box-shadow: 0 0 0 3px rgba(49, 130, 206, 0.1);
          outline: none;
        }

        .form-group input.prefilled {
          background: #e3f2fd;
          font-weight: 800;
          color: #1a365d;
          border-color: #bbdefb;
        }

        /* Product Search */
        .search-container {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
          position: relative;
        }

        .search-wrapper {
          flex: 1;
          position: relative;
        }

        .search-wrapper input {
          width: 100%;
          padding: 10px 15px;
          border: 1px solid #cbd5e0;
          border-radius: 6px;
          font-size: 14px;
        }

        .add-btn {
          background: #ebf8ff;
          color: #3182ce;
          border: 1px solid #bee3f8;
          border-radius: 6px;
          padding: 0 20px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
        }

        /* Product Table */
        .product-table-container {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          min-height: 200px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .product-table {
          width: 100%;
          border-collapse: collapse;
        }

        .product-table th {
          background: #f8fafc;
          padding: 8px 10px;
          font-size: 10px;
          font-weight: 800;
          color: #64748b;
          text-align: left;
          border-bottom: 2px solid #e2e8f0;
          text-transform: uppercase;
        }

        .product-table td {
          padding: 8px 10px;
          font-size: 12px;
          color: #334155;
          border-bottom: 1px solid #f1f5f9;
        }

        .qty-input {
          width: 50px;
          padding: 6px;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
          text-align: center;
          font-weight: 600;
        }

        .qty-input:focus {
           border-color: #3182ce;
           outline: none;
        }

        /* Summary Section */
        .summary-sections {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 40px;
          background: #f8fafc;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .payment-fields {
           display: flex;
           flex-direction: column;
           gap: 15px;
        }

        .calculation-box {
          display: flex;
          flex-direction: column;
          gap: 12px;
          background: white;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .calc-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }

        .calc-row span {
          color: #64748b;
          font-weight: 600;
        }

        .calc-row input {
          width: 140px;
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          text-align: right;
          font-weight: 700;
          background: #fdfdfd;
          color: #1e293b;
        }

        .calc-row.grand-total {
          border-top: 2px solid #3182ce;
          padding-top: 15px;
          margin-top: 10px;
          font-weight: 900;
          font-size: 20px;
          color: #0f172a;
        }

        .calc-row.grand-total input {
          background: white;
          border: none;
          font-size: 22px;
          color: #3182ce;
          padding: 0;
        }

        .save-btn {
          width: 100%;
          background: #007bff;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 4px;
          font-size: 15px;
          font-weight: 800;
          margin-top: 15px;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .save-btn:hover {
          background: #0056b3;
          box-shadow: 0 2px 8px rgba(0, 123, 255, 0.4);
        }

        .save-btn:active {
           transform: translateY(0);
        }

        .product-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #cbd5e0;
          border-radius: 0 0 6px 6px;
          max-height: 200px;
          overflow-y: auto;
          z-index: 100;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .dropdown-item {
          padding: 10px 15px;
          cursor: pointer;
          font-size: 13px;
          border-bottom: 1px solid #f7fafc;
        }

        .dropdown-item:hover {
          background: #ebf8ff;
        }

        .success-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255,255,255,0.9);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .success-indicator {
          width: 60px;
          height: 60px;
          background: #48bb78;
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 15px;
        }

        @media (max-height: 800px) {
          .order-modal-container { height: 95vh; }
          .modal-body { overflow-y: auto; }
        }
      `}} />

      <div className="order-modal-container">
        <div className="modal-header">
          <h2><ShoppingBag size={14} /> Create Order</h2>
          <button className="close-btn" onClick={onClose}><X size={14} /></button>
        </div>

        <div className="modal-body" style={{ position: 'relative' }}>
          {submitSuccess && (
            <div className="success-overlay">
              <div className="success-indicator"><Check size={32} /></div>
              <h3>Order {editingOrder ? 'Updated' : 'Created'} Successfully!</h3>
            </div>
          )}

          {/* Left Column - Customer Details */}
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label>Store Name</label>
                <select 
                  value={formData.storeName}
                  onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                >
                  <option>TANZU'S WORLD</option>
                  <option>BEAUTY GLOWRY</option>
                </select>
              </div>
              <div className="form-group">
                <label>Invoice Number</label>
                <input type="text" value={formData.invoiceNumber} readOnly className="prefilled" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Customer Name</label>
                <input 
                  type="text" 
                  placeholder="Enter Name"
                  value={formData.customer.name}
                  onChange={(e) => setFormData({...formData, customer: {...formData.customer, name: e.target.value}})}
                />
              </div>
              <div className="form-group">
                <label>Customer Phone</label>
                <input 
                  type="text" 
                  placeholder="Enter Phone"
                  value={formData.customer.phone}
                  onChange={(e) => setFormData({...formData, customer: {...formData.customer, phone: e.target.value}})}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Customer Address</label>
              <textarea 
                placeholder="Enter Address..."
                rows="3"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({...formData, deliveryAddress: e.target.value})}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Courier Name</label>
                <select 
                   value={formData.courierName}
                   onChange={(e) => setFormData({...formData, courierName: e.target.value})}
                >
                  <option>Pathao</option>
                  <option>Steadfast</option>
                  <option>RedX</option>
                  <option>SA Paribahan</option>
                </select>
              </div>
              <div className="form-group">
                <label>Order Date</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="date" 
                    value={formData.orderDate}
                    onChange={(e) => setFormData({...formData, orderDate: e.target.value})}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>City Name</label>
                <select 
                  value={formData.district}
                  onChange={(e) => {
                    const newDistrict = e.target.value;
                    const newCharge = newDistrict === 'Dhaka' ? deliveryRates.dhaka : deliveryRates.outside;
                    setFormData({...formData, district: newDistrict, thana: '', area: '', deliveryCharge: newCharge});
                  }}
                >
                  <option value="">Select District</option>
                  {Object.keys(locationsData).sort().map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Thana Name</label>
                <select 
                  value={formData.thana}
                  onChange={(e) => setFormData({...formData, thana: e.target.value, area: ''})}
                >
                  <option value="">Select Thana</option>
                  {formData.district && Object.keys(locationsData[formData.district] || {}).sort().map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Area Name</label>
                <select 
                  value={formData.area}
                  onChange={(e) => setFormData({...formData, area: e.target.value})}
                >
                  <option value="">Select Area</option>
                  {formData.district && formData.thana && (locationsData[formData.district][formData.thana] || []).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Customer Note</label>
                <input 
                  type="text" 
                  placeholder="Note for customer..."
                  value={formData.customerNote}
                  onChange={(e) => setFormData({...formData, customerNote: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label>Shop Note</label>
              <input 
                type="text" 
                placeholder="Note for shop..."
                value={formData.shopNote}
                onChange={(e) => setFormData({...formData, shopNote: e.target.value})}
                onFocus={() => setShowNoteSuggestions(true)}
                onBlur={() => setTimeout(() => setShowNoteSuggestions(false), 200)}
              />
              {showNoteSuggestions && recentShopNotes.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  zIndex: 10,
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  marginTop: '2px'
                }}>
                  {recentShopNotes.map((note, idx) => (
                    <div 
                      key={idx}
                      style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer', borderBottom: idx < recentShopNotes.length - 1 ? '1px solid #f1f5f9' : 'none' }}
                      onMouseDown={() => setFormData({...formData, shopNote: note})}
                    >
                      {note}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Products & Payments */}
          <div className="right-section">
            <div className="search-container">
              <div className="search-wrapper">
                <input 
                  type="text" 
                  placeholder="Search product name..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductDropdown(true);
                  }}
                  onFocus={() => setShowProductDropdown(true)}
                />
                {showProductDropdown && filteredProductsBySearch.length > 0 && (
                  <div className="product-dropdown" ref={dropdownRef}>
                    {filteredProductsBySearch.map(p => (
                      <div 
                        key={p.id} 
                        className="dropdown-item"
                        onClick={() => addProduct(p)}
                      >
                        {p.name} ({currencySymbol}{p.discountPrice || p.price})
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button className="add-btn"><Plus size={16} /> Add</button>
            </div>

            <div className="product-table-container">
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Color</th>
                    <th>Size</th>
                    <th>Code</th>
                    <th>Product Name</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.products.map(item => (
                    <tr key={item.productId}>
                      <td>{item.color}</td>
                      <td>{item.size}</td>
                      <td>{item.code}</td>
                      <td style={{ fontWeight: 600 }}>{item.name}</td>
                      <td>
                        <input 
                          type="number" 
                          className="qty-input" 
                          value={item.quantity}
                          onChange={(e) => updateProductQuantity(item.productId, parseInt(e.target.value) || 1)}
                        />
                      </td>
                      <td>{currencySymbol}{item.price}</td>
                      <td>
                        <button 
                          style={{ border: 'none', background: 'none', color: '#fc8181', cursor: 'pointer' }}
                          onClick={() => removeProduct(item.productId)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {formData.products.length === 0 && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#a0aec0' }}>
                        No products added to this order yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="summary-sections">
              <div className="payment-fields">
                <div className="form-group" style={{ marginBottom: '15px' }}>
                  <label>Payment</label>
                  <select 
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  >
                    <option>Select a payment type</option>
                    <option>Cash on Delivery</option>
                    <option>bKash</option>
                    <option>Nagad</option>
                    <option>Online Payment</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Memo Number</label>
                  <input 
                    type="text" 
                    placeholder="Enter Memo Number"
                    value={formData.memoNumber}
                    onChange={(e) => setFormData({...formData, memoNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="calculation-box">
                <div className="calc-row">
                  <span>Sub Total</span>
                  <span>{currencySymbol}{calculations.subtotal}</span>
                </div>
                <div className="calc-row">
                  <span>Delivery</span>
                  <input 
                    type="number" 
                    value={formData.deliveryCharge} 
                    onChange={(e) => {
                      const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                      setFormData({...formData, deliveryCharge: isNaN(val) ? 0 : val});
                    }}
                  />
                </div>
                <div className="calc-row">
                  <span>Discount</span>
                  <input 
                    type="number" 
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="calc-row">
                  <span>Paid Amount</span>
                  <input 
                    type="number" 
                    value={formData.paidAmount}
                    onChange={(e) => setFormData({...formData, paidAmount: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="calc-row grand-total">
                  <span>Total</span>
                  <input type="text" value={calculations.total.toFixed(2)} readOnly />
                </div>
              </div>
            </div>

            <button className="save-btn" onClick={handleSubmit}>
              {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderEditorModal;
