import { create } from "zustand";
import { persist } from "zustand/middleware";
import { RESTAURANTS, MARKETPLACE_PRODUCTS } from "@/constants/marketplaceData";

const useMarketplaceStore = create(
  persist(
    (set, get) => ({
      restaurants: RESTAURANTS,
      products: MARKETPLACE_PRODUCTS,
      selectedRestaurantId: null,
      favoriteRestaurantIds: [],
      recentlyViewedRestaurantIds: [],
      isLoadingRestaurants: false,

      setSelectedRestaurant: (restaurantId) => {
        const state = get();
        const nextRecent = [
          restaurantId,
          ...state.recentlyViewedRestaurantIds.filter(
            (id) => id !== restaurantId,
          ),
        ].slice(0, 8);

        set({
          selectedRestaurantId: restaurantId,
          recentlyViewedRestaurantIds: nextRecent,
        });
      },

      toggleFavoriteRestaurant: (restaurantId) => {
        const { favoriteRestaurantIds } = get();
        const exists = favoriteRestaurantIds.includes(restaurantId);

        set({
          favoriteRestaurantIds: exists
            ? favoriteRestaurantIds.filter((id) => id !== restaurantId)
            : [restaurantId, ...favoriteRestaurantIds],
        });

        return !exists;
      },

      getRestaurantById: (restaurantId) =>
        get().restaurants.find(
          (restaurant) => restaurant.id === restaurantId,
        ) || null,

      getProductsByRestaurant: (restaurantId) =>
        get().products.filter(
          (product) => product.restaurantId === restaurantId,
        ),

      getRecentlyViewedRestaurants: () => {
        const state = get();
        return state.recentlyViewedRestaurantIds
          .map((id) =>
            state.restaurants.find((restaurant) => restaurant.id === id),
          )
          .filter(Boolean);
      },

      getFavoriteRestaurants: () => {
        const state = get();
        return state.favoriteRestaurantIds
          .map((id) =>
            state.restaurants.find((restaurant) => restaurant.id === id),
          )
          .filter(Boolean);
      },

      getTopRatedRestaurants: (limit = 4) =>
        [...get().restaurants]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, limit),
    }),
    {
      name: "delivery-marketplace",
      partialize: (state) => ({
        selectedRestaurantId: state.selectedRestaurantId,
        favoriteRestaurantIds: state.favoriteRestaurantIds,
        recentlyViewedRestaurantIds: state.recentlyViewedRestaurantIds,
      }),
    },
  ),
);

export default useMarketplaceStore;
