import { create } from "zustand";

type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "Admin" | "Customer";
};

type AuthState = {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (fields: Partial<User>) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  updateUser: (fields) =>
    set((s) => (s.user ? { user: { ...s.user, ...fields } } : s)),
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({ user: null });
  },
}));
