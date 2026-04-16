import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_USERS } from "@/constants";

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        await new Promise((r) => setTimeout(r, 800));

        const user = MOCK_USERS.find(
          (u) => u.email === email && u.password === password
        );

        if (user) {
          const { password: _, ...safeUser } = user;
          set({ user: safeUser, isAuthenticated: true, isLoading: false });
          return { success: true, user: safeUser };
        } else {
          set({ error: "Invalid email or password", isLoading: false });
          return { success: false, error: "Invalid email or password" };
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        await new Promise((r) => setTimeout(r, 800));

        const exists = MOCK_USERS.find((u) => u.email === data.email);
        if (exists) {
          set({ error: "Email already registered", isLoading: false });
          return { success: false, error: "Email already registered" };
        }

        const newUser = {
          id: `u${Date.now()}`,
          name: data.name,
          email: data.email,
          role: data.role || "customer",
          phone: data.phone || "",
        };

        set({ user: newUser, isAuthenticated: true, isLoading: false });
        return { success: true, user: newUser };
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, error: null });
      },

      clearError: () => set({ error: null }),

      getRole: () => get().user?.role || null,
      isRole: (role) => get().user?.role === role,
    }),
    {
      name: "delivery-auth",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
