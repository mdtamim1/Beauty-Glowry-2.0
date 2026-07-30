import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { ShoppingBag, Heart, User, LogOut, Package, Clock, MapPin, Phone, Mail, Edit2, X, Save } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Link, useNavigate } from 'react-router-dom';
import { locations } from '../data/products';

const Account = () => {
    const { user, logout, updateUser } = useAuth();
    const { orders, loading: ordersLoading } = useOrders();
    const { settings } = useSettings();
    const currencySymbol = settings?.currency?.split(' ')[0] || '৳';
    const navigate = useNavigate();
    
    const [isEditing, setIsEditing] = React.useState(false);
    const [editData, setEditData] = React.useState({ displayName: '', phone: '', address: '', district: '' });
    const [updating, setUpdating] = React.useState(false);

    React.useEffect(() => {
        if (user) {
            setEditData({
                displayName: user.displayName || '',
                phone: user.phone || '',
                address: user.address || '',
                district: user.district || ''
            });

            // Self-guard: If somehow admin reaches here directly, bounce to /admin
            if (user.role === 'admin' || user.role === 'staff') {
                navigate('/admin', { replace: true });
            }
        }
    }, [user, navigate]);

    if (!user) return null;
    
    if (user && (user.role === 'admin' || user.role === 'staff')) return null; // Wait for redirect


    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (err) {
            console.error("Logout error", err);
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setUpdating(true);
        try {
            await updateUser(user.uid, editData);
            setIsEditing(false);
        } catch (err) {
            console.error("Update error", err);
            alert("Failed to update profile");
        } finally {
            setUpdating(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered': return '#48bb78';
            case 'processing': return '#4299e1';
            case 'shipped': return '#ed8936';
            case 'cancelled': return '#f56565';
            case 'pending': return '#ecc94b';
            default: return '#718096';
        }
    };

    return (
        <div className="account-page">
            <div className="container">
                <div className="account-header">
                    <div className="user-welcome">
                        <div className="avatar-large">
                            {user.displayName ? user.displayName[0] : (user.email ? user.email[0] : 'U')}
                        </div>
                        <div>
                            <h1>Hello, {user.displayName || 'Customer'}</h1>
                            <p>{user.email}</p>
                        </div>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        <LogOut size={18} /> Logout
                    </button>
                </div>

                <div className="account-grid">
                    {/* Left Sidebar - Stats/Quick Links */}
                    <div className="account-sidebar">
                        <div className="stats-cards">
                            <div className="stat-card">
                                <Package size={24} />
                                <h3>{orders.length}</h3>
                                <p>Total Orders</p>
                            </div>
                            <Link to="/wishlist" className="stat-card">
                                <Heart size={24} />
                                <h3>View</h3>
                                <p>Wishlist</p>
                            </Link>
                        </div>

                        <div className="info-section mt-30">
                            <div className="section-title-row">
                                <h3>Personal Information</h3>
                                {!isEditing && (
                                    <button className="edit-icon-btn" onClick={() => setIsEditing(true)}>
                                        <Edit2 size={16} />
                                    </button>
                                )}
                            </div>
                            
                            {isEditing ? (
                                <form onSubmit={handleUpdateProfile} className="edit-profile-form">
                                    <div className="edit-field">
                                        <label>Full Name</label>
                                        <input 
                                            type="text" 
                                            value={editData.displayName} 
                                            onChange={(e) => setEditData({...editData, displayName: e.target.value})}
                                            placeholder="Enter your name"
                                        />
                                    </div>
                                    <div className="edit-field">
                                        <label>Phone Number</label>
                                        <input 
                                            type="tel" 
                                            value={editData.phone} 
                                            onChange={(e) => setEditData({...editData, phone: e.target.value})}
                                            placeholder="Enter phone number"
                                        />
                                    </div>
                                    <div className="edit-field">
                                        <label>Delivery Address</label>
                                        <input 
                                            type="text" 
                                            value={editData.address} 
                                            onChange={(e) => setEditData({...editData, address: e.target.value})}
                                            placeholder="House, Road, Area"
                                        />
                                    </div>
                                    <div className="edit-field">
                                        <label>District / Division</label>
                                        <select 
                                            value={editData.district} 
                                            onChange={(e) => setEditData({...editData, district: e.target.value})}
                                        >
                                            <option value="">Select District</option>
                                            {locations.districts.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div className="edit-actions">
                                        <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                                        <button type="submit" className="save-btn" disabled={updating}>
                                            {updating ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="info-item">
                                        <User size={16} />
                                        <span>{user.displayName || 'Not provided'}</span>
                                    </div>
                                    <div className="info-item">
                                        <Mail size={16} />
                                        <span>{user.email}</span>
                                    </div>
                                    {user.phone && (
                                        <div className="info-item">
                                            <Phone size={16} />
                                            <span>{user.phone}</span>
                                        </div>
                                    )}
                                    {user.address && (
                                        <div className="info-item">
                                            <MapPin size={16} />
                                            <span>{user.address} {user.district && `- ${user.district}`}</span>
                                        </div>
                                    )}
                                    <button className="edit-info-btn" onClick={() => setIsEditing(true)}>Edit Profile</button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Main Content - Order History */}
                    <div className="order-history-section">
                        <h2>Order History</h2>
                        
                        {ordersLoading ? (
                            <div className="loading-placeholder">Loading your orders...</div>
                        ) : orders.length > 0 ? (
                            <div className="orders-list">
                                {orders.map((order) => (
                                    <div key={order.firestoreId} className="order-item-card">
                                        <div className="order-item-header">
                                            <div className="order-id-date">
                                                <span className="order-id">#{order.id}</span>
                                                <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <span 
                                                className="status-badge" 
                                                style={{ backgroundColor: `${getStatusColor(order.status)}15`, color: getStatusColor(order.status) }}
                                            >
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="order-item-content">
                                            <div className="order-products-summary">
                                                {order.products.length} {order.products.length === 1 ? 'item' : 'items'} • {currencySymbol}{order.total}
                                            </div>
                                            <div className="order-address">
                                                <MapPin size={14} /> {order.deliveryAddress}
                                            </div>
                                        </div>
                                        <div className="order-item-footer">
                                            <Link to={`/orders/tracking/${order.firestoreId}`} className="track-link">
                                                Track Order
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-orders">
                                <ShoppingBag size={48} />
                                <p>You haven't placed any orders yet.</p>
                                <Link to="/products" className="shop-btn">Start Shopping</Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .account-page { padding: 60px 0 100px; background: #fdfdfd; min-height: 80vh; }
                .account-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
                .user-welcome { display: flex; align-items: center; gap: 20px; }
                .avatar-large { 
                    width: 72px; height: 72px; background: var(--primary-dark); color: white; 
                    border-radius: 50%; display: flex; align-items: center; justify-content: center; 
                    font-size: 32px; font-weight: 800; text-transform: uppercase;
                }
                .user-welcome h1 { font-size: 28px; margin-bottom: 4px; }
                .user-welcome p { color: var(--text-muted); }
                
                .logout-btn { 
                    display: flex; align-items: center; gap: 8px; padding: 10px 20px; 
                    border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 600; 
                    color: #4a5568; transition: var(--transition);
                }
                .logout-btn:hover { background: #fff5f5; color: #f56565; border-color: #feb2b2; }

                .account-grid { display: grid; grid-template-columns: 320px 1fr; gap: 40px; }

                /* Sidebar */
                .stats-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .stat-card { 
                    background: white; padding: 24px 15px; border-radius: var(--radius-md); 
                    text-align: center; border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.02);
                }
                .stat-card svg { color: var(--primary-dark); margin-bottom: 12px; }
                .stat-card h3 { font-size: 24px; margin-bottom: 4px; }
                .stat-card p { font-size: 13px; color: var(--text-muted); font-weight: 500; }

                .info-section { 
                    background: white; padding: 30px; border-radius: var(--radius-md); 
                    border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.02);
                }
                .info-section h3 { font-size: 18px; margin-bottom: 20px; }
                .info-item { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; color: #4a5568; font-size: 15px; }
                .edit-info-btn { width: 100%; padding: 12px; margin-top: 10px; border: 1px solid var(--primary-dark); color: var(--primary-dark); font-weight: 700; border-radius: 8px; transition: 0.3s; }
                .edit-info-btn:hover { background: var(--primary-dark); color: white; }

                .section-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .section-title-row h3 { margin-bottom: 0; }
                .edit-icon-btn { color: var(--text-muted); padding: 5px; border-radius: 5px; transition: 0.2s; }
                .edit-icon-btn:hover { background: var(--secondary); color: var(--primary-dark); }

                .edit-profile-form { display: flex; flex-direction: column; gap: 15px; }
                .edit-field { display: flex; flex-direction: column; gap: 6px; }
                .edit-field label { font-size: 13px; font-weight: 700; color: var(--text-muted); }
                .edit-field input, .edit-field select { 
                    padding: 10px 15px; border: 1px solid var(--border); border-radius: 8px; 
                    background: var(--background); font-size: 14px; 
                }
                .edit-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
                .cancel-btn { padding: 10px; border-radius: 8px; font-weight: 600; background: var(--secondary); }
                .save-btn { padding: 10px; border-radius: 8px; font-weight: 600; background: var(--primary-dark); color: white; }

                /* Order History */
                .order-history-section h2 { font-size: 22px; margin-bottom: 25px; }
                .orders-list { display: grid; gap: 20px; }
                .order-item-card { 
                    background: white; padding: 24px; border-radius: var(--radius-md); 
                    border: 1px solid var(--border); box-shadow: 0 2px 10px rgba(0,0,0,0.02);
                }
                .order-item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
                .order-id-date { display: flex; align-items: center; gap: 12px; }
                .order-id { font-weight: 800; color: var(--text-main); }
                .order-date { color: var(--text-muted); font-size: 14px; }
                .status-badge { padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
                
                .order-item-content { margin-bottom: 16px; border-bottom: 1px solid #f7fafc; padding-bottom: 16px; }
                .order-products-summary { font-weight: 700; font-size: 15px; margin-bottom: 8px; }
                .order-address { display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 14px; }
                
                .track-link { color: var(--primary-dark); font-weight: 700; font-size: 14px; }

                .empty-orders { text-align: center; padding: 60px 0; background: white; border-radius: var(--radius-md); border: 1px dashed #cbd5e0; }
                .empty-orders svg { color: #cbd5e0; margin-bottom: 20px; }
                .empty-orders p { color: var(--text-muted); margin-bottom: 24px; }
                .shop-btn { background: var(--primary-dark); color: white; padding: 12px 30px; border-radius: 30px; font-weight: 700; }

                .mt-30 { margin-top: 30px; }

                @media (max-width: 992px) {
                    .account-grid { grid-template-columns: 1fr; }
                    .account-sidebar { order: 2; }
                    .order-history-section { order: 1; }
                }
            ` }} />
        </div>
    );
};

export default Account;
