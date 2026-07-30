import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase/config';
import { products as initialProducts } from '../data/products';
import { seedProducts } from '../supabase/seed';

const ProductContext = createContext();

export const useProducts = () => useContext(ProductContext);

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState(initialProducts);
  const [reviews, setReviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const loading = loadingProducts || loadingReviews;

  const fetchAllData = async () => {
    if (!isSupabaseConfigured) {
      setProducts(initialProducts);
      setLoadingProducts(false);
      setLoadingReviews(false);
      return;
    }

    try {
      // 1. Fetch Products
      const { data: prodData, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (prodErr) throw prodErr;

      if (prodData && prodData.length > 0) {
        const formattedProducts = prodData.map(p => ({
          ...p,
          firestoreId: String(p.id),
          originalPrice: p.original_price,
          isNew: p.is_new,
          isBestseller: p.is_bestseller,
          reviewCount: p.review_count
        }));
        setProducts(formattedProducts);
      } else {
        setProducts(initialProducts);
      }
    } catch (err) {
      console.warn("PostgreSQL products fetch error, using initial static products:", err);
      setProducts(initialProducts);
    } finally {
      setLoadingProducts(false);
    }

    try {
      // 2. Fetch Reviews
      const { data: revData } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (revData) {
        const formattedReviews = revData.map(r => ({
          ...r,
          productId: r.product_id,
          userName: r.user_name,
          userEmail: r.user_email
        }));
        setReviews(formattedReviews);
      }
    } catch (err) {
      console.warn("PostgreSQL reviews fetch error:", err);
    } finally {
      setLoadingReviews(false);
    }

    try {
      // 3. Fetch Categories
      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (catData) {
        const formattedCats = catData.map(c => ({
          name: c.name,
          gender: c.gender || 'Unisex',
          firestoreId: String(c.id)
        }));
        setCategories(formattedCats);
      }
    } catch (err) {
      console.warn("PostgreSQL categories fetch error:", err);
    }

    try {
      // 4. Fetch Filters
      const { data: filterData } = await supabase
        .from('filters')
        .select('*')
        .order('order_index', { ascending: true });

      if (filterData) {
        const formattedFilters = filterData.map(f => ({
          ...f,
          firestoreId: String(f.id),
          order: f.order_index
        }));
        setFilters(formattedFilters);
      }
    } catch (err) {
      console.warn("PostgreSQL filters fetch error:", err);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      if (isSupabaseConfigured) {
        await seedProducts();
      }
      if (isMounted) {
        await fetchAllData();
      }
    };

    init();

    // Set up Realtime subscriptions if Supabase is configured
    let prodSub, revSub, catSub, filterSub;

    if (isSupabaseConfigured) {
      prodSub = supabase
        .channel('products-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => fetchAllData())
        .subscribe();

      revSub = supabase
        .channel('reviews-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, () => fetchAllData())
        .subscribe();

      catSub = supabase
        .channel('categories-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => fetchAllData())
        .subscribe();

      filterSub = supabase
        .channel('filters-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'filters' }, () => fetchAllData())
        .subscribe();
    }

    return () => {
      isMounted = false;
      if (prodSub) supabase.removeChannel(prodSub);
      if (revSub) supabase.removeChannel(revSub);
      if (catSub) supabase.removeChannel(catSub);
      if (filterSub) supabase.removeChannel(filterSub);
    };
  }, []);

  const productsWithRatings = products.map(product => {
    const productReviews = reviews.filter(r => Number(r.productId) === Number(product.id));
    const reviewCount = productReviews.length;
    const avgRating = reviewCount > 0 
      ? (productReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviewCount).toFixed(1)
      : (product.rating || 0);
    
    return {
      ...product,
      avgRating: Number(avgRating),
      reviewCount: reviewCount || product.reviewCount || 0,
      reviews: productReviews 
    };
  });

  const addProduct = async (newProduct) => {
    const payload = {
      name: newProduct.name,
      price: Number(newProduct.price),
      original_price: Number(newProduct.originalPrice || newProduct.price),
      category: newProduct.category || 'Skincare',
      image: newProduct.image || '',
      description: newProduct.description || '',
      stock: Number(newProduct.stock || 50),
      is_new: Boolean(newProduct.isNew),
      is_bestseller: Boolean(newProduct.isBestseller),
      tags: newProduct.tags || []
    };

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase.from('products').insert([payload]).select();
        if (error) throw error;
        await fetchAllData();
      } catch (error) {
        console.error("Error adding product to PostgreSQL:", error);
      }
    } else {
      const localNew = { ...newProduct, id: Date.now(), firestoreId: String(Date.now()) };
      setProducts(prev => [localNew, ...prev]);
    }
  };

  const deleteProduct = async (firestoreId) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('products').delete().eq('id', firestoreId);
        if (error) throw error;
        await fetchAllData();
      } catch (error) {
        console.error("Error deleting product from PostgreSQL:", error);
      }
    } else {
      setProducts(prev => prev.filter(p => p.firestoreId !== firestoreId && String(p.id) !== firestoreId));
    }
  };

  const updateProduct = async (firestoreId, updatedData) => {
    if (isSupabaseConfigured) {
      try {
        const payload = {};
        if (updatedData.name !== undefined) payload.name = updatedData.name;
        if (updatedData.price !== undefined) payload.price = Number(updatedData.price);
        if (updatedData.originalPrice !== undefined) payload.original_price = Number(updatedData.originalPrice);
        if (updatedData.category !== undefined) payload.category = updatedData.category;
        if (updatedData.image !== undefined) payload.image = updatedData.image;
        if (updatedData.description !== undefined) payload.description = updatedData.description;
        if (updatedData.stock !== undefined) payload.stock = Number(updatedData.stock);
        if (updatedData.isNew !== undefined) payload.is_new = Boolean(updatedData.isNew);
        if (updatedData.isBestseller !== undefined) payload.is_bestseller = Boolean(updatedData.isBestseller);

        const { error } = await supabase.from('products').update(payload).eq('id', firestoreId);
        if (error) throw error;
        await fetchAllData();
      } catch (error) {
        console.error("Error updating product in PostgreSQL:", error);
      }
    } else {
      setProducts(prev => prev.map(p => (p.firestoreId === firestoreId || String(p.id) === firestoreId) ? { ...p, ...updatedData } : p));
    }
  };

  const submitReview = async (productId, reviewData) => {
    const payload = {
      product_id: Number(productId),
      user_name: reviewData.userName || reviewData.user_name || 'Anonymous',
      user_email: reviewData.userEmail || reviewData.user_email || '',
      rating: Number(reviewData.rating),
      comment: reviewData.comment || ''
    };

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('reviews').insert([payload]);
        if (error) throw error;
        await fetchAllData();
      } catch (error) {
        console.error("Error submitting review to PostgreSQL:", error);
        throw error;
      }
    } else {
      const localRev = { id: String(Date.now()), productId: Number(productId), ...reviewData };
      setReviews(prev => [localRev, ...prev]);
    }
  };

  const addCategory = async (name, gender = 'Unisex') => {
    if (!name.trim()) return;
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('categories').insert([{ name: name.trim(), gender }]);
        if (error) throw error;
        await fetchAllData();
      } catch (error) {
        console.error("Error adding category to PostgreSQL:", error);
      }
    } else {
      setCategories(prev => [...prev, { name: name.trim(), gender, firestoreId: String(Date.now()) }]);
    }
  };

  const deleteCategory = async (firestoreId) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', firestoreId);
        if (error) throw error;
        await fetchAllData();
      } catch (error) {
        console.error("Error deleting category from PostgreSQL:", error);
      }
    } else {
      setCategories(prev => prev.filter(c => c.firestoreId !== firestoreId));
    }
  };

  const addFilterGroup = async (name) => {
    if (!name.trim()) return;
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('filters').insert([{ name: name.trim(), options: [], order_index: filters.length + 1 }]);
        if (error) throw error;
        await fetchAllData();
      } catch (error) {
        console.error("Error adding filter group to PostgreSQL:", error);
      }
    } else {
      setFilters(prev => [...prev, { name: name.trim(), options: [], order: filters.length + 1, firestoreId: String(Date.now()) }]);
    }
  };

  const updateFilterGroup = async (firestoreId, data) => {
    if (isSupabaseConfigured) {
      try {
        const payload = {};
        if (data.name !== undefined) payload.name = data.name;
        if (data.options !== undefined) payload.options = data.options;
        if (data.order !== undefined) payload.order_index = data.order;

        const { error } = await supabase.from('filters').update(payload).eq('id', firestoreId);
        if (error) throw error;
        await fetchAllData();
      } catch (error) {
        console.error("Error updating filter group in PostgreSQL:", error);
      }
    } else {
      setFilters(prev => prev.map(f => f.firestoreId === firestoreId ? { ...f, ...data } : f));
    }
  };

  const deleteFilterGroup = async (firestoreId) => {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('filters').delete().eq('id', firestoreId);
        if (error) throw error;
        await fetchAllData();
      } catch (error) {
        console.error("Error deleting filter group from PostgreSQL:", error);
      }
    } else {
      setFilters(prev => prev.filter(f => f.firestoreId !== firestoreId));
    }
  };

  return (
    <ProductContext.Provider value={{ 
      products: productsWithRatings, 
      loading,
      categories,
      addProduct, 
      deleteProduct, 
      updateProduct,
      submitReview,
      addCategory,
      deleteCategory,
      filters,
      addFilterGroup,
      updateFilterGroup,
      deleteFilterGroup
    }}>
      {children}
    </ProductContext.Provider>
  );
};
