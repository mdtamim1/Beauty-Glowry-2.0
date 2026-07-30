import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string; // unique item representation key (productId + variantId)
  product: {
    id: string;
    name: string;
    image: string;
    price: number;
    discount_price?: number;
    category?: string;
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
  buyNow: CartItem | null; // temporary buy-now item (doesn't go to cart)
  addToCart: (product: any, variant?: any, qty?: number) => void;
  removeFromCart: (cartItemId: string) => void;
  updateQty: (cartItemId: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  setBuyNow: (item: CartItem | null) => void;
  clearBuyNow: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: [],
      wishlist: [],
      buyNow: null,
      addToCart: (product, variant, qty = 1) => {
        const cartItemId = variant ? `${product.id}-${variant.id}` : `${product.id}-default`;
        const currentCart = get().cart;
        const existing = currentCart.find((item) => item.id === cartItemId);

        if (existing) {
          set({
            cart: currentCart.map((item) =>
              item.id === cartItemId
                ? { ...item, quantity: item.quantity + qty }
                : item
            ),
          });
        } else {
          set({
            cart: [
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
            ],
          });
        }
      },
      removeFromCart: (cartItemId) => {
        set({
          cart: get().cart.filter((item) => item.id !== cartItemId),
        });
      },
      updateQty: (cartItemId, qty) => {
        if (qty <= 0) {
          get().removeFromCart(cartItemId);
          return;
        }
        set({
          cart: get().cart.map((item) =>
            item.id === cartItemId ? { ...item, quantity: qty } : item
          ),
        });
      },
      clearCart: () => set({ cart: [] }),
      toggleWishlist: (productId) => {
        const list = get().wishlist;
        const exists = list.includes(productId);
        if (exists) {
          set({ wishlist: list.filter((id) => id !== productId) });
        } else {
          set({ wishlist: [...list, productId] });
        }
      },
      removeFromWishlist: (productId) => {
        set({ wishlist: get().wishlist.filter((id) => id !== productId) });
      },
      isInWishlist: (productId) => get().wishlist.includes(productId),
      setBuyNow: (item) => set({ buyNow: item }),
      clearBuyNow: () => set({ buyNow: null }),
    }),
    {
      name: 'beautyglowry-cart-storage',
    }
  )
);
