import { create } from 'zustand';
import { api } from '../api/client';

interface WishlistState {
  items: any[];
  productIds: Set<string>;
  fetchWishlist: () => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],
  productIds: new Set(),
  fetchWishlist: async () => {
    try {
      const items = await api.getWishlist();
      set({ items, productIds: new Set(items.map((i: any) => i.product_id)) });
    } catch {
      set({ items: [], productIds: new Set() });
    }
  },
  toggle: async (productId) => {
    const { productIds } = get();
    if (productIds.has(productId)) {
      await api.removeFromWishlist(productId);
    } else {
      await api.addToWishlist(productId);
    }
    await get().fetchWishlist();
  },
  isWishlisted: (productId) => get().productIds.has(productId),
}));
