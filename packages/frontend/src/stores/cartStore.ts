import { create } from 'zustand';
import { api } from '../api/client';

interface CartState {
  items: any[];
  subtotal: number;
  itemCount: number;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  subtotal: 0,
  itemCount: 0,
  loading: false,
  fetchCart: async () => {
    set({ loading: true });
    try {
      const cart = await api.getCart();
      set({ items: cart.items, subtotal: cart.subtotal, itemCount: cart.itemCount });
    } catch {
      set({ items: [], subtotal: 0, itemCount: 0 });
    } finally {
      set({ loading: false });
    }
  },
  addToCart: async (productId, quantity = 1) => {
    await api.addToCart(productId, quantity);
    await get().fetchCart();
  },
  updateQuantity: async (itemId, quantity) => {
    await api.updateCartItem(itemId, quantity);
    await get().fetchCart();
  },
  removeItem: async (itemId) => {
    await api.removeCartItem(itemId);
    await get().fetchCart();
  },
  clearCart: async () => {
    await api.clearCart();
    set({ items: [], subtotal: 0, itemCount: 0 });
  },
}));
