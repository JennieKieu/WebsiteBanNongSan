import { create } from "zustand";
import http from "../api/http";

type CartState = {
  totalQty: number;
  loaded: boolean;
  fetch: () => Promise<void>;
  setTotalQty: (n: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  totalQty: 0,
  loaded: false,

  fetch: async () => {
    try {
      const res = await http.get("/cart");
      const items = res.data.data?.items || [];
      const totalQty = items.reduce(
        (s: number, it: { quantity?: number }) => s + Number(it.quantity || 0),
        0,
      );
      set({ totalQty, loaded: true });
    } catch {
      set({ totalQty: 0, loaded: true });
    }
  },

  setTotalQty: (totalQty) => set({ totalQty, loaded: true }),

  clear: () => set({ totalQty: 0, loaded: false }),
}));
