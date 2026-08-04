import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './useAuthStore';

export interface CartItem {
  id: string; // unique item representation key (productId + variantId)
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
    discount_price?: number;
    category?: string;
    isFreeDelivery?: boolean;
  };
  variant?: {
    id: string;
    label?: string;
    sku?: string;
    size?: string;
    color?: string;
    price?: number;
  };
  quantity: number;
}

interface CartState {
  cart: CartItem[];
  wishlist: string[]; // list of productIds
  compareList: string[]; // list of productIds for comparison
  buyNow: CartItem | null; // temporary buy-now item (doesn't go to cart)
  addToCart: (product: any, variant?: any, qty?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQty: (cartItemId: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  addToCompare: (productId: string) => void;
  removeFromCompare: (productId: string) => void;
  clearCompare: () => void;
  isInCompare: (productId: string) => boolean;
  setBuyNow: (item: CartItem | null) => void;
  clearBuyNow: () => void;
}

// Background sync helper
const syncWithDatabase = async (cart: CartItem[], wishlist: string[]) => {
  const token = useAuthStore.getState().token;
  if (!token) return;
  try {
    await fetch('/api/cart/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cart, wishlist, merge: false })
    });
  } catch (e) {
    console.error('Failed to sync cart/wishlist with DB:', e);
  }
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      compareList: [],
      buyNow: null,
      addToCart: (product, variant, qty = 1) => {
        const cartItemId = variant ? `${product.id}-${variant.id}` : `${product.id}-default`;
        const currentCart = get().cart;
        const existing = currentCart.find((item) => item.id === cartItemId);
        let nextCart = currentCart;

        if (existing) {
          nextCart = currentCart.map((item) =>
            item.id === cartItemId
              ? { ...item, quantity: item.quantity + qty }
              : item
          );
        } else {
          nextCart = [
            ...currentCart,
            {
              id: cartItemId,
              product: {
                id: product.id,
                name: product.name,
                image: product.image || (product.images?.[0]?.url) || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=600',
                price: Number(product.price),
                discount_price: product.discount_price ? Number(product.discount_price) : undefined,
                category: product.category?.name || product.category,
                isFreeDelivery: product.isFreeDelivery || product.is_free_delivery || false,
              },
              variant: variant ? {
                id: variant.id || variant.sku || 'default',
                label: variant.label,
                sku: variant.sku,
                size: variant.size,
                color: variant.color,
                price: variant.price ? Number(variant.price) : undefined,
              } : undefined,
              quantity: qty,
            },
          ];
        }

        set({ cart: nextCart });
        syncWithDatabase(nextCart, get().wishlist);
      },
      removeFromCart: (cartItemId) => {
        const nextCart = get().cart.filter((item) => item.id !== cartItemId);
        set({ cart: nextCart });
        syncWithDatabase(nextCart, get().wishlist);
      },
      updateQty: (cartItemId, qty) => {
        if (qty <= 0) {
          get().removeFromCart(cartItemId);
          return;
        }
        const nextCart = get().cart.map((item) =>
          item.id === cartItemId ? { ...item, quantity: qty } : item
        );
        set({ cart: nextCart });
        syncWithDatabase(nextCart, get().wishlist);
      },
      clearCart: () => {
        set({ cart: [] });
        syncWithDatabase([], get().wishlist);
      },
      toggleWishlist: (productId) => {
        const list = get().wishlist;
        const exists = list.includes(productId);
        const nextWishlist = exists
          ? list.filter((id) => id !== productId)
          : [...list, productId];

        set({ wishlist: nextWishlist });
        syncWithDatabase(get().cart, nextWishlist);
      },
      removeFromWishlist: (productId) => {
        const nextWishlist = get().wishlist.filter((id) => id !== productId);
        set({ wishlist: nextWishlist });
        syncWithDatabase(get().cart, nextWishlist);
      },
      isInWishlist: (productId) => get().wishlist.includes(productId),
      addToCompare: (productId) => {
        const list = get().compareList;
        if (list.includes(productId)) return;
        if (list.length >= 3) {
          alert('You can compare up to 3 products at a time.');
          return;
        }
        set({ compareList: [...list, productId] });
      },
      removeFromCompare: (productId) => {
        set({ compareList: get().compareList.filter((id) => id !== productId) });
      },
      clearCompare: () => {
        set({ compareList: [] });
      },
      isInCompare: (productId) => get().compareList.includes(productId),
      setBuyNow: (item) => set({ buyNow: item }),
      clearBuyNow: () => set({ buyNow: null }),
    }),
    {
      name: 'beautyglowry-cart-storage',
    }
  )
);

// Subscribe to auth store changes to trigger sync on login/logout
if (typeof window !== 'undefined') {
  let activeToken = useAuthStore.getState().token;

  useAuthStore.subscribe((state) => {
    const newToken = state.token;
    if (newToken !== activeToken) {
      const oldToken = activeToken;
      activeToken = newToken;

      if (newToken && !oldToken) {
        // User logged in! Merge local items to DB
        const localCart = useCartStore.getState().cart;
        const localWishlist = useCartStore.getState().wishlist;
        fetch('/api/cart/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`
          },
          body: JSON.stringify({
            cart: localCart,
            wishlist: localWishlist,
            merge: true
          })
        })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            useCartStore.setState({
              cart: data.cart,
              wishlist: data.wishlist
            });
          }
        })
        .catch(e => console.error('Failed to merge cart on login:', e));
      } else if (!newToken && oldToken) {
        // User logged out! Clear local cart and wishlist
        useCartStore.setState({
          cart: [],
          wishlist: []
        });
      }
    }
  });

  // Load database cart on startup if user is already logged in
  setTimeout(() => {
    const token = useAuthStore.getState().token;
    if (token) {
      fetch('/api/cart/sync', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          useCartStore.setState({
            cart: data.cart,
            wishlist: data.wishlist
          });
        }
      })
      .catch(e => console.error('Initial DB cart sync failed:', e));
    }
  }, 300);
}
