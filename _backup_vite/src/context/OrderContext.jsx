import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase/config';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';

const OrderContext = createContext();

const calculateTotals = (products = [], deliveryZone = 'dhaka', discount = 0, rates) => {
  const subtotal = products.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
  const deliveryCharge = subtotal > 1500 ? 0 : (rates?.[deliveryZone] || 0);
  return { subtotal, deliveryCharge, total: subtotal - (Number(discount) || 0) + deliveryCharge };
};

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { settings } = useSettings();

  const currentRates = {
    dhaka: Number(settings?.deliveryDhaka ?? 60),
    outside: Number(settings?.deliveryOutside ?? 130)
  };

  const normalizeOrderWithSettings = (order) => {
    const customer = typeof order.customer === 'object'
      ? order.customer
      : { name: order.customer || 'Guest', phone: order.phone || '', email: order.email || '' };

    const products = order.products && order.products.length
      ? order.products
      : order.items
        ? (typeof order.items === 'string' ? [{ id: Date.now(), name: order.items, productId: Date.now(), quantity: 1, price: order.total || 0 }] : order.items)
        : [];

    const calculatedTotals = calculateTotals(products, order.deliveryZone || 'dhaka', order.discount || 0, currentRates);

    const deliveryCharge = typeof order.deliveryCharge === 'number' ? order.deliveryCharge : calculatedTotals.deliveryCharge;
    const total = typeof order.total === 'number' ? order.total : calculatedTotals.total;
    const subtotal = typeof order.subtotal === 'number' ? order.subtotal : calculatedTotals.subtotal;

    return {
      id: order.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      customer,
      deliveryAddress: order.deliveryAddress || order.address || '',
      deliveryZone: order.deliveryZone || 'dhaka',
      paymentMethod: order.paymentMethod || 'COD',
      paymentStatus: order.paymentStatus || (order.status === 'Delivered' ? 'Paid' : 'Unpaid'),
      products,
      couponUsed: order.couponUsed || null,
      discount: Number(order.discount) || 0,
      notes: order.notes || { customer: '', internal: '' },
      status: order.status || 'Processing',
      history: order.history || [{ id: Date.now(), status: order.status || 'Processing', note: 'Order created', by: 'System', at: new Date().toISOString() }],
      createdBy: order.createdBy || 'System',
      updatedBy: order.updatedBy || 'System',
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: order.updatedAt || new Date().toISOString(),
      subtotal,
      deliveryCharge,
      total,
      firestoreId: String(order.id)
    };
  };

  const fetchOrders = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });

      if (user && user.role !== 'admin' && user.role !== 'staff') {
        // Customer sees orders matching their email
        query = query.filter('customer->>email', 'eq', user.email || '');
      }

      const { data, error } = await query;
      if (error) throw error;

      if (data) {
        const formattedOrders = data.map(o => normalizeOrderWithSettings({
          ...o,
          createdAt: o.created_at,
          paymentMethod: o.payment_method,
          subtotal: Number(o.subtotal),
          shipping: Number(o.shipping),
          discount: Number(o.discount),
          total: Number(o.total)
        }));
        setOrders(formattedOrders);
      }
    } catch (err) {
      console.warn("PostgreSQL orders fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    let channel;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('orders-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [user]);

  const addOrder = async (orderData) => {
    const newOrder = normalizeOrderWithSettings({
      ...orderData,
      status: orderData.status || 'Processing',
      id: orderData.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: orderData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (isSupabaseConfigured) {
      try {
        const payload = {
          id: newOrder.id,
          user_id: user?.uid && user.uid.length > 20 ? user.uid : null,
          customer: newOrder.customer,
          items: newOrder.products,
          subtotal: newOrder.subtotal,
          shipping: newOrder.deliveryCharge,
          discount: newOrder.discount,
          total: newOrder.total,
          status: newOrder.status,
          payment_method: newOrder.paymentMethod,
          notes: typeof newOrder.notes === 'string' ? newOrder.notes : JSON.stringify(newOrder.notes),
          created_at: newOrder.createdAt
        };

        const { error } = await supabase.from('orders').insert([payload]);
        if (error) throw error;
        await fetchOrders();
      } catch (error) {
        console.error("Error adding order to PostgreSQL:", error);
      }
    } else {
      setOrders(prev => [newOrder, ...prev]);
    }

    return newOrder;
  };

  const editOrder = async (firestoreId, updatedData) => {
    const targetId = firestoreId;
    const existingOrder = orders.find(o => o.firestoreId === targetId || o.id === targetId);

    if (isSupabaseConfigured) {
      try {
        const payload = {};
        if (updatedData.status) payload.status = updatedData.status;

        const { error } = await supabase.from('orders').update(payload).eq('id', targetId);
        if (error) throw error;
        await fetchOrders();
      } catch (error) {
        console.error("Error editing order in PostgreSQL:", error);
      }
    } else {
      setOrders(prev => prev.map(o => (o.firestoreId === targetId || o.id === targetId) ? { ...o, ...updatedData } : o));
    }
  };

  const updateOrderStatus = (firestoreId, newStatus, updatedBy = 'Admin') => {
    editOrder(firestoreId, { status: newStatus, updatedBy });
  };

  const deleteOrder = async (firestoreId) => {
    const targetId = firestoreId;
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('orders').delete().eq('id', targetId);
        if (error) throw error;
        await fetchOrders();
      } catch (error) {
        console.error("Error deleting order from PostgreSQL:", error);
      }
    } else {
      setOrders(prev => prev.filter(o => o.firestoreId !== targetId && o.id !== targetId));
    }
  };

  const bulkUpdateOrderStatus = async (firestoreIds, status, updatedBy = 'Admin') => {
    for (const id of firestoreIds) {
      await updateOrderStatus(id, status, updatedBy);
    }
  };

  const bulkDeleteOrders = async (firestoreIds) => {
    for (const id of firestoreIds) {
      await deleteOrder(id);
    }
  };

  return (
    <OrderContext.Provider value={{ 
      orders, 
      loading,
      addOrder, 
      editOrder, 
      updateOrderStatus, 
      deleteOrder, 
      bulkUpdateOrderStatus, 
      bulkDeleteOrders 
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error('useOrders must be used within an OrderProvider');
  return context;
};
