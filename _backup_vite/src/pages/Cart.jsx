import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, subtotal, deliveryCharge, total } = useCart();

  const { settings } = useSettings();
  const currencySymbol = settings?.currency?.split(' ')[0] || '৳';
  const threshold = Number(settings?.freeShippingThreshold || 1500);

  if (cart.length === 0) {
    return (
      <div className="container empty-cart">
        <div className="empty-content animate-fade">
          <div className="cart-icon-bg"><ShoppingBag size={80} /></div>
          <h2>Your Cart is Empty</h2>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <Link to="/products" className="btn btn-primary">Go Shopping</Link>
        </div>
        <style dangerouslySetInnerHTML={{ __html: `
          .empty-cart { padding: 120px 0; display: flex; align-items: center; justify-content: center; }
          .empty-content { text-align: center; max-width: 400px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
          .cart-icon-bg { width: 160px; height: 160px; background: var(--secondary); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--primary-dark); }
          .empty-content h2 { font-size: 32px; }
          .empty-content p { color: var(--text-muted); }
        ` }} />
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="page-title">Shopping Cart ({cart.reduce((a, b) => a + b.quantity, 0)})</h1>
        
        <div className="cart-container">
          <div className="cart-items-list">
            <div className="cart-header grid-header">
              <span>Product</span>
              <span>Price</span>
              <span>Quantity</span>
              <span>Total</span>
            </div>
            
            {cart.map(item => (
              <div key={item.id} className="cart-item animate-fade">
                <div className="item-info">
                  <div className="item-img"><img src={item.image} alt={item.name} /></div>
                  <div>
                    <h3 className="item-name">{item.name}</h3>
                    <p className="item-cat">{item.category}</p>
                    <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
                <div className="item-price">{currencySymbol}{item.discountPrice || item.price}</div>
                <div className="item-qty">
                  <div className="qty-box">
                    <button onClick={() => updateQuantity(item.id, -1)}><Minus size={14} /></button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)}><Plus size={14} /></button>
                  </div>
                </div>
                <div className="item-total">{currencySymbol}{(item.discountPrice || item.price) * item.quantity}</div>
              </div>
            ))}
          </div>

          <div className="cart-summary animate-fade">
            <div className="summary-card">
              <h3>Order Summary</h3>
              <div className="shipping-progress">
                {subtotal >= threshold ? (
                  <p className="free-ship-success">🎉 Congratulations! You qualify for FREE Delivery!</p>
                ) : (
                  <p>Add <span>{currencySymbol}{threshold - subtotal}</span> more for <span>FREE Delivery</span></p>
                )}
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min((subtotal / threshold) * 100, 100)}%` }}></div>
                </div>
              </div>
              <div className="summary-row mt-32">
                <span>Subtotal</span>
                <span>{currencySymbol}{subtotal}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{deliveryCharge === 0 ? 'FREE' : `${currencySymbol}${deliveryCharge}`}</span>
              </div>
              <div className="divider"></div>
              <div className="summary-row total-row">
                <span>Total</span>
                <span>{currencySymbol}{total}</span>
              </div>
              

              <Link to="/checkout" className="btn btn-primary checkout-btn">
                Checkout Now <ArrowRight size={20} />
              </Link>
              
              <p className="summary-info">
                Taxes and discounts will be calculated at checkout.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .cart-page { padding: 60px 0 100px; background: #fdfdfd; }
        .page-title { font-size: 32px; margin-bottom: 48px; }

        .cart-container { display: grid; grid-template-columns: 1fr 380px; gap: 40px; align-items: flex-start; }

        .cart-items-list { background: white; border-radius: var(--radius-lg); border: 1px solid var(--border); overflow: hidden; }

        .cart-header { 
          display: grid; 
          grid-template-columns: 2fr 1fr 1fr 1fr; 
          padding: 24px; 
          background: var(--secondary); 
          font-weight: 700; 
          font-size: 14px; 
          color: var(--text-muted); 
          border-bottom: 1px solid var(--border);
        }

        .cart-item { 
          display: grid; 
          grid-template-columns: 2fr 1fr 1fr 1fr; 
          padding: 24px; 
          border-bottom: 1px solid var(--border); 
          align-items: center; 
        }
        .cart-item:last-child { border-bottom: none; }

        .item-info { display: flex; gap: 20px; align-items: center; }
        .item-img { width: 90px; height: 90px; border-radius: 12px; background: var(--secondary); overflow: hidden; }
        .item-img img { width: 100%; height: 100%; object-fit: cover; }
        .item-name { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
        .item-cat { font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }
        .remove-btn { color: #d32f2f; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 4px; }
        .remove-btn:hover { text-decoration: underline; }

        .item-price { font-weight: 600; }
        .item-total { font-weight: 800; color: var(--primary-dark); }

        .qty-box { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          border: 1px solid var(--border); 
          padding: 4px; 
          border-radius: 8px; 
          width: fit-content; 
        }
        .qty-box button { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; }
        .qty-box span { font-weight: 700; min-width: 20px; text-align: center; }

        .summary-card { background: white; padding: 40px; border-radius: var(--radius-lg); border: 1px solid var(--border); position: sticky; top: 120px; }
        .summary-card h3 { font-size: 20px; border-bottom: 1px solid var(--border); padding-bottom: 20px; }
        .mt-32 { margin-top: 32px; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 16px; font-weight: 500; font-size: 16px; }
        .divider { height: 1px; background: var(--border); margin: 24px 0; }
        .total-row { font-size: 24px; font-weight: 800; color: var(--text-main); }
        

        .checkout-btn { width: 100%; height: 56px; justify-content: center; font-size: 18px; }
        .summary-info { text-align: center; font-size: 13px; color: var(--text-muted); margin-top: 20px; }

        @media (max-width: 992px) {
          .cart-container { grid-template-columns: 1fr; gap: 24px; }
          .grid-header { display: none; }
          .cart-header { display: none; }
          .cart-item { display: flex; flex-direction: column; align-items: stretch; gap: 16px; padding: 16px; position: relative; }
          .item-info { width: 100%; }
          .item-img { width: 80px; height: 80px; flex-shrink: 0; }
          .item-price, .item-qty, .item-total { display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed var(--border); padding-top: 12px; font-size: 14px; }
          .item-price::before { content: 'Individual Price:'; font-weight: 500; color: var(--text-muted); }
          .item-qty::before { content: 'Quantity:'; font-weight: 500; color: var(--text-muted); }
          .item-total::before { content: 'Total Price:'; font-weight: 500; color: var(--text-muted); }
          .cart-summary { margin-top: 24px; }
          .summary-card { padding: 24px; position: static; }
          .page-title { font-size: 24px; margin-bottom: 32px; }
        }
        
      ` }} />
    </div>
  );
};

export default Cart;
