import { create } from "zustand";
import http from "../api/http";
import { decodeJwtPayload } from "../utils/decodeJwtPayload";

const AUTH_USER_KEY = "naturalstore_auth_user";

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "Admin" | "Customer";
};

function normalizeUser(data: Record<string, unknown>): User {
  const rawId = data.id ?? data._id;
  return {
    id: String(rawId),
    name: String(data.name ?? ""),
    email: String(data.email ?? ""),
    role: data.role === "Admin" ? "Admin" : "Customer",
    phone: data.phone != null && data.phone !== "" ? String(data.phone) : undefined,
  };
}

function readCachedUser(): User | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Partial<User>;
    if (!c.id || !c.email || !c.role) return null;
    return {
      id: String(c.id),
      name: String(c.name ?? ""),
      email: String(c.email),
      role: c.role === "Admin" ? "Admin" : "Customer",
      phone: c.phone ? String(c.phone) : undefined,
    };
  } catch {
    return null;
  }
}

type AuthState = {
  user: User | null;
  /** true sau khi áp dụng cache/JWT đồng bộ hoặc xác nhận không có phiên */
  hydrated: boolean;
  setUser: (user: User | null) => void;
  updateUser: (fields: Partial<User>) => void;
  logout: () => void;
  hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  hydrated: false,
  setUser: (user) => {
    set({ user });
    if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_USER_KEY);
  },
  updateUser: (fields) =>
    set((s) => {
      if (!s.user) return s;
      const user = { ...s.user, ...fields };
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      return { user };
    }),
  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem(AUTH_USER_KEY);
    set({ user: null });
  },
  hydrate: async () => {
    const access = localStorage.getItem("accessToken");
    const refresh = localStorage.getItem("refreshToken");
    if (!access && !refresh) {
      set({ hydrated: true });
      return;
    }

    const cached = readCachedUser();
    if (cached) {
      set({ user: cached, hydrated: true });
    } else {
      const stub =
        decodeJwtPayload(access || "") || decodeJwtPayload(refresh || "");
      if (stub) {
        set({
          user: {
            id: stub.userId,
            name: "",
            email: "",
            role: stub.role,
          },
          hydrated: true,
        });
      } else {
        /* Có token nhưng không đọc được cache/JWT — vẫn mở UI, chờ /users/me */
        set({ hydrated: true });
      }
    }

    try {
      const { data } = await http.get<{ data: Record<string, unknown> }>("/users/me");
      const u = normalizeUser(data.data);
      get().setUser(u);
    } catch {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem(AUTH_USER_KEY);
      set({ user: null });
    }
  },
}));
