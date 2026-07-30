import React, { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { products as initialProducts } from '../data/products';
import { 
  LayoutDashboard, ShoppingBag, Users, BarChart3, 
  Settings, Plus, Search, MoreVertical, Edit, 
  Trash2, TrendingUp, DollarSign, Package, CheckCircle,
  FileText, Info, Filter, X
} from 'lucide-react';
import { useProducts } from '../context/ProductContext';
import { useOrders } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import OrderEditorModal from '../components/OrderEditorModal';
import FilterManagerModal from '../components/FilterManagerModal';
import { categories as allCategories } from '../data/products';
import { useSettings } from '../context/SettingsContext';
import { Phone as PhoneIcon, LogOut, Megaphone, Timer, Image as ImageIcon, MapPin, Link as Facebook, Camera as Instagram, Music2, Globe, Hash } from 'lucide-react';

const AdminDashboard = () => {
  const { 
    products, addProduct, deleteProduct, updateProduct, 
    categories, addCategory, deleteCategory,
    filters, addFilterGroup, updateFilterGroup, deleteFilterGroup,
    loading: productsLoading 
  } = useProducts();
  const { orders, addOrder, editOrder, updateOrderStatus, deleteOrder, bulkUpdateOrderStatus, bulkDeleteOrders, loading: ordersLoading } = useOrders();
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'dashboard');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderFilter, setOrderFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);

  const userRole = user?.role || 'admin';
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [invitesList, setInvitesList] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('staff');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [newFilterGroupName, setNewFilterGroupName] = useState('');
  const { settings: marketingSettings, updateSettings: updateMarketing } = useSettings();
  const [marketingForm, setMarketingForm] = useState({
    announcements: [],
    announcement: '',
    showAnnouncement: false,
    flashSaleTitle: '',
    flashSaleEndsAt: '',
    showFlashSale: false,
    coupons: []
  });
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponPercent, setNewCouponPercent] = useState('');

  const [isUpdatingMarketing, setIsUpdatingMarketing] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotify = (message, type = 'success') => {
    setNotification({ message, type });
  };

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  React.useEffect(() => {
    if (marketingSettings) {
      setMarketingForm(marketingSettings);
    }
  }, [marketingSettings]);

  const handleSaveMarketing = async () => {
    setIsUpdatingMarketing(true);
    try {
      await updateMarketing(marketingForm);
      showNotify('Marketing settings saved successfully!');
    } catch (err) {
      console.error('Failed to update marketing', err);
      showNotify('Failed to save marketing settings: ' + err.message, 'error');
    }
    setIsUpdatingMarketing(false);
  };

  const handleAddCoupon = () => {
    if (!newCouponCode || !newCouponPercent) return;
    const code = newCouponCode.trim().toUpperCase();
    if (marketingForm.coupons?.some(c => c.code === code)) {
      showNotify("This coupon code already exists.", 'warning');
      return;
    }
    const newCoupon = {
      id: Date.now().toString(),
      code: code,
      percentage: Number(newCouponPercent)
    };
    setMarketingForm({
      ...marketingForm,
      coupons: [...(marketingForm.coupons || []), newCoupon]
    });
    setNewCouponCode('');
    setNewCouponPercent('');
  };

  const handleRemoveCoupon = (id) => {
    setMarketingForm({
      ...marketingForm,
      coupons: marketingForm.coupons.filter(c => c.id !== id)
    });
  };

  
  const handleDeleteUser = async (uid, email, targetRole) => {
    if (uid === user?.uid) {
      showNotify("You cannot delete your own account.", 'error');
      return;
    }
    
    if (userRole === 'staff' && targetRole === 'admin') {
      showNotify("Staff members cannot delete administrator accounts.", 'error');
      return;
    }
    
    if (window.confirm(`Are you sure you want to remove ${email} from the staff?`)) {
      try {
        await deleteDoc(doc(db, 'users', uid));
      } catch (err) {
        console.error('Failed to delete user:', err);
        showNotify('Failed to delete user.', 'error');
      }
    }
  };
  
  
  // Sync tab with URL
  useEffect(() => {
    setSearchParams({ tab: activeTab }, { replace: true });
  }, [activeTab, setSearchParams]);

  // Handle URL changes (back/forward)
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  React.useEffect(() => {
    if (userRole === 'staff' && !['dashboard', 'orders'].includes(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [userRole, activeTab]);

  React.useEffect(() => {
    if (userRole === 'admin') {
      const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        setUsersList(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })));
      });
      const unsubInvites = onSnapshot(collection(db, 'invites'), (snapshot) => {
        setInvitesList(snapshot.docs.map(doc => ({ email: doc.id, ...doc.data() })));
      });
      const unsubCms = onSnapshot(doc(db, 'cms', 'general'), (docSnap) => {
        if (docSnap.exists()) {
          // Settings are managed by SettingsContext
        }
      });
      return () => {
        unsubUsers();
        unsubInvites();
        unsubCms();
      };
    }
  }, [userRole]);

  const handleSendInvite = async (e) => {
     e.preventDefault();
     if (!inviteEmail) return;
     try {
       await setDoc(doc(db, 'invites', inviteEmail), {
          role: inviteRole,
          invitedBy: user.uid,
          invitedAt: new Date(),
          status: 'pending'
       });
       
       const registrationLink = `${window.location.origin}/staff-register?email=${encodeURIComponent(inviteEmail)}`;
       const mailtoLink = `mailto:${inviteEmail}?subject=Invitation to join BEAUTY GLOWRY Staff&body=Hello,%0D%0A%0D%0AYou have been invited to join the BEAUTY GLOWRY staff as a ${inviteRole}.%0D%0A%0D%0APlease click the link below to complete your registration:%0D%0A${registrationLink}%0D%0A%0D%0ABest regards,%0D%0ABEAUTY GLOWRY Admin`;
       
       setInviteEmail('');
       
       if (window.confirm(`Invite created for ${inviteEmail}. Would you like to open your email client to send the invitation link?`)) {
         window.location.href = mailtoLink;
       } else {
         showNotify(`Invite record created. Link: ${registrationLink}`, 'success');
       }
     } catch (err) {
       console.error("Error creating invite", err);
       showNotify("Failed to create invite: " + err.message, 'error');
     }
  };

  const handleDeleteInvite = async (email) => {
     try {
       await deleteDoc(doc(db, 'invites', email));
     } catch (err) {
       console.error("Error deleting invite", err);
       showNotify("Failed to delete invite: " + err.message, 'error');
     }
  };

  // Remove old cms logic as it's replaced by Marketing tab
  const handleSaveCms = async () => {
    // Legacy - No longer needed
  };

  const [newCatName, setNewCatName] = useState('');
  const [newCatGender, setNewCatGender] = useState('Unisex');
  const [showCatManager, setShowCatManager] = useState(false);

  const initialProductState = {
    name: '', 
    category: categories[0]?.name || '', 
    price: '', 
    discountPrice: '', 
    stock: '', 
    description: '', 
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1000',
    ingredients: '',
    howToUse: '',
    productImages: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1000'],
    gender: 'Unisex',
    filters: {}, // { "Skin Concern": ["Acne", "Hydration"] }
    isFeatured: false
  };

  const [productFormData, setProductFormData] = useState(initialProductState);

  // Sync category if empty or deleted and categories load
  React.useEffect(() => {
    if (isModalOpen && categories.length > 0) {
      const categoryExists = categories.some(cat => cat.name === productFormData.category);
      if (!productFormData.category || !categoryExists) {
        setProductFormData(prev => ({ ...prev, category: categories[0].name }));
      }
    }
  }, [categories, isModalOpen, productFormData.category]);

  // Settings State
  const { settings: appSettings, updateSettings, loading: settingsLoading } = useSettings();
  const [storeSettings, setStoreSettings] = useState({
    storeName: '',
    storePhone: '',
    storeEmail: '',
    currency: '৳ (BDT)',
    deliveryDhaka: '',
    deliveryOutside: '',
    storeAddress: '',
    storeTagline: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    storeLogo: '',
    storeFavicon: '',
    contactLink: '/contact',
    trackLink: '/track',
    shippingLink: '/shipping',
    returnsLink: '/returns',
    faqLink: '/faq',
    contactContent: '',
    trackContent: '',
    shippingContent: '',
    returnsContent: '',
    faqContent: '',
    freeShippingThreshold: ''
  });

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [settingsInitialized, setSettingsInitialized] = useState(false);

  React.useEffect(() => {
    if (!settingsLoading && appSettings && !settingsInitialized) {
      setStoreSettings({
        storeName: appSettings.storeName || '',
        storePhone: appSettings.storePhone || '',
        storeEmail: appSettings.storeEmail || '',
        currency: appSettings.currency || '৳ (BDT)',
        deliveryDhaka: appSettings.deliveryDhaka || '',
        deliveryOutside: appSettings.deliveryOutside || '',
        storeAddress: appSettings.storeAddress || '',
        storeTagline: appSettings.storeTagline || '',
        facebook: appSettings.facebook || '',
        instagram: appSettings.instagram || '',
        tiktok: appSettings.tiktok || '',
        storeLogo: appSettings.storeLogo || '',
        storeFavicon: appSettings.storeFavicon || '',
        contactLink: appSettings.contactLink || '/contact',
        trackLink: appSettings.trackLink || '/track',
        shippingLink: appSettings.shippingLink || '/shipping',
        returnsLink: appSettings.returnsLink || '/returns',
        faqLink: appSettings.faqLink || '/faq',
        privacyLink: appSettings.privacyLink || '/privacy-policy',
        termsLink: appSettings.termsLink || '/terms-of-service',
        contactContent: appSettings.contactContent || '',
        trackContent: appSettings.trackContent || '',
        shippingContent: appSettings.shippingContent || '',
        returnsContent: appSettings.returnsContent || '',
        faqContent: appSettings.faqContent || '',
        privacyContent: appSettings.privacyContent || '',
        termsContent: appSettings.termsContent || '',
        freeShippingThreshold: appSettings.freeShippingThreshold || ''
      });
      setSettingsInitialized(true);
    }
  }, [appSettings, settingsInitialized, settingsLoading]);

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `settings/${type}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      setStoreSettings(prev => ({ ...prev, [type]: downloadURL }));
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      showNotify(`Failed to upload ${type}. Please try again.`, 'error');
    }
    setIsUploading(false);
  };

  const handleSaveStoreSettings = async () => {
    setIsSavingSettings(true);
    try {
      // Create a copy to modify for numeric conversion
      // Use null for empty strings to trigger fallbacks instead of forcing 0
      const finalSettings = { 
        ...storeSettings,
        deliveryDhaka: storeSettings.deliveryDhaka === '' ? null : Number(storeSettings.deliveryDhaka),
        deliveryOutside: storeSettings.deliveryOutside === '' ? null : Number(storeSettings.deliveryOutside),
        freeShippingThreshold: storeSettings.freeShippingThreshold === '' ? null : Number(storeSettings.freeShippingThreshold)
      };
      
      await updateSettings(finalSettings, 'general');
      showNotify('Store settings updated successfully!');
    } catch (err) {
      console.error('Failed to save store settings:', err);
      showNotify('Failed to save store settings: ' + err.message, 'error');
    }
    setIsSavingSettings(false);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenProductModal = (product = null) => {
    if (product) {
      setEditingProductId(product.firestoreId);
      setProductFormData({
        ...initialProductState,
        ...product,
        filters: product.filters || {}
      });
    } else {
      setEditingProductId(null);
      setProductFormData(initialProductState);
    }
    setIsModalOpen(true);
  };

  const handleSubmitProduct = (e) => {
    e.preventDefault();
    if (editingProductId) {
      updateProduct(editingProductId, {
        ...productFormData,
        discountPrice: productFormData.discountPrice || productFormData.price
      });
    } else {
      addProduct({
        ...productFormData,
        id: Date.now(),
        discountPrice: productFormData.discountPrice || productFormData.price
      });
    }
    setIsModalOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      last7Days.push({ 
        name: days[d.getDay()], 
        date: d.toISOString().split('T')[0],
        revenue: 0, 
        orders: 0 
      });
    }

    orders.forEach(order => {
      if (!order.createdAt) return;
      const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
      const chartDay = last7Days.find(d => d.date === orderDate);
      if (chartDay) {
        chartDay.orders += 1;
        chartDay.revenue += (Number(order.total) || 0);
      }
    });

    return last7Days;
  };

  const chartData = getChartData();
  const totalRevenue = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

  const parseOrderDate = (order, useUpdateDate = false) => {
    if (!order) return new Date();
    const ca = (useUpdateDate && order.status === 'Delivered') ? (order.updatedAt || order.createdAt) : order.createdAt;
    if (!ca) return new Date();
    if (ca.seconds !== undefined) return new Date(ca.seconds * 1000);
    if (typeof ca.toDate === 'function') return ca.toDate();
    return new Date(ca);
  };

  const stats = [
    { title: 'Total Revenue', value: `৳${totalRevenue.toLocaleString()}`, icon: <DollarSign />, color: '#4CAF50' },
    { title: 'Total Orders', value: orders.length.toString(), icon: <ShoppingBag />, color: '#2196F3' },
    { title: 'Active Products', value: products.length.toString(), icon: <Package />, color: '#FF9800' },
    { title: 'Total Users', value: usersList.length.toString(), icon: <Users />, color: '#9C27B0' }
  ];

  const analyticsData = useMemo(() => {
    // 6-month revenue
    const last6Months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      last6Months.push({
        monthName: d.toLocaleString('default', { month: 'short' }),
        year: d.getFullYear(),
        month: d.getMonth(),
        revenue: 0
      });
    }

    orders.forEach(order => {
      const d = parseOrderDate(order);
      const m = d.getMonth();
      const y = d.getFullYear();
      const monthData = last6Months.find(lm => lm.month === m && lm.year === y);
      if (monthData) {
        monthData.revenue += (Number(order.total) || 0);
      }
    });

    const maxRevenue = Math.max(...last6Months.map(m => m.revenue), 1);

    // Status breakdown
    const statusCounts = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    const totalOrders = orders.length || 1;
    const statusColors = {
      'Delivered': 'var(--primary-dark)',
      'Shipped': '#2196F3',
      'Processing': '#FF9800',
      'Pending': '#FFC107',
      'Cancelled': '#F44336',
      'Returned': '#9C27B0',
      'On Hold': '#D97706'
    };

    const breakdown = Object.entries(statusCounts)
      .map(([status, count]) => ({
        status,
        count,
        percent: Math.round((count / totalOrders) * 100),
        color: statusColors[status] || '#94a3b8'
      }))
      .sort((a, b) => b.count - a.count);

    let currentPercent = 0;
    const gradientParts = breakdown.map(item => {
      const start = currentPercent;
      currentPercent += item.percent;
      return `${item.color} ${start}% ${currentPercent}%`;
    });
    const conicGradient = gradientParts.length > 0 ? `conic-gradient(${gradientParts.join(', ')})` : '#f1f5f9';

    return { last6Months, maxRevenue, breakdown, conicGradient };
  }, [orders]);

  const orderTabs = ['All', 'Pending', 'Processing', 'On Hold', 'Shipped', 'Delivered', 'Cancelled', 'Returned'];
  const statusClasses = (status) => status.toLowerCase().replace(/\s+/g, '-');

  // Helper: get local YYYY-MM-DD string from a Date object (timezone-safe)
  const toLocalDateStr = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const todayDate = useMemo(() => toLocalDateStr(new Date()), []);

  const isTodayFilterActive = dateFrom === todayDate && dateTo === todayDate;

  const todayOrdersCount = useMemo(() => {
    return orders.filter(order => {
      const orderDate = toLocalDateStr(parseOrderDate(order));
      return orderDate === todayDate;
    }).length;
  }, [orders, todayDate]);

  const filteredOrders = orders.filter((order) => {
    const searchTermLower = orderSearch.trim().toLowerCase();
    const orderText = `${order.id} ${order.customer.name} ${order.customer.phone} ${order.customer.email} ${order.deliveryAddress}`.toLowerCase();
    const matchesSearch = !searchTermLower || orderText.includes(searchTermLower);
    
    // Status Logic: For 'Delivered' tab, default to Today unless date filter is manually set
    const isDeliveredTab = orderFilter === 'Delivered';
    const hasManualDateFilter = !!(dateFrom || dateTo);
    
    let matchesStatus = false;
    if (orderFilter === 'All') {
      matchesStatus = true;
    } else if (isDeliveredTab) {
      if (order.status === 'Delivered') {
        if (!hasManualDateFilter) {
          // No manual date filter? Only show today's deliveries
          const orderDate = toLocalDateStr(parseOrderDate(order, true));
          matchesStatus = (orderDate === todayDate);
        } else {
          // Manual date filter handles the restriction below
          matchesStatus = true;
        }
      }
    } else {
      matchesStatus = order.status === orderFilter;
    }

    const matchesPayment = paymentFilter === 'All' || order.paymentMethod === paymentFilter;
    
    // Date Filtering Logic — compare using local dates
    // For delivered orders, we filter against the delivery (update) date
    const orderLocalDate = toLocalDateStr(parseOrderDate(order, isDeliveredTab || order.status === 'Delivered'));
    let matchesFrom = true;
    let matchesTo = true;

    if (dateFrom) {
       matchesFrom = orderLocalDate >= dateFrom;
    }
    
    if (dateTo) {
       matchesTo = orderLocalDate <= dateTo;
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesFrom && matchesTo;
  });

  const selectedAll = filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length;

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map(o => o.firestoreId));
    }
  };

  const toggleSelectOrder = (firestoreId) => {
    if (selectedOrderIds.includes(firestoreId)) {
      setSelectedOrderIds(selectedOrderIds.filter(id => id !== firestoreId));
    } else {
      setSelectedOrderIds([...selectedOrderIds, firestoreId]);
    }
  };

  const handleOpenOrderModal = (order = null) => {
    setEditingOrder(order);
    setIsOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    setEditingOrder(null);
    setIsOrderModalOpen(false);
  };

  const handleSaveOrder = (orderData) => {
    if (orders.some((order) => order.id === orderData.id)) {
      editOrder(orderData.id, orderData);
    } else {
      addOrder(orderData);
    }
    setIsOrderModalOpen(false);
    setSelectedOrderIds([]);
  };

  const handleBulkStatus = (status) => {
    if (!selectedOrderIds.length) return;
    bulkUpdateOrderStatus(selectedOrderIds, status, userRole);
    setSelectedOrderIds([]);
  };

  const handleExportCsv = () => {
    const headers = ['Order ID', 'Customer', 'Phone', 'Email', 'Status', 'Payment Method', 'Total', 'Delivery Address', 'Created At'];
    const rows = filteredOrders.map((order) => [
      order.id,
      order.customer.name,
      order.customer.phone,
      order.customer.email,
      order.status,
      order.paymentMethod,
      order.total,
      order.deliveryAddress,
      parseOrderDate(order).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'beauty-glowry-orders.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusCounts = orderTabs.reduce((acc, status) => {
    if (status === 'All') {
      acc[status] = orders.length;
    } else if (status === 'Delivered') {
      // Delivered section reset logic
      acc[status] = orders.filter((order) => {
        if (order.status !== 'Delivered') return false;
        const orderDate = toLocalDateStr(parseOrderDate(order, true));
        return orderDate === todayDate;
      }).length;
    } else {
      acc[status] = orders.filter((order) => order.status === status).length;
    }
    return acc;
  }, {});

  return (
    <div className="admin-dashboard">
      {/* Product Modal */}
      {isModalOpen && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="modal-header">
              <h2>{editingProductId ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="close-btn"><Package size={20} /></button>
            </div>
            <form onSubmit={handleSubmitProduct} className="admin-form">
              <div className="form-section">
                <div className="form-section-header">
                  <div className="section-icon"><Info size={14} /></div>
                  <h3>Basic Info</h3>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>Product Name</label>
                  <input type="text" value={productFormData.name} onChange={(e) => setProductFormData({...productFormData, name: e.target.value})} placeholder="e.g. Skin Whitening Serum" required />
                </div>

                <div className="form-group" style={{ marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ margin: 0 }}>Product Category</label>
                    <span 
                      onClick={() => setShowCatManager(!showCatManager)}
                      className="cat-manager-link"
                    >
                      {showCatManager ? 'CLOSE MANAGER' : 'MANAGE TAGS'}
                    </span>
                  </div>

                  {showCatManager && (
                    <div className="cat-manager-panel">
                      <div className="cat-manager-input-row">
                        <input 
                          type="text" 
                          value={newCatName} 
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="New category..."
                        />
                        <select 
                          value={newCatGender} 
                          onChange={(e) => setNewCatGender(e.target.value)}
                        >
                          <option value="Unisex">Unisex</option>
                          <option value="Ladies">Ladies</option>
                          <option value="Boys">Boys</option>
                        </select>
                        <button 
                          type="button" 
                          onClick={() => { 
                            if (newCatName.trim()) {
                              addCategory(newCatName, newCatGender); 
                              setProductFormData({ 
                                ...productFormData, 
                                category: newCatName.trim(),
                                gender: newCatGender
                              });
                              setNewCatName(''); 
                            }
                          }}
                          className="btn btn-primary"
                          style={{ padding: '0 12px' }}
                        >
                          ADD
                        </button>
                      </div>
                      
                      <div className="cat-list-scroll">
                        {categories.map(cat => (
                          <div key={cat.firestoreId} className="cat-pill gender-unisex" style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <span className="cat-name">{cat.name} ({cat.gender})</span>
                            <button type="button" onClick={() => deleteCategory(cat.firestoreId)} className="cat-delete-btn"><X size={12} /></button>
                          </div>
                        ))}
                        {categories.length === 0 && <p className="no-cats-msg">No categories yet.</p>}
                      </div>
                    </div>
                  )}

                  <div className="cat-select-grid">
                    {categories.map(cat => (
                      <button
                        key={cat.firestoreId}
                        type="button"
                        className={`cat-tag ${productFormData.category === cat.name ? 'active' : ''}`}
                        onClick={() => setProductFormData({ ...productFormData, category: cat.name })}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                </div>


            <div className="form-section" style={{ marginTop: '24px' }}>
              <div className="form-section-header">
                <div className="section-icon"><DollarSign size={14} /></div>
                <h3>Pricing & Stock</h3>
              </div>
              
              <div className="form-row" style={{ marginTop: '16px' }}>
                <div className="form-group">
                  <label>Regular Price (৳)</label>
                  <input type="number" value={productFormData.price} onChange={(e) => setProductFormData({...productFormData, price: e.target.value})} placeholder="0.00" required />
                </div>
                <div className="form-group">
                  <label>Discount Price (৳)</label>
                  <input type="number" value={productFormData.discountPrice} onChange={(e) => setProductFormData({...productFormData, discountPrice: e.target.value})} placeholder="0.00" />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Stock Quantity</label>
                <input type="number" value={productFormData.stock} onChange={(e) => setProductFormData({...productFormData, stock: e.target.value})} placeholder="Qty" required />
              </div>
            </div>

            <div className="form-section" style={{ marginTop: '24px' }}>
              <div className="form-section-header">
                <div className="section-icon"><FileText size={14} /></div>
                <h3>Product Details</h3>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Product Description</label>
                <textarea 
                  value={productFormData.description} 
                  onChange={(e) => setProductFormData({...productFormData, description: e.target.value})} 
                  placeholder="Enter product description and details..." 
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Ingredients (উপাদান)</label>
                <textarea 
                  value={productFormData.ingredients} 
                  onChange={(e) => setProductFormData({...productFormData, ingredients: e.target.value})} 
                  placeholder="Eg: Water, Glycerin, Aloe Vera Extract..." 
                  rows="3"
                ></textarea>
              </div>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>How to Use (ব্যবহারের নিয়ম)</label>
                <textarea 
                  value={productFormData.howToUse} 
                  onChange={(e) => setProductFormData({...productFormData, howToUse: e.target.value})} 
                  placeholder="Eg: Apply on clean face morning and evening..." 
                  rows="3"
                ></textarea>
              </div>
            </div>

            <div className="form-section product-filters-section" style={{ marginTop: '24px' }}>
              <div className="form-section-header">
                <div className="section-icon"><Filter size={14} /></div>
                <h3>Product Filters (Tagging)</h3>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filters.length === 0 ? (
                  <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '10px' }}>
                    No filter groups defined. Handle them in "Manage Filters".
                  </p>
                ) : (
                  filters.map(group => (
                    <div key={group.firestoreId} className="filter-group-tagging">
                      <label style={{ fontSize: '12px', fontWeight: '800', color: '#475569', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>
                        {group.name}
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {(group.options || []).map(option => {
                          const isSelected = (productFormData.filters?.[group.name] || []).includes(option);
                          return (
                            <button
                              key={option}
                              type="button"
                              onClick={() => {
                                const currentGroupFilters = productFormData.filters?.[group.name] || [];
                                const newGroupFilters = isSelected
                                  ? currentGroupFilters.filter(f => f !== option)
                                  : [...currentGroupFilters, option];
                                
                                setProductFormData({
                                  ...productFormData,
                                  filters: {
                                    ...(productFormData.filters || {}),
                                    [group.name]: newGroupFilters
                                  }
                                });
                              }}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                fontSize: '13px',
                                border: '1px solid',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                background: isSelected ? 'var(--primary-dark)' : 'white',
                                borderColor: isSelected ? 'var(--primary-dark)' : '#cbd5e0',
                                color: isSelected ? 'white' : '#475569',
                                fontWeight: isSelected ? '600' : '400'
                              }}
                            >
                              {option}
                              {isSelected && <span style={{ marginLeft: '6px' }}>×</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

              <div className="form-section" style={{ marginTop: '24px' }}>
                <div className="form-section-header">
                  <div className="section-icon"><Plus size={14} /></div>
                  <h3>Images & Media</h3>
                </div>

                <div className="form-group" style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    id="isFeatured"
                    checked={productFormData.isFeatured} 
                    onChange={(e) => setProductFormData({...productFormData, isFeatured: e.target.checked})}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isFeatured" style={{ cursor: 'pointer', marginBottom: 0 }}>Featured Product (show on home page)</label>
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>Main Product Image URL</label>
                  <input type="text" value={productFormData.image} onChange={(e) => setProductFormData({...productFormData, image: e.target.value})} placeholder="https://..." />
                </div>

                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label>Additional Product Images</label>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px dashed #e2e8f0' }}>
                    {(productFormData.productImages || []).map((img, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: idx < (productFormData.productImages || []).length - 1 ? '8px' : '0', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          value={img} 
                          onChange={(e) => {
                            const updated = [...(productFormData.productImages || [])];
                            updated[idx] = e.target.value;
                            setProductFormData({...productFormData, productImages: updated});
                          }}
                          placeholder={`Image URL ${idx + 1}`}
                          style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white' }}
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            const updated = (productFormData.productImages || []).filter((_, i) => i !== idx);
                            setProductFormData({...productFormData, productImages: updated});
                          }}
                          style={{ padding: '10px 16px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button"
                      onClick={() => {
                        setProductFormData({...productFormData, productImages: [...(productFormData.productImages || []), '']});
                      }}
                      className="cat-add-btn"
                      style={{ marginTop: '12px', width: '100%', justifyContent: 'center', height: '40px' }}
                    >
                      <Plus size={14} /> Add Another Image
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary submit-btn">{editingProductId ? 'Update Product' : 'Create Product'}</button>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <aside className="admin-sidebar">
        <Link to="/" className="admin-logo" style={{ textDecoration: 'none', display: 'block' }}>
          <span className="beauty">BEAUTY</span> <span className="glowry">GLOWRY</span>
          <p>Admin Control</p>
        </Link>
        <nav className="admin-nav">
          <button className={activeTab === 'dashboard' ? 'active' : ''} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={20} /> Dashboard
          </button>
          {userRole === 'admin' && (
            <button className={activeTab === 'products' ? 'active' : ''} onClick={() => setActiveTab('products')}>
              <Package size={20} /> Products
            </button>
          )}
          <button className={activeTab === 'orders' ? 'active' : ''} onClick={() => setActiveTab('orders')}>
            <ShoppingBag size={20} /> Orders
          </button>
          {userRole === 'admin' && (
            <>
              <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
                <Users size={20} /> Staff & Customers
              </button>
              <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>
                <BarChart3 size={20} /> Analytics
              </button>
              <button className={activeTab === 'marketing' ? 'active' : ''} onClick={() => setActiveTab('marketing')}>
                <Megaphone size={20} /> Marketing
              </button>
              <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>
                <Settings size={20} /> Settings
              </button>
            </>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <header className="admin-header">
          <div className="header-search">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search anything..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="header-user">
            <div className="user-info">
              <span className="user-name">{user?.email?.split('@')[0] || 'Admin User'}</span>
              <span className="user-role">Role: {userRole}</span>
            </div>
            <button className="icon-btn logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={20} />
            </button>
            <div className="user-avatar">{user?.email?.[0].toUpperCase() || 'A'}</div>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <div className="dashboard-content animate-fade">
            <div className="admin-title-row">
              <h1>Welcome Back, {user?.displayName || 'Staff Member'}</h1>
              <p>Here's what's happening with your store today.</p>
            </div>

            <div className="stats-grid">
              {stats.map((stat, idx) => (
                <div key={idx} className="stat-card">
                  <div className="stat-icon" style={{ background: `${stat.color}15`, color: stat.color }}>{stat.icon}</div>
                  <div className="stat-info">
                    <span className="stat-title">{stat.title}</span>
                    <h3 className="stat-value">{stat.value}</h3>
                    <span className="stat-trend"><TrendingUp size={12} /> {stat.trend} this month</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="chart-and-recent">
              <div className="recent-orders">
                <div className="card-header">
                  <h3>Recent Orders</h3>
                  <button className="view-all-btn" onClick={() => setActiveTab('orders')}>View All</button>
                </div>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map(order => {
                      const customerName = order.customer?.name || 'Guest';
                      const orderDate = order.date || new Date(order.createdAt || order.updatedAt || Date.now()).toLocaleDateString();
                      return (
                        <tr key={order.firestoreId || order.id}>
                          <td>#{order.id}</td>
                          <td className="user-cell">
                            <div className="u-avatar">{customerName[0]}</div>
                            <span>{customerName}</span>
                          </td>
                          <td>{storeSettings.currency.split(' ')[0]}{order.total.toLocaleString()}</td>
                          <td><span className={`status-badge ${order.status.toLowerCase()}`}>{order.status}</span></td>
                          <td>{orderDate}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === 'products' ? (
          <div className="products-content animate-fade">
             <div className="admin-title-row">
              <div>
                <h1>Products Catalog</h1>
                <p>Manage your inventory and product listings.</p>
              </div>
            <div className="section-actions">
              <button className="btn btn-secondary" onClick={() => setIsFilterModalOpen(true)} style={{ marginRight: '10px' }}><Filter size={18} /> Manage Filters</button>
              <button className="btn btn-primary" onClick={() => handleOpenProductModal()}><Plus size={18} /> Add New Product</button>
            </div>
            </div>

            <div className="inventory-card">
               <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => (
                      <tr key={product.firestoreId || product.id}>
                        <td className="product-cell">
                          <img src={product.image} alt="" />
                          <div>
                            <span className="p-name">{product.name}</span>
                            <span className="p-sku">SKU: BG-{product.id.toString().slice(-4)}</span>
                          </div>
                        </td>
                        <td>{product.category}</td>
                        <td>{storeSettings.currency.split(' ')[0]}{product.discountPrice}</td>
                        <td>{product.stock} in stock</td>
                        <td><span className="status-badge active">Published</span></td>
                        <td>
                          <div className="table-actions">
                            <button className="icon-btn edit" onClick={() => handleOpenProductModal(product)}><Edit size={16} /></button>
                            <button className="icon-btn delete" onClick={() => deleteProduct(product.firestoreId)}><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </div>
        ) : activeTab === 'orders' ? (
          <div className="orders-content animate-fade">
            <div className="admin-title-row">
              <div>
                <h1>Order Management</h1>
                <p>Advanced order lifecycle, workflow controls, and manual order entry.</p>
              </div>
              <div className="order-header-actions">
                <button className="btn btn-primary" onClick={() => handleOpenOrderModal()}><Plus size={18} /> Add Order</button>
                <button className="btn btn-outline" onClick={handleExportCsv}><FileText size={18} /> Export CSV</button>
              </div>
            </div>

            <div className="order-toolbar">
              <div className="status-tabs" style={{flexWrap: 'wrap'}}>
                {orderTabs.map((tab) => (
                  <React.Fragment key={tab}>
                    <button
                      className={`tab-pill ${orderFilter === tab && !isTodayFilterActive ? 'active' : ''}`}
                      onClick={() => {
                        setOrderFilter(tab);
                        setDateFrom('');
                        setDateTo('');
                      }}
                    >
                      <span>{tab}</span>
                      <span className="tab-count">{statusCounts[tab]}</span>
                    </button>
                    {tab === 'All' && (
                       <button 
                         className={`tab-pill ${isTodayFilterActive ? 'active' : ''}`}
                         onClick={() => {
                           if (isTodayFilterActive) {
                             setDateFrom('');
                             setDateTo('');
                             setOrderFilter('All');
                           } else {
                             setDateFrom(todayDate);
                             setDateTo(todayDate);
                             setOrderFilter('All');
                           }
                         }}
                       >
                         <span>Today's Orders</span>
                         <span className="tab-count">{todayOrdersCount}</span>
                       </button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              <div className="filters-row">
                <input
                  type="text"
                  placeholder="Search orders by ID, name or phone"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
                <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                  <option value="All">All Payments</option>
                  <option value="COD">COD</option>
                  <option value="Online">Online</option>
                </select>
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>

            <div className="bulk-actions-card">
              <div>
                <span>{selectedOrderIds.length} order(s) selected</span>
              </div>
            </div>

            <div className="inventory-card admin-order-table-card">
              <div className="order-table-container">
                <table className="admin-table order-table">
                  <thead>
                    <tr>
                      <th className="checkbox-col"><input type="checkbox" checked={selectedAll} onChange={toggleSelectAll} /></th>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Order Summary</th>
                      <th>Delivery</th>
                      <th title="Grand Total (Products + Shipping - Discount)">Total Value</th>
                      <th>Status</th>
                      <th>Date & Time</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.length ? filteredOrders.map((order) => (
                      <tr key={order.firestoreId || order.id}>
                        <td className="checkbox-col"><input type="checkbox" checked={selectedOrderIds.includes(order.firestoreId)} onChange={() => toggleSelectOrder(order.firestoreId)} /></td>
                        <td>#{order.id}</td>
                        <td className="user-cell">
                          <div className="u-avatar">{order.customer.name[0]}</div>
                          <div>
                            <span className="p-name">{order.customer.name}</span>
                            <a href={`tel:${order.customer.phone}`} className="phone-order"><PhoneIcon size={12} /> {order.customer.phone}</a>
                          </div>
                        </td>
                        <td>
                          <div className="order-items-cell">
                            {order.products.map((item) => (
                              <span key={`${order.id}-${item.productId}`} className="p-badge">{item.name} ×{item.quantity}</span>
                            ))}
                          </div>
                        </td>
                        <td>
                          <div className="address-cell" title={order.deliveryAddress}>
                            {order.deliveryAddress || (order.deliveryZone === 'dhaka' ? 'Inside Dhaka' : 'Outside Dhaka')}
                          </div>
                          {order.notes?.internal && (
                            <div className="admin-note-display" style={{ 
                              fontSize: '10px', 
                              color: '#666', 
                              marginTop: '4px',
                              background: '#f0f7ff',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              borderLeft: '3px solid #2196F3',
                              fontStyle: 'italic',
                              maxWidth: '180px'
                            }}>
                              <span style={{ fontWeight: '700', fontSize: '9px', display: 'block', marginBottom: '1px' }}>ADMIN NOTE:</span>
                              {order.notes.internal}
                            </div>
                          )}
                        </td>
                        <td className="fw-800" title={`Subtotal: ৳${order.subtotal}\nDelivery: ৳${order.deliveryCharge}\nDiscount: -৳${order.discount || 0}`}>
                          {storeSettings.currency.split(' ')[0]}{order.total.toLocaleString()}
                        </td>
                        <td>
                          <select 
                            className={`status-select ${statusClasses(order.status)}`}
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.firestoreId, e.target.value, userRole)}
                          >
                            {orderTabs.slice(1).map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span>{parseOrderDate(order, true).toLocaleDateString()}</span>
                            <span style={{ fontSize: '11px', color: '#666', fontWeight: '500' }}>{parseOrderDate(order, true).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td className="actions-cell">
                          <button className="icon-btn" onClick={() => window.open(`/invoice/${order.firestoreId}`, '_blank')} title="Print Invoice"><FileText size={16} /></button>
                          <button className="icon-btn edit" onClick={() => handleOpenOrderModal(order)} title="View / Edit Order"><Edit size={16} /></button>
                          <button className="icon-btn delete" onClick={() => deleteOrder(order.firestoreId)} title="Delete Order"><Trash2 size={16} /></button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="9" className="empty-state">No orders match the current filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>


          </div>
        ) : activeTab === 'users' ? (
           <div className="customers-content animate-fade">
              <div className="admin-title-row">
                <div>
                  <h1>Staff & Customers</h1>
                  <p>View staff activity, online status, and system users.</p>
                </div>
              </div>

              <div className="inventory-card" style={{marginBottom: '24px'}}>
                 <div className="card-header">
                    <h3 style={{fontSize: '16px', margin: 0}}>Invite Staff</h3>
                 </div>
                 <div style={{padding: '24px'}}>
                   <form style={{display: 'flex', gap: '15px', alignItems: 'flex-end', maxWidth: '800px'}} onSubmit={handleSendInvite}>
                      <div className="form-group" style={{flex: 2, minWidth: '250px'}}>
                         <label style={{whiteSpace: 'nowrap'}}>Email Address</label>
                         <input 
                           type="email" 
                           placeholder="staff@beautyglowry.com" 
                           value={inviteEmail}
                           onChange={(e) => setInviteEmail(e.target.value)}
                           required
                         />
                      </div>
                      <div className="form-group" style={{flex: 1, minWidth: '120px'}}>
                         <label>Role</label>
                         <select 
                            value={inviteRole} 
                            onChange={(e) => setInviteRole(e.target.value)}
                         >
                           <option value="staff">Staff</option>
                           <option value="admin">Admin</option>
                         </select>
                      </div>
                      <button type="submit" className="btn btn-primary" style={{height: '46px', padding: '0 24px', flexShrink: 0}}>Send Invite</button>
                   </form>

                   {invitesList.length > 0 && (
                     <div style={{marginTop: '30px', paddingTop: '20px', borderTop: '1px solid var(--border)'}}>
                       <h4 style={{marginBottom: '10px', fontSize: '14px', color: '#666'}}>Pending Invites</h4>
                     <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                       {invitesList.map((invite) => (
                         <li key={invite.email} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f5f5f5', borderRadius: '6px', marginBottom: '8px'}}>
                           <div>
                             <span style={{fontWeight: 600}}>{invite.email}</span> - <span style={{textTransform: 'capitalize', color: '#666', fontSize: '13px'}}>{invite.role}</span>
                           </div>
                           <button className="btn" style={{background: '#ffcdd2', color: '#c62828', padding: '6px 12px', fontSize: '12px'}} onClick={() => handleDeleteInvite(invite.email)}>Revoke</button>
                         </li>
                       ))}
                     </ul>
                   </div>
                 )}
                 </div>
              </div>

              <div className="inventory-card">
                 <div className="card-header">
                    <h3 style={{fontSize: '16px', margin: 0}}>System Users</h3>
                 </div>
                 <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Last Active</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usersList.length > 0 ? usersList.map((userDoc) => {
                        const isOnline = userDoc.isOnline;
                        const lastActive = userDoc.lastActive?.toDate 
                          ? userDoc.lastActive.toDate().toLocaleString() 
                          : 'Unknown';
                          
                        return (
                          <tr key={userDoc.uid}>
                            <td className="user-cell">
                              <div className="u-avatar" style={{background: 'var(--primary-light)', color: 'var(--primary-dark)'}}>
                                {(userDoc.displayName || userDoc.name || userDoc.email || 'U')[0].toUpperCase()}
                              </div>
                              <div style={{display: 'flex', flexDirection: 'column'}}>
                                <span style={{fontWeight: '700', fontSize: '14px'}}>{userDoc.displayName || userDoc.name || 'Staff Member'}</span>
                                <span style={{fontSize: '11px', color: '#666'}}>{userDoc.email || 'No Email Provided'}</span>
                              </div>
                            </td>
                            <td>
                              <span style={{
                                padding: '4px 8px', 
                                background: userDoc.role === 'admin' ? '#ffebee' : '#e3f2fd',
                                color: userDoc.role === 'admin' ? '#c62828' : '#1565c0',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                textTransform: 'capitalize'
                              }}>
                                {userDoc.role || 'staff'}
                              </span>
                            </td>
                            <td>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                color: isOnline ? '#2e7d32' : '#757575',
                                fontWeight: '600',
                                fontSize: '13px'
                              }}>
                                <span style={{
                                  width: '8px', 
                                  height: '8px', 
                                  background: isOnline ? '#4caf50' : '#9e9e9e', 
                                  borderRadius: '50%',
                                  boxShadow: isOnline ? '0 0 4px #4caf50' : 'none'
                                }}></span>
                                {isOnline ? 'Online' : 'Offline'}
                              </span>
                            </td>
                            <td style={{fontSize: '13px', color: '#666'}}>{isOnline ? 'Currently Active' : lastActive}</td>
                            <td>
                                 {/* Only show delete if NOT an admin OR if current user IS an admin */}
                                 {(userDoc.role !== 'admin' || userRole === 'admin') && userDoc.uid !== user?.uid && (
                                   <button 
                                     className="btn-icon" 
                                     style={{
                                       background: '#fee2e2', 
                                       color: '#ef4444', 
                                       padding: '6px', 
                                       borderRadius: '6px',
                                       display: 'flex',
                                       alignItems: 'center',
                                       justifyContent: 'center',
                                       border: 'none',
                                       cursor: 'pointer',
                                       transition: 'all 0.2s'
                                     }} 
                                     title="Delete User"
                                     onClick={() => handleDeleteUser(userDoc.uid, userDoc.email, userDoc.role)}
                                   >
                                     <Trash2 size={16} />
                                   </button>
                                 )}
                             </td>
                          </tr>
                        );
                      }) : (
                        <tr>
                          <td colSpan="5" style={{textAlign: 'center', padding: '30px'}}>Loading staff and users...</td>
                        </tr>
                      )}
                    </tbody>
                 </table>
              </div>
           </div>
        ) : activeTab === 'analytics' ? (
          <div className="analytics-content animate-fade">
             <div className="admin-title-row">
                <h1>Store Analytics</h1>
             </div>
             <div className="analytics-grid">
                <div className="chart-box">
                   <h4>Sales Revenue (Last 6 Months)</h4>
                   <div className="bar-chart">
                      {analyticsData.last6Months.map((item, i) => (
                        <div key={i} className="bar-wrap">
                          <div className="bar-value">৳{item.revenue.toLocaleString()}</div>
                          <div className="bar" style={{height: `${(item.revenue / analyticsData.maxRevenue) * 100}%`}}></div>
                          <span>{item.monthName}</span>
                        </div>
                      ))}
                   </div>
                </div>
                <div className="chart-box">
                   <h4>Order Status Breakdown</h4>
                   <div className="pie-container">
                      <div className="pie-mock" style={{ background: analyticsData.conicGradient }}></div>
                      <div className="pie-legend">
                         {analyticsData.breakdown.length > 0 ? analyticsData.breakdown.map((item, i) => (
                           <div key={i}><span className="dot" style={{ background: item.color }}></span> {item.status} ({item.percent}%)</div>
                         )) : (
                           <div style={{ color: '#94a3b8', fontSize: '14px' }}>No order data available yet.</div>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          </div>

        ) : activeTab === 'marketing' ? (
          <div className="tab-pane animate-fade">
             <div className="admin-title-row">
                <h1>Marketing & Campaigns</h1>
                <button onClick={handleSaveMarketing} className="btn btn-primary" disabled={isUpdatingMarketing}>
                  {isUpdatingMarketing ? 'Saving...' : 'Save Changes'}
                </button>
             </div>
             
             <div className="marketing-card">
               <h3><Megaphone size={18} /> Announcement Desk</h3>
               <p style={{fontSize:'12px', color:'var(--text-muted)', marginBottom:'20px'}}>
                 Manage the scrolling ticker. Add multiple messages to inform customers about new arrivals, sales, or updates.
               </p>
               
               <div className="announcements-desk">
                 {(marketingForm.announcements || []).map((text, index) => (
                   <div key={index} className="news-entry-card animate-fade">
                     <div style={{ background: 'var(--primary-dark)', color: 'white', minWidth: '24px', height: '24px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800' }}>
                       {index + 1}
                     </div>
                     <input 
                       type="text" 
                       value={text} 
                       style={{ background: 'transparent', border: 'none', padding: 0 }}
                       onChange={e => {
                         const newAnnouncements = [...marketingForm.announcements];
                         newAnnouncements[index] = e.target.value;
                         setMarketingForm({...marketingForm, announcements: newAnnouncements});
                       }}
                       placeholder="Type news message here..." 
                     />
                     <button 
                       className="icon-btn delete" 
                       style={{ border: 'none', background: 'transparent' }}
                       onClick={() => {
                         const newAnnouncements = marketingForm.announcements.filter((_, i) => i !== index);
                         setMarketingForm({...marketingForm, announcements: newAnnouncements});
                       }}
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                 ))}
                 
                 <button 
                   className="btn btn-secondary" 
                   style={{ 
                     width: '100%', 
                     padding: '14px', 
                     borderRadius: '16px', 
                     fontSize: '13px', 
                     fontWeight: '700',
                     border: '2px dashed var(--border)',
                     background: 'white',
                     color: 'var(--text-main)',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     gap: '8px'
                   }}
                   onClick={() => setMarketingForm({
                     ...marketingForm, 
                     announcements: [...(marketingForm.announcements || []), '']
                   })}
                 >
                   <Plus size={16} /> Add New Announcement
                 </button>
               </div>
               
               <div className="form-group" style={{flexDirection:'row', gap:'10px', marginTop:'20px'}}>
                 <input 
                   type="checkbox" 
                   style={{width:'auto', cursor:'pointer'}}
                   checked={marketingForm.showAnnouncement}
                   onChange={e => setMarketingForm({...marketingForm, showAnnouncement: e.target.checked})}
                 />
                 <label style={{margin:0, cursor:'pointer', fontSize: '13px', fontWeight: '600'}}>Show Announcement on Website</label>
               </div>
            </div>

            <div className="marketing-card">
               <h3><Timer size={18} /> Flash Sale Campaign</h3>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginTop: '16px' }}>
                 <div className="form-group">
                   <label>Campaign Title</label>
                   <input 
                     type="text" 
                     value={marketingForm.flashSaleTitle} 
                     onChange={e => setMarketingForm({...marketingForm, flashSaleTitle: e.target.value})}
                     placeholder="e.g. MEGA SUMMER SALE" 
                   />
                 </div>
                 <div className="form-group">
                   <label>Ends At (Countdown Date)</label>
                   <input 
                     type="datetime-local" 
                     value={marketingForm.flashSaleEndsAt} 
                     onChange={e => setMarketingForm({...marketingForm, flashSaleEndsAt: e.target.value})}
                   />
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700' }}>Activate Campaign</span>
                    <input 
                      type="checkbox" 
                      style={{ width: '40px', height: '20px', cursor: 'pointer' }}
                      checked={marketingForm.showFlashSale}
                      onChange={e => setMarketingForm({...marketingForm, showFlashSale: e.target.checked})}
                    />
                 </div>
               </div>

               <div className="sale-live-preview animate-fade" style={{ opacity: marketingForm.showFlashSale ? 1 : 0.5 }}>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>Live Website Preview</span>
                  <h4 style={{ margin: '8px 0', fontSize: '18px', fontWeight: '800' }}>{marketingForm.flashSaleTitle || 'Your Sale Title Here'}</h4>
                  <div className="preview-timer">
                     <div style={{ display: 'flex', gap: '8px' }}>
                       <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }}>00<span style={{ fontSize: '10px' }}>h</span></div>
                       <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }}>00<span style={{ fontSize: '10px' }}>m</span></div>
                       <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px' }}>00<span style={{ fontSize: '10px' }}>s</span></div>
                     </div>
                  </div>
                  <p style={{ fontSize: '11px', marginTop: '10px', color: 'rgba(255,255,255,0.7)' }}>
                    {marketingForm.showFlashSale ? 'Currently Live on Frontend' : 'Campaign Inactive'}
                  </p>
               </div>
            </div>

            <div className="marketing-card products-selection" style={{ gridColumn: '1 / -1' }}>
               <h3><ShoppingBag size={18} /> Offer Product Curator</h3>
               <p style={{fontSize:'12px', color:'var(--text-muted)', margin:'10px 0 32px'}}>
                 Select products from your catalog to showcase in the special Offers page. Set custom deal prices for each.
               </p>
               
               <div className="offer-products-manager">
                 <div className="picker-column">
                    <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>Available Catalog</h4>
                    <div className="picker-list">
                      {products.filter(p => !p.publishedSections?.includes('Offers')).map(p => (
                         <div key={p.firestoreId} className="picker-item animate-fade">
                            <img src={p.image || '/placeholder-product.png'} alt={p.name} className="product-thumb" />
                            <div style={{ flex: 1, minWidth: 0 }}>
                               <div style={{ fontWeight: '700', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                               <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>৳{p.price}</div>
                            </div>
                            <button 
                              onClick={() => updateProduct(p.firestoreId, { publishedSections: [...(p.publishedSections || []), 'Offers'] })} 
                              className="icon-btn" 
                              style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', border: 'none' }}
                              title="Add to Offers"
                            >
                              <Plus size={16} />
                            </button>
                         </div>
                      ))}
                    </div>
                 </div>

                 <div className="picker-column">
                    <h4 style={{ fontSize: '14px', fontWeight: '800', marginBottom: '8px' }}>Active Special Offers</h4>
                    <div className="deals-grid">
                      {products.filter(p => p.publishedSections?.includes('Offers')).map(p => {
                         const savings = p.price - (p.discountPrice || p.price);
                         const percent = Math.round((savings / p.price) * 100);
                         
                         return (
                           <div key={p.firestoreId} className="deal-card animate-fade">
                              <div className="deal-badge">SAVE {percent}%</div>
                              <div className="trash-overlay">
                                 <button 
                                   onClick={() => updateProduct(p.firestoreId, { publishedSections: (p.publishedSections || []).filter(s => s !== 'Offers') })} 
                                   className="icon-btn delete" 
                                   style={{ width: '24px', height: '24px', background: 'rgba(239, 68, 68, 0.1)', border: 'none' }}
                                 >
                                   <Trash2 size={12} />
                                 </button>
                              </div>
                              <img src={p.image || '/placeholder-product.png'} alt={p.name} style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '12px', marginBottom: '12px' }} />
                              <div style={{ fontWeight: '800', fontSize: '14px', marginBottom: '4px' }}>{p.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>৳{p.price}</div>
                              
                              <div className="deal-price-entry">
                                 <label style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: '800', color: 'var(--primary-dark)', display: 'block', marginBottom: '4px' }}>Deal Price</label>
                                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontWeight: '700' }}>৳</span>
                                    <input 
                                     type="number" 
                                     defaultValue={p.discountPrice} 
                                     onBlur={(e) => updateProduct(p.firestoreId, { discountPrice: Number(e.target.value) })}
                                     style={{ padding: '6px 10px', fontSize: '14px' }}
                                    />
                                 </div>
                              </div>
                           </div>
                         );
                      })}
                    </div>
                 </div>
               </div>
            </div>

            <div className="marketing-card coupons-section" style={{ gridColumn: '1 / -1' }}>
               <h3><Plus size={18} /> Digital Coupon Center</h3>
               <p style={{fontSize:'12px', color:'var(--text-muted)', margin:'10px 0 32px'}}>
                 Generate and manage discount codes. Active coupons can be used by customers at checkout.
               </p>
               
               <div className="coupon-manager-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
                 <div className="add-coupon-form" style={{ background: '#f8fafc', padding: '24px', borderRadius: '20px', border: '1px solid var(--border)', alignSelf: 'start' }}>
                    <h4 style={{ marginBottom: '20px', fontSize: '15px', fontWeight: '800' }}>Create New Code</h4>
                    <div className="form-group" style={{ marginBottom: '16px' }}>
                       <label>Coupon Code</label>
                       <input 
                         type="text" 
                         placeholder="e.g. WELCOME10" 
                         style={{ background: 'white', border: '1px solid #e2e8f0' }}
                         value={newCouponCode}
                         onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                       />
                    </div>
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                       <label>Discount Amount (%)</label>
                       <input 
                         type="number" 
                         placeholder="10" 
                         style={{ background: 'white', border: '1px solid #e2e8f0' }}
                         value={newCouponPercent}
                         onChange={(e) => setNewCouponPercent(e.target.value)}
                       />
                    </div>
                    <button onClick={handleAddCoupon} className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                       Generate Coupon
                    </button>
                 </div>

                 <div className="active-coupons-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '8px' }}>Active Coupons</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                      {marketingForm.coupons?.length > 0 ? (
                        marketingForm.coupons.map((coupon) => (
                          <div key={coupon.id} className="coupon-ticket animate-fade">
                             <div className="ticket-info">
                                <div className="ticket-code">{coupon.code}</div>
                                <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                   <span style={{ color: 'var(--primary-dark)', fontWeight: '800' }}>{coupon.percentage}% DISCOUNT</span>
                                </div>
                             </div>
                             <button onClick={() => handleRemoveCoupon(coupon.id)} className="icon-btn delete" style={{ background: 'transparent', border: 'none' }}>
                               <Trash2 size={18} />
                             </button>
                          </div>
                        ))
                      ) : (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '20px', border: '2px dashed #e2e8f0', color: '#94a3b8', fontSize: '14px' }}>
                          No active coupons found. Create your first one to the left.
                        </div>
                      )}
                    </div>
                 </div>
               </div>
            </div>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="settings-content animate-fade">
             <div className="admin-title-row">
                <h1>Store Settings</h1>
                <button 
                  onClick={handleSaveStoreSettings} 
                  className="btn btn-primary" 
                  style={{paddingLeft:'30px', paddingRight:'30px'}}
                  disabled={isSavingSettings}
                >
                  {isSavingSettings ? 'Saving...' : 'Save All Store Settings'}
                </button>
             </div>
             
             <div className="settings-grid">
               <div className="settings-card">
                  <h3><Globe size={18} /> General Information</h3>
                  <div className="form-group" style={{marginTop: '16px'}}>
                     <label>Store Name</label>
                     <input type="text" value={storeSettings.storeName} onChange={(e) => setStoreSettings({...storeSettings, storeName: e.target.value})} />
                  </div>
                  <div className="form-group" style={{marginTop: '12px'}}>
                     <label>Store Tagline / Description</label>
                     <textarea 
                        value={storeSettings.storeTagline} 
                        onChange={(e) => setStoreSettings({...storeSettings, storeTagline: e.target.value})}
                        style={{width:'100%', padding:'12px', borderRadius:'10px', border:'1px solid var(--border)', minHeight:'80px'}}
                        placeholder="Premium beauty products for your glowing skin"
                     />
                  </div>
                  <div className="form-row" style={{marginTop: '12px'}}>
                     <div className="form-group">
                        <label>Store Email</label>
                        <input type="email" value={storeSettings.storeEmail} onChange={(e) => setStoreSettings({...storeSettings, storeEmail: e.target.value})} />
                     </div>
                     <div className="form-group">
                        <label>Contact Phone</label>
                        <input type="tel" value={storeSettings.storePhone} onChange={(e) => setStoreSettings({...storeSettings, storePhone: e.target.value})} />
                     </div>
                  </div>
                  <div className="form-group" style={{marginTop: '12px'}}>
                     <label><MapPin size={14} /> Store Address / Location</label>
                     <input type="text" value={storeSettings.storeAddress} onChange={(e) => setStoreSettings({...storeSettings, storeAddress: e.target.value})} placeholder="Gulshan, Dhaka, Bangladesh" />
                  </div>
               </div>

               <div className="settings-card">
                  <h3><DollarSign size={18} /> Delivery & Currency</h3>
                  <div className="form-group" style={{marginTop: '16px'}}>
                     <label>Currency Symbol</label>
                     <input type="text" value={storeSettings.currency} onChange={(e) => setStoreSettings({...storeSettings, currency: e.target.value})} />
                  </div>
                  <div className="form-row" style={{marginTop: '12px'}}>
                     <div className="form-group">
                        <label>Delivery (Inside Dhaka)</label>
                        <input type="number" value={storeSettings.deliveryDhaka} onChange={(e) => setStoreSettings({...storeSettings, deliveryDhaka: e.target.value})} />
                     </div>
                     <div className="form-group">
                        <label>Delivery (Outside Dhaka)</label>
                        <input type="number" value={storeSettings.deliveryOutside} onChange={(e) => setStoreSettings({...storeSettings, deliveryOutside: e.target.value})} />
                     </div>
                  </div>
                  <div className="form-group" style={{marginTop: '12px'}}>
                     <label>Free Delivery Threshold (Orders over this amount get free shipping)</label>
                     <input type="number" value={storeSettings.freeShippingThreshold} onChange={(e) => setStoreSettings({...storeSettings, freeShippingThreshold: e.target.value})} />
                  </div>
               </div>

               <div className="settings-card">
                  <h3><Hash size={18} /> Social Media Links</h3>
                  <div className="form-group" style={{marginTop: '16px'}}>
                     <label><Facebook size={14} /> Facebook Page URL</label>
                     <input type="url" value={storeSettings.facebook} onChange={(e) => setStoreSettings({...storeSettings, facebook: e.target.value})} placeholder="https://facebook.com/..." />
                  </div>
                  <div className="form-group" style={{marginTop: '12px'}}>
                     <label><Instagram size={14} /> Instagram Profile URL</label>
                     <input type="url" value={storeSettings.instagram} onChange={(e) => setStoreSettings({...storeSettings, instagram: e.target.value})} placeholder="https://instagram.com/..." />
                  </div>
                  <div className="form-group" style={{marginTop: '12px'}}>
                      <label><Music2 size={14} /> TikTok Profile URL</label>
                      <input type="url" value={storeSettings.tiktok} onChange={(e) => setStoreSettings({...storeSettings, tiktok: e.target.value})} placeholder="https://tiktok.com/@..." />
                   </div>
                </div>

                <div className="settings-card">
                   <h3><Info size={18} /> Customer Support Links</h3>
                   <p style={{fontSize:'12px', color:'var(--text-muted)', marginBottom:'16px'}}>
                      Paste the internal paths or external URLs for your support pages.
                   </p>
                   <div className="form-group">
                      <label>Contact Us</label>
                      <input type="text" value={storeSettings.contactLink} onChange={(e) => setStoreSettings({...storeSettings, contactLink: e.target.value})} />
                   </div>
                   <div className="form-group" style={{marginTop: '12px'}}>
                      <label>Track Order</label>
                      <input type="text" value={storeSettings.trackLink} onChange={(e) => setStoreSettings({...storeSettings, trackLink: e.target.value})} />
                   </div>
                   <div className="form-group" style={{marginTop: '12px'}}>
                      <label>Shipping Policy</label>
                      <input type="text" value={storeSettings.shippingLink} onChange={(e) => setStoreSettings({...storeSettings, shippingLink: e.target.value})} />
                   </div>
                   <div className="form-group" style={{marginTop: '12px'}}>
                      <label>Return & Refund</label>
                      <input type="text" value={storeSettings.returnsLink} onChange={(e) => setStoreSettings({...storeSettings, returnsLink: e.target.value})} />
                   </div>
                   <div className="form-group" style={{marginTop: '12px'}}>
                      <label>FAQs Link</label>
                      <input type="text" value={storeSettings.faqLink} onChange={(e) => setStoreSettings({...storeSettings, faqLink: e.target.value})} />
                   </div>
                   <div className="form-group" style={{marginTop: '12px'}}>
                      <label>Privacy Policy Link</label>
                      <input type="text" value={storeSettings.privacyLink} onChange={(e) => setStoreSettings({...storeSettings, privacyLink: e.target.value})} />
                   </div>
                   <div className="form-group" style={{marginTop: '12px'}}>
                      <label>Terms of Service Link</label>
                      <input type="text" value={storeSettings.termsLink} onChange={(e) => setStoreSettings({...storeSettings, termsLink: e.target.value})} />
                   </div>
                </div>

                <div className="settings-card">
                   <h3><FileText size={18} /> Page Content & Policies</h3>
                   <p style={{fontSize:'12px', color:'var(--text-muted)', marginBottom:'16px'}}>
                      Write the content for your support pages below. Use simple text; line breaks will be preserved.
                   </p>
                   
                   <div className="form-group">
                      <label>Contact Us Content</label>
                      <textarea 
                        value={storeSettings.contactContent} 
                        onChange={(e) => setStoreSettings({...storeSettings, contactContent: e.target.value})}
                        style={{minHeight:'150px', width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid var(--border)', marginTop:'8px', fontFamily:'inherit'}}
                        placeholder="Write your contact page information here..."
                      />
                   </div>

                   <div className="form-group" style={{marginTop:'20px'}}>
                      <label>Track Order Content</label>
                      <textarea 
                        value={storeSettings.trackContent} 
                        onChange={(e) => setStoreSettings({...storeSettings, trackContent: e.target.value})}
                        style={{minHeight:'150px', width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid var(--border)', marginTop:'8px', fontFamily:'inherit'}}
                        placeholder="Instructions for tracking orders..."
                      />
                   </div>

                   <div className="form-group" style={{marginTop:'20px'}}>
                      <label>Shipping Policy Content</label>
                      <textarea 
                        value={storeSettings.shippingContent} 
                        onChange={(e) => setStoreSettings({...storeSettings, shippingContent: e.target.value})}
                        style={{minHeight:'200px', width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid var(--border)', marginTop:'8px', fontFamily:'inherit'}}
                        placeholder="Detail your shipping policies, zones, and timing..."
                      />
                   </div>

                   <div className="form-group" style={{marginTop:'20px'}}>
                      <label>Return & Refund Content</label>
                      <textarea 
                        value={storeSettings.returnsContent} 
                        onChange={(e) => setStoreSettings({...storeSettings, returnsContent: e.target.value})}
                        style={{minHeight:'200px', width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid var(--border)', marginTop:'8px', fontFamily:'inherit'}}
                        placeholder="Explain your return and refund procedures..."
                      />
                   </div>

                   <div className="form-group" style={{marginTop:'20px'}}>
                      <label>FAQs Content</label>
                      <textarea 
                        value={storeSettings.faqContent} 
                        onChange={(e) => setStoreSettings({...storeSettings, faqContent: e.target.value})}
                        style={{minHeight:'250px', width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid var(--border)', marginTop:'8px', fontFamily:'inherit'}}
                        placeholder="Common questions and answers..."
                      />
                   </div>

                   <div className="form-group" style={{marginTop:'20px'}}>
                      <label>Privacy Policy Content</label>
                      <textarea 
                        value={storeSettings.privacyContent} 
                        onChange={(e) => setStoreSettings({...storeSettings, privacyContent: e.target.value})}
                        style={{minHeight:'250px', width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid var(--border)', marginTop:'8px', fontFamily:'inherit'}}
                        placeholder="Detail your privacy policy and data protection..."
                      />
                   </div>

                   <div className="form-group" style={{marginTop:'20px'}}>
                      <label>Terms of Service Content</label>
                      <textarea 
                        value={storeSettings.termsContent} 
                        onChange={(e) => setStoreSettings({...storeSettings, termsContent: e.target.value})}
                        style={{minHeight:'250px', width:'100%', padding:'12px', borderRadius:'8px', border:'1px solid var(--border)', marginTop:'8px', fontFamily:'inherit'}}
                        placeholder="Define your terms of service and user agreements..."
                      />
                   </div>
                </div>
             </div>
             
           </div>
        ) : null}
      </main>


      <style dangerouslySetInnerHTML={{ __html: `
        .admin-dashboard { display: flex; min-height: 100vh; background: #F8F9FA; font-family: 'Inter', sans-serif; }

        .admin-sidebar { width: 280px; background: white; border-right: 1px solid var(--border); padding: 32px 24px; position: sticky; top: 0; height: 100vh; overflow-y: auto; }
        
        @media (max-width: 1024px) { .admin-sidebar { width: 200px; padding: 20px 16px; } }
        @media (max-width: 768px) { .admin-sidebar { width: 100%; height: auto; position: relative; border-right: none; border-bottom: 1px solid var(--border); padding: 16px; } }
        .admin-logo { margin-bottom: 48px; }
        .admin-logo span { font-size: 20px; font-weight: 800; }
        .admin-logo .beauty { color: var(--text-main); }
        .admin-logo .glowry { color: var(--primary-dark); }
        .admin-logo p { font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px; margin-top: 4px; font-weight: 700; }

        .admin-nav { display: flex; flex-direction: column; gap: 8px; }
        .admin-nav button { display: flex; align-items: center; gap: 16px; padding: 14px 20px; border-radius: 12px; font-weight: 600; color: var(--text-muted); font-size: 15px; width: 100%; transition: var(--transition); }
        .admin-nav button.active { background: var(--primary-light); color: var(--primary-dark); }
        .admin-nav button:hover:not(.active) { background: #f0f0f0; color: var(--text-main); }

        .admin-main { flex: 1; padding: 16px 20px; overflow-y: auto; max-height: 100vh; }
        @media (max-width: 1024px) { .admin-main { padding: 14px 16px; } }
        @media (max-width: 768px) { .admin-main { padding: 10px 12px; } }
        
        .admin-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; background: white; padding: 12px 20px; border-radius: 12px; border: 1px solid var(--border); flex-wrap: wrap; gap: 12px; }
        .header-search { display: flex; align-items: center; gap: 12px; background: #f0f0f0; padding: 8px 16px; border-radius: 10px; width: 350px; }
        @media (max-width: 768px) { .header-search { width: 100%; flex: 1; min-width: 200px; } }
        @media (max-width: 480px) { .header-search { width: 100%; } }
        .header-search input { border: none; background: transparent; width: 100%; font-size: 14px; }
        .header-user { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        @media (max-width: 768px) { .header-user { gap: 12px; } }
        .user-info { text-align: right; }
        .user-name { display: block; font-weight: 700; font-size: 14px; }
        .user-role { font-size: 12px; color: var(--text-muted); }
        .user-avatar { width: 40px; height: 40px; background: var(--primary-dark); color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; }

        .admin-title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; flex-wrap: wrap; gap: 10px; }
        .admin-title-row h1 { font-size: 22px; font-weight: 800; }
        .admin-title-row p { color: var(--text-muted); margin-top: 2px; font-size: 12px; }
        @media (max-width: 768px) { .admin-title-row { flex-direction: column; } .admin-title-row h1 { font-size: 18px; } }

        .order-header-actions { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
        @media (max-width: 768px) { .order-header-actions { width: 100%; } .order-header-actions button { flex: 1; min-width: 150px; } }

        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 12px; }
        @media (max-width: 1024px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px) { .stats-grid { grid-template-columns: 1fr; } }
        .stat-card { background: white; padding: 14px; border-radius: 12px; border: 1px solid var(--border); display: flex; align-items: flex-start; gap: 12px; }
        .stat-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
        .stat-title { font-size: 10px; color: var(--text-muted); font-weight: 600; }
        .stat-value { font-size: 16px; font-weight: 800; margin: 2px 0; }
        .stat-trend { font-size: 10px; font-weight: 700; color: #4CAF50; display: flex; align-items: center; gap: 2px; }

        .inventory-card, .recent-orders { background: white; border-radius: 20px; border: 1px solid var(--border); overflow: hidden; display: flex; flex-direction: column; }
        .card-header { padding: 12px 16px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; font-size: 12px; }
        .view-all-btn { color: var(--primary-dark); font-weight: 700; font-size: 14px; }

        .admin-table { width: 100%; border-collapse: collapse; text-align: left; }
        .admin-table th { padding: 10px 14px; font-size: 11px; font-weight: 700; color: var(--text-muted); border-bottom: 1px solid var(--border); background: #fcfcfc; }
        .admin-table td { padding: 10px 14px; font-size: 12px; border-bottom: 1px solid #f8f8f8; font-weight: 500; }
        @media (max-width: 768px) { .admin-table th { padding: 8px 10px; font-size: 10px; } .admin-table td { padding: 8px 10px; font-size: 11px; } }
        
        .product-cell { display: flex; align-items: center; gap: 16px; }
        .product-cell img { width: 44px; height: 44px; border-radius: 8px; object-fit: cover; }
        .p-sku { display: block; font-size: 12px; color: var(--text-muted); }
        
        .user-cell { display: flex; align-items: center; gap: 12px; }
        .u-avatar { width: 32px; height: 32px; border-radius: 50%; background: #eee; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
        
        .status-badge { padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; }
        .status-badge.active, .status-badge.processing { background: #E3F2FD; color: #1565C0; }
        .status-badge.pending { background: #FFF3E0; color: #EF6C00; }
        .status-badge.on-hold { background: #FFF4E5; color: #D97706; }
        .status-badge.shipped { background: #E3F2FD; color: #1565C0; }

        .settings-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        @media (max-width: 1024px) { .settings-grid { grid-template-columns: 1fr; } }
        .settings-card { background: white; padding: 24px; border-radius: 16px; border: 1px solid var(--border); box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .settings-card h3 { font-size: 16px; font-weight: 700; display: flex; align-items: center; gap: 10px; color: var(--text-main); margin-bottom: 4px; }
        .logo-preview-box { background-image: radial-gradient(var(--border) 1px, transparent 1px); background-size: 10px 10px; }
        .btn-sm { padding: 8px 16px; font-size: 13px; border-radius: 8px; }
        .btn-lg { padding: 14px 28px; font-size: 16px; border-radius: 12px; }
        .status-badge.returned { background: #F3E5F5; color: #6A1B9A; }

        /* Premium Notification */
        .premium-notify-wrapper {
          position: fixed;
          top: 30px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          pointer-events: none;
        }
        .premium-notify {
          background: rgba(15, 23, 42, 0.9);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          color: white;
          padding: 16px 24px;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          animation: notifySlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1), notifyFadeOut 0.4s 2.6s forwards;
          max-width: 400px;
          pointer-events: auto;
        }
        .premium-notify.error {
          border-left: 4px solid #ef4444;
        }
        .premium-notify.success {
          border-left: 4px solid #10b981;
        }
        .premium-notify.warning {
          border-left: 4px solid #f59e0b;
        }
        .notify-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .notify-message {
          font-size: 14px;
          font-weight: 500;
          line-height: 1.4;
        }
        @keyframes notifySlideIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes notifyFadeOut {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to { opacity: 0; transform: translateY(-10px) scale(0.95); }
        }

        .btn-outline { border: 1px solid var(--border); background: white; color: var(--text-main); }
        .btn-outline:hover { background: var(--secondary); }

        .table-actions { display: flex; gap: 8px; }
        .icon-btn { width: 28px; height: 28px; border-radius: 6px; border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; transition: var(--transition); color: var(--text-muted); font-size: 12px; }
        .icon-btn.delete:hover { border-color: #EF5350; color: #EF5350; background: #FFEBEE; }

        /* Modal Styles */
        .admin-modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
        .admin-modal { background: white; padding: 32px; border-radius: 12px; width: 550px; max-width: 90vw; max-height: 95vh; overflow-y: auto; overflow-x: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1); }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
        .modal-header h2 { font-size: 18px; color: #1e293b; font-weight: 800; }
        .close-btn { color: #94a3b8; transition: color 0.2s; }
        .close-btn:hover { color: #1e293b; }
        
        .admin-form { display: flex; flex-direction: column; gap: 24px; width: 100%; }
        .form-section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
        .section-icon { width: 24px; height: 24px; background: #eef2ff; color: #4f46e5; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
        .form-section-header h3 { font-size: 16px; color: #1e293b; font-weight: 700; }

        .form-group { display: flex; flex-direction: column; gap: 8px; width: 100%; }
        .form-group label { font-weight: 800; font-size: 11px; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; margin-bottom: 2px; }
        .form-group input, .form-group select, .form-group textarea { padding: 12px 16px; border: 1px solid transparent; border-radius: 8px; font-size: 14px; background: #f8fafc; font-family: inherit; width: 100%; box-sizing: border-box; transition: all 0.2s; color: #334155; }
        .form-group input:focus, .form-group select:focus, .form-group textarea:focus { background: #f1f5f9; border-color: #e2e8f0; outline: none; }
        .form-group textarea { resize: none; min-height: 100px; }
        
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; width: 100%; }
        
        .main-cat-select { font-weight: 600; background-color: #f1f5f9 !important; border: 1px solid #e2e8f0 !important; cursor: pointer; }
        .main-cat-select:focus { background-color: white !important; }

        .cat-manager-link { 
          color: #4f46e5; 
          font-weight: 800; 
          font-size: 11px; 
          text-transform: uppercase; 
          letter-spacing: 0.05em; 
          cursor: pointer; 
          text-decoration: none;
          transition: color 0.2s;
        }
        .cat-manager-link:hover { 
          color: #00bcd4; /* A nice Cyan color */
        }

        .cat-manager-panel { 
          margin-bottom: 20px; 
          padding: 20px; 
          background: white; 
          border-radius: 14px; 
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          animation: slideDown 0.3s ease-out;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .cat-manager-input-row { display: flex; gap: 10px; margin-bottom: 20px; }
        .cat-manager-input-row input { flex: 2; height: 40px !important; }
        .cat-manager-input-row select { flex: 1; height: 40px !important; }
        .cat-manager-input-row .btn { height: 40px; padding: 0 20px; font-size: 13px; }

        .cat-pills-container { display: flex; flex-wrap: wrap; gap: 10px; }
        .no-cats-msg { font-size: 11px; color: #94a3b8; font-weight: 700; text-align: center; width: 100%; border: 1px dashed #e2e8f0; padding: 12px; border-radius: 8px; }

        .cat-pill { 
          display: inline-flex; 
          align-items: center; 
          gap: 10px; 
          padding: 8px 14px; 
          border-radius: 10px; 
          font-size: 13px; 
          font-weight: 700; 
          transition: all 0.2s; 
          border: 1px solid transparent;
        }
        .cat-pill.gender-unisex { background: #f1f5f9; color: #475569; border-color: #cbd5e0; }
        .cat-pill.gender-ladies { background: #fdf2f8; color: #be185d; border-color: #fbcfe8; }
        .cat-pill.gender-boys { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
        
        .cat-pill:hover { transform: translateY(-1px); box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }

        .cat-name { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .cat-gender-badge { font-size: 9px; padding: 2px 6px; background: rgba(0,0,0,0.05); border-radius: 4px; letter-spacing: 0.05em; }
        .cat-delete-btn { font-size: 18px; color: currentColor; opacity: 0.5; cursor: pointer; border: none; background: none; padding: 0; display: flex; align-items: center; justify-content: center; }
        .cat-delete-btn:hover { opacity: 1; color: #ef4444; }

        .cat-select-grid { 
          display: flex; 
          flex-wrap: wrap; 
          gap: 10px; 
          margin-top: 10px;
        }
        .cat-tag {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e0;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cat-tag:hover {
          background: #e2e8f0;
          border-color: #94a3b8;
        }
        .cat-tag.active {
          background: var(--primary-dark);
          color: white!important;
          border-color: var(--primary-dark);
        }

        .submit-btn { width: 100%; justify-content: center; height: 52px; margin-top: 16px; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 12px; box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4); }

        /* New Sections Styles */
        .analytics-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 24px; margin-top: 24px; }
        .chart-box { background: white; padding: 32px; border-radius: 20px; border: 1px solid var(--border); }
        .chart-box h4 { margin-bottom: 32px; font-size: 16px; }
        .bar-chart { display: flex; align-items: flex-end; height: 250px; gap: 24px; padding-top: 20px; border-bottom: 1px solid #eee; }
        .bar-wrap { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .bar { width: 100%; background: var(--primary-dark); border-radius: 8px 8px 0 0; transition: height 1s ease-out; }
        .bar-wrap span { font-size: 11px; color: var(--text-muted); font-weight: 600; }
        .bar-value { font-size: 10px; font-weight: 700; color: var(--primary-dark); margin-bottom: 4px; }

        .pie-container { display: flex; flex-direction: column; align-items: center; }
        .pie-mock { width: 200px; height: 200px; border-radius: 50%; margin: 0 auto 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .pie-legend { display: flex; flex-direction: column; gap: 12px; width: 100%; }
        .pie-legend div { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--text-muted); font-weight: 500; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.p1 { background: var(--primary-dark); }
        .dot.p2 { background: #2196F3; }
        .dot.p3 { background: #FFC107; }

        .marketing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 24px; }
        .marketing-card { 
          background: rgba(255, 255, 255, 0.95); 
          padding: 32px; 
          border-radius: 24px; 
          border: 1px solid var(--border); 
          box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05);
          overflow: hidden;
          transition: transform 0.3s ease;
        }
        .marketing-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.1); }
        .marketing-card h3 { 
          display: flex; 
          align-items: center; 
          gap: 12px; 
          font-size: 18px; 
          color: var(--text-main); 
          border-bottom: 2px solid var(--primary-light); 
          padding-bottom: 20px; 
          margin-bottom: 24px; 
        }
        
        /* Announcement Desk */
        .announcements-desk { display: flex; flex-direction: column; gap: 16px; }
        .news-entry-card { 
          display: flex; 
          gap: 12px; 
          background: #f8fafc; 
          padding: 16px; 
          border-radius: 16px; 
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }
        .news-entry-card:focus-within { background: white; border-color: var(--primary-dark); box-shadow: 0 0 0 3px var(--primary-light); }
        
        /* Flash Sale Preview */
        .sale-live-preview {
          margin-top: 24px;
          background: var(--primary-dark);
          color: white;
          padding: 16px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
        }
        .preview-timer { display: flex; gap: 12px; font-weight: 800; font-size: 20px; }

        /* Offer Products Manager */
        .offer-products-manager { display: grid; grid-template-columns: 1fr 1.5fr; gap: 40px; margin-top: 24px; }
        .picker-column { display: flex; flex-direction: column; gap: 16px; }
        .picker-list { 
          background: #f1f5f9; 
          border: 1px solid #e2e8f0; 
          border-radius: 20px; 
          height: 450px; 
          overflow-y: auto; 
          padding: 16px; 
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .picker-item { 
          display: flex; 
          align-items: center; 
          gap: 16px; 
          padding: 12px; 
          background: white; 
          border-radius: 14px; 
          border: 1px solid #e2e8f0; 
          transition: all 0.2s;
        }
        .picker-item:hover { border-color: var(--primary-dark); transform: translateX(5px); }
        .product-thumb { width: 48px; height: 48px; border-radius: 10px; object-fit: cover; background: #e2e8f0; }
        
        /* Active Deals Grid */
        .deals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 20px;
        }
        .deal-card {
          background: white;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          padding: 16px;
          position: relative;
          transition: all 0.3s;
        }
        .deal-card:hover { border-color: var(--primary-dark); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .deal-card .trash-overlay { position: absolute; top: 12px; right: 12px; }
        .deal-badge { position: absolute; top: 12px; left: 12px; background: var(--primary-dark); color: white; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 800; }
        .deal-price-entry { margin-top: 12px; padding-top: 12px; border-top: 1px dashed #e2e8f0; }
        
        /* Coupon Ticket Styling */
        .coupon-ticket {
          background: white;
          border: 2px dashed var(--border);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }
        .coupon-ticket::before, .coupon-ticket::after {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          background: #f1f5f9;
          border-radius: 50%;
          left: -11px;
          top: 50%;
          margin-top: -10px;
          border: 1px solid var(--border);
        }
        .coupon-ticket::after { left: auto; right: -11px; }
        .ticket-code { font-family: monospace; font-size: 18px; font-weight: 800; color: var(--primary-dark); background: var(--primary-light); padding: 4px 12px; border-radius: 8px; }

        .settings-card { background: white; padding: 40px; border-radius: 20px; border: 1px solid var(--border); max-width: 800px; }

        .phone-order { display: flex; align-items: center; gap: 8px; color: var(--primary-dark); font-weight: 700; text-decoration: underline; }
        .status-select { padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border); font-size: 11px; font-weight: 700; outline: none; cursor: pointer; }
        .status-select.processing { background: #FFF3E0; color: #EF6C00; }
        .status-select.confirmed { background: #E8F5E9; color: #2E7D32; }
        .status-select.shipped { background: #E3F2FD; color: #1565C0; }
        .status-select.delivered { background: #f1f8e9; color: #33691e; }
        .status-select.cancelled { background: #ffebee; color: #c62828; }

        .address-cell { font-size: 13px; color: var(--text-muted); cursor: help; }
        .order-items-cell { display: flex; flex-wrap: wrap; gap: 6px; max-width: 260px; }
        .p-badge { background: var(--secondary); padding: 4px 8px; border-radius: 6px; font-size: 12px; font-weight: 700; color: var(--text-main); display: inline-flex; white-space: normal; word-break: break-word; }
        .order-items-cell .p-badge { max-width: 100%; }
        .fw-800 { font-weight: 800; }

        .order-toolbar { display: flex; flex-direction: column; gap: 8px; margin-bottom: 10px; }
        .status-tabs { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 6px; }
        .tab-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background: white; border: 1px solid var(--border); border-radius: 20px; color: var(--text-main); cursor: pointer; transition: var(--transition); font-size: 11px; }
        .tab-pill.active { background: var(--primary-light); border-color: var(--primary-dark); color: var(--primary-dark); font-weight: 700; }
        .tab-count { background: var(--primary-dark); color: white; border-radius: 999px; font-size: 10px; padding: 1px 6px; font-weight: 700; }
        .filters-row { display: grid; grid-template-columns: 1.8fr 1fr 1fr 1fr; gap: 8px; align-items: center; }
        .filters-row input, .filters-row select { height: 36px; border: 1px solid var(--border); border-radius: 8px; padding: 0 12px; background: white; font-size: 12px; }
        @media (max-width: 1024px) { .filters-row { grid-template-columns: 1fr 1fr; gap: 6px; } }
        @media (max-width: 768px) { .filters-row { grid-template-columns: 1fr; } .tab-pill { font-size: 10px; padding: 5px 10px; } }
        .bulk-actions-card { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 8px; font-size: 12px; }
        .bulk-action-buttons { display: flex; flex-wrap: wrap; gap: 12px; }
        .btn-danger { background: #EF5350; color: white; }
        .btn-danger:hover { background: #E53935; }
        .order-table .checkbox-col { width: 48px; }
        .actions-cell { display: flex; gap: 10px; justify-content: end; }
        .empty-state { text-align: center; padding: 40px 0; color: var(--text-muted); }
        .order-header-actions { gap: 12px; }

        .admin-order-table-card { flex: 1; overflow: hidden; display: flex; flex-direction: column; min-height: 400px; }
        .order-table-container { flex: 1; overflow-y: auto; overflow-x: auto; }
        @media (max-width: 1024px) { .admin-order-table-card { min-height: 350px; } }
        @media (max-width: 768px) { .admin-order-table-card { min-height: 300px; } }

        .role-select { border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px; background: white; color: var(--text-main); font-size: 12px; }
        
        @media (max-width: 768px) {
          .admin-dashboard { flex-direction: column; }
          .admin-nav { flex-direction: row; overflow-x: auto; }
          .admin-nav button { white-space: nowrap; padding: 10px 14px; gap: 8px; font-size: 13px; }
        }

        .order-modal { width: 1100px; max-width: 95vw; max-height: 95vh; overflow: hidden; display: flex; flex-direction: column; }
        .order-modal .order-modal-form { display: flex; flex-direction: column; gap: 24px; overflow-y: auto; max-height: 90vh; padding-right: 8px; }
        .order-modal .order-modal-form::-webkit-scrollbar { width: 6px; }
        .order-modal .order-modal-form::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
        .order-modal .order-modal-form::-webkit-scrollbar-thumb { background: #888; border-radius: 10px; }
        .order-modal .grid-two-cols { display: grid; grid-template-columns: 1.3fr 0.9fr; gap: 24px; }
        @media (max-width: 1024px) { .order-modal { width: 90vw; } .order-modal .grid-two-cols { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .order-modal { width: 95vw; max-height: 90vh; } .order-modal .order-modal-form { max-height: 85vh; } }
        .order-modal .form-panel, .order-modal .summary-panel { background: white; border-radius: 20px; border: 1px solid var(--border); padding: 28px; }
        .order-modal h3 { margin-bottom: 16px; font-size: 18px; color: var(--text-main); }
        .order-modal .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .order-modal .form-group { display: flex; flex-direction: column; gap: 8px; }
        .order-modal .form-group label { font-weight: 600; font-size: 14px; color: var(--text-main); }
        .order-modal .form-group input, .order-modal .form-group select, .order-modal .form-group textarea { padding: 12px 16px; border: 1px solid var(--border); border-radius: 12px; font-size: 14px; background: #fafafb; transition: var(--transition); }
        .order-modal .form-group input:focus, .order-modal .form-group select:focus, .order-modal .form-group textarea:focus { border-color: var(--primary-dark); outline: none; }
        .order-modal .form-group.full { grid-column: 1 / -1; }
        .order-modal .form-group textarea { resize: vertical; min-height: 80px; }
        .order-lines { display: grid; gap: 12px; margin-bottom: 16px; }
        .order-line-header { display: grid; grid-template-columns: 1.5fr 0.7fr 0.9fr 1fr 50px; gap: 12px; padding: 12px 16px; background: #f8f9fa; border-radius: 8px; font-size: 13px; font-weight: 700; color: var(--text-muted); }
        .order-line-item { display: grid; grid-template-columns: 1.5fr 0.7fr 0.9fr 1fr 50px; gap: 12px; align-items: center; padding: 12px 16px; background: white; border: 1px solid var(--border); border-radius: 12px; }
        .order-line-item select, .order-line-item input { height: 44px; border: 1px solid var(--border); border-radius: 8px; padding: 0 12px; background: #fafafb; font-size: 14px; }
        .order-line-item select:focus, .order-line-item input:focus { border-color: var(--primary-dark); }
        .line-total { font-weight: 700; color: var(--text-main); text-align: right; }
        .order-modal .icon-btn.remove { width: 36px; height: 36px; border-radius: 8px; border: 1px solid #ef5350; color: #ef5350; background: white; }
        .order-modal .icon-btn.remove:hover { background: #ffebee; }
        .order-modal .icon-btn.remove:disabled { opacity: 0.3; cursor: not-allowed; }
        .add-line { display: inline-flex; align-items: center; gap: 10px; padding: 12px 20px; background: var(--primary-light); color: var(--primary-dark); border: 1px solid var(--primary-dark); border-radius: 12px; font-weight: 600; cursor: pointer; transition: var(--transition); }
        .add-line:hover { background: var(--primary-dark); color: white; }

        .summary-card { display: flex; flex-direction: column; gap: 22px; min-height: 500px; }
        .summary-header { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .summary-label { text-transform: uppercase; font-size: 12px; letter-spacing: 1px; color: var(--text-muted); }
        .summary-grid { display: grid; gap: 16px; }
        .summary-grid div { display: flex; justify-content: space-between; align-items: center; font-size: 14px; }
        .price-summary { display: grid; gap: 12px; padding-top: 16px; border-top: 1px solid var(--border); }
        .price-summary div { display: flex; justify-content: space-between; align-items: center; }
        .price-total { font-size: 20px; font-weight: 800; }
        .history-panel { background: #fafafb; border-radius: 16px; padding: 18px; }
        .history-panel h4 { margin-bottom: 14px; }
        .history-list { display: grid; gap: 14px; }
        .history-item { padding: 14px; border-radius: 14px; border: 1px solid var(--border); background: white; }
        .history-status { display: inline-block; margin-bottom: 8px; padding: 4px 10px; border-radius: 999px; background: #e8f5e9; color: #227a3d; font-size: 12px; font-weight: 700; }
        .save-order { width: 100%; justify-content: center; padding: 16px; font-size: 16px; font-weight: 700; margin-top: auto; }
        .save-order .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      ` }} />

      <FilterManagerModal 
        isOpen={isFilterModalOpen} 
        onClose={() => setIsFilterModalOpen(false)} 
      />

      {isOrderModalOpen && (
        <OrderEditorModal
          isOpen={isOrderModalOpen}
          onClose={handleCloseOrderModal}
          editingOrder={editingOrder}
        />
      )}

      {/* Custom Notification */}
      {notification && (
        <div className="premium-notify-wrapper">
          <div className={`premium-notify ${notification.type}`}>
            <div className="notify-icon">
              {notification.type === 'success' && <CheckCircle size={20} color="#10b981" />}
              {notification.type === 'error' && <Info size={20} color="#ef4444" />}
              {notification.type === 'warning' && <Megaphone size={20} color="#f59e0b" />}
            </div>
            <div className="notify-message">{notification.message}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
