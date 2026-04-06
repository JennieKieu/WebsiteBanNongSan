import { create } from "zustand";
import http from "../api/http";

type WishlistState = {
  ids: Set<string>;
  loaded: boolean;
  fetch: () => Promise<void>;
  add: (productId: string) => Promise<void>;
  remove: (productId: string) => Promise<void>;
  toggle: (productId: string) => Promise<void>;
  has: (productId: string) => boolean;
  clear: () => void;
};

export const useWishlistStore = create<WishlistState>((set, get) => ({
  ids: new Set(),
  loaded: false,

  fetch: async () => {
    try {
      const res = await http.get("/wishlist");
      const items = res.data.data?.productIds || [];
      const idSet = new Set<string>(
        items.map((p: any) => (typeof p === "string" ? p : p._id)),
      );
      set({ ids: idSet, loaded: true });
    } catch {
      set({ ids: new Set(), loaded: true });
    }
  },

  add: async (productId) => {
    set((s) => ({ ids: new Set(s.ids).add(productId) }));
    try {
      await http.post("/wishlist/items", { productId });
    } catch {
      set((s) => {
        const next = new Set(s.ids);
        next.delete(productId);
        return { ids: next };
      });
    }
  },

  remove: async (productId) => {
    set((s) => {
      const next = new Set(s.ids);
      next.delete(productId);
      return { ids: next };
    });
    try {
      await http.delete(`/wishlist/items/${productId}`);
    } catch {
      set((s) => ({ ids: new Set(s.ids).add(productId) }));
    }
  },

  toggle: async (productId) => {
    if (get().ids.has(productId)) {
      await get().remove(productId);
    } else {
      await get().add(productId);
    }
  },

  has: (productId) => get().ids.has(productId),

  clear: () => set({ ids: new Set(), loaded: false }),
}));
