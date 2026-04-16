import { create } from "zustand";
import { persist } from "zustand/middleware";

const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      restaurantId: null,

      addItem: (product, quantity = 1) => {
        const { items, restaurantId } = get();
        const incomingRestaurantId = product.restaurantId || restaurantId;

        if (
          restaurantId &&
          incomingRestaurantId &&
          restaurantId !== incomingRestaurantId
        ) {
          return {
            success: false,
            conflict: true,
            cartRestaurantId: restaurantId,
            incomingRestaurantId,
          };
        }

        const existing = items.find((i) => i.id === product.id);

        if (existing) {
          set({
            restaurantId: restaurantId || incomingRestaurantId || null,
            items: items.map((i) =>
              i.id === product.id
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            ),
          });
        } else {
          set({
            restaurantId: restaurantId || incomingRestaurantId || null,
            items: [...items, { ...product, quantity }],
          });
        }

        return {
          success: true,
          conflict: false,
        };
      },

      removeItem: (productId) => {
        const nextItems = get().items.filter((i) => i.id !== productId);
        set({
          items: nextItems,
          restaurantId: nextItems.length === 0 ? null : get().restaurantId,
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const nextItems = get().items.map((i) =>
          i.id === productId ? { ...i, quantity } : i,
        );
        set({
          items: nextItems,
          restaurantId: nextItems.length === 0 ? null : get().restaurantId,
        });
      },

      clearCart: () => set({ items: [], restaurantId: null }),

      getTotal: () => {
        return get().items.reduce((sum, i) => sum + i.price * i.quantity, 0);
      },

      getItemCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      getDeliveryFee: () => {
        const total = get().getTotal();
        return total > 30 ? 0 : 3.99;
      },

      getTax: () => {
        return get().getTotal() * 0.08;
      },

      getGrandTotal: () => {
        const s = get();
        return s.getTotal() + s.getDeliveryFee() + s.getTax();
      },
    }),
    {
      name: "delivery-cart",
      partialize: (state) => ({
        items: state.items,
        restaurantId: state.restaurantId,
      }),
    },
  ),
);

export default useCartStore;
