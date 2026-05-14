import { create } from "zustand";
import { cartService } from "@/services/cart.service";

interface CartState {
  itemCount: number;
  setItemCount: (count: number) => void;
  loadCount: () => Promise<void>;
}

export const useCartStore = create<CartState>()((set) => ({
  itemCount: 0,
  setItemCount: (count) => set({ itemCount: count }),
  loadCount: async () => {
    try {
      const res = await cartService.get();
      set({ itemCount: res.data.items.length });
    } catch {
      set({ itemCount: 0 });
    }
  },
}));
