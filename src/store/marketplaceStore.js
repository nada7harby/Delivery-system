import { create } from "zustand";
import { persist } from "zustand/middleware";
import { RESTAURANTS, MARKETPLACE_PRODUCTS } from "@/constants/marketplaceData";

const createRestaurantId = () => `r${Date.now().toString(36)}`;
const createMenuItemId = () => `m${Date.now().toString(36)}`;

const normalizeRestaurant = (restaurant) => ({
  ...restaurant,
  isActive: restaurant.isActive ?? restaurant.isOpen ?? true,
  isOpen: restaurant.isOpen ?? restaurant.isActive ?? true,
  createdAt: restaurant.createdAt || new Date().toISOString(),
  location: restaurant.location || "City Center",
  tags: restaurant.tags || [],
});

const normalizeMenuItem = (item) => ({
  ...item,
  isAvailable: item.isAvailable ?? true,
});

const useMarketplaceStore = create(
  persist(
    (set, get) => ({
      restaurants: RESTAURANTS.map(normalizeRestaurant),
      products: MARKETPLACE_PRODUCTS.map(normalizeMenuItem),
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

      addRestaurant: (restaurantInput) => {
        const nextRestaurant = {
          id: createRestaurantId(),
          name: restaurantInput.name,
          description: restaurantInput.description || "",
          category: restaurantInput.category || "Fast Food",
          image: restaurantInput.image || "",
          rating: Number(restaurantInput.rating ?? 0),
          deliveryTime: Number(restaurantInput.deliveryTime ?? 30),
          isActive: restaurantInput.isActive ?? true,
          isOpen: restaurantInput.isActive ?? true,
          createdAt: restaurantInput.createdAt || new Date().toISOString(),
          location: restaurantInput.location || "City Center",
          promotion: restaurantInput.promotion || "",
          tags: restaurantInput.tags || [],
        };

        set((state) => ({
          restaurants: [nextRestaurant, ...state.restaurants],
        }));

        return nextRestaurant;
      },

      updateRestaurant: (restaurantId, updates) => {
        let updatedRestaurant = null;

        set((state) => ({
          restaurants: state.restaurants.map((restaurant) => {
            if (restaurant.id !== restaurantId) return restaurant;

            const nextRestaurant = {
              ...restaurant,
              ...updates,
              deliveryTime:
                updates.deliveryTime !== undefined
                  ? Number(updates.deliveryTime)
                  : restaurant.deliveryTime,
              isOpen:
                updates.isActive !== undefined
                  ? updates.isActive
                  : updates.isOpen !== undefined
                  ? updates.isOpen
                  : restaurant.isOpen,
            };

            updatedRestaurant = nextRestaurant;
            return nextRestaurant;
          }),
        }));

        return updatedRestaurant;
      },

      deleteRestaurant: (restaurantId) => {
        set((state) => ({
          restaurants: state.restaurants.filter(
            (restaurant) => restaurant.id !== restaurantId,
          ),
          products: state.products.filter(
            (product) => product.restaurantId !== restaurantId,
          ),
          favoriteRestaurantIds: state.favoriteRestaurantIds.filter(
            (id) => id !== restaurantId,
          ),
          recentlyViewedRestaurantIds: state.recentlyViewedRestaurantIds.filter(
            (id) => id !== restaurantId,
          ),
          selectedRestaurantId:
            state.selectedRestaurantId === restaurantId
              ? null
              : state.selectedRestaurantId,
        }));
      },

      setRestaurantActive: (restaurantId, isActive) => {
        get().updateRestaurant(restaurantId, { isActive, isOpen: isActive });
      },

      bulkUpdateRestaurantsActive: (restaurantIds, isActive) => {
        set((state) => ({
          restaurants: state.restaurants.map((restaurant) =>
            restaurantIds.includes(restaurant.id)
              ? { ...restaurant, isActive, isOpen: isActive }
              : restaurant,
          ),
        }));
      },

      addMenuItem: (restaurantId, menuInput) => {
        const nextItem = {
          id: createMenuItemId(),
          restaurantId,
          name: menuInput.name,
          description: menuInput.description || "",
          price: Number(menuInput.price ?? 0),
          image: menuInput.image || "",
          category: menuInput.category || "General",
          isAvailable: menuInput.isAvailable ?? true,
        };

        set((state) => ({
          products: [nextItem, ...state.products],
        }));

        return nextItem;
      },

      updateMenuItem: (menuItemId, updates) => {
        let updatedItem = null;

        set((state) => ({
          products: state.products.map((product) => {
            if (product.id !== menuItemId) return product;

            const nextItem = {
              ...product,
              ...updates,
              price:
                updates.price !== undefined
                  ? Number(updates.price)
                  : product.price,
            };

            updatedItem = nextItem;
            return nextItem;
          }),
        }));

        return updatedItem;
      },

      deleteMenuItem: (menuItemId) => {
        set((state) => ({
          products: state.products.filter(
            (product) => product.id !== menuItemId,
          ),
        }));
      },

      getMenuGroupedByCategory: (restaurantId) => {
        const menu = get().getProductsByRestaurant(restaurantId);
        return menu.reduce((grouped, item) => {
          const group = item.category || "General";
          if (!grouped[group]) {
            grouped[group] = [];
          }
          grouped[group].push(item);
          return grouped;
        }, {});
      },
    }),
    {
      name: "delivery-marketplace",
      partialize: (state) => ({
        restaurants: state.restaurants,
        products: state.products,
        selectedRestaurantId: state.selectedRestaurantId,
        favoriteRestaurantIds: state.favoriteRestaurantIds,
        recentlyViewedRestaurantIds: state.recentlyViewedRestaurantIds,
      }),
    },
  ),
);

export default useMarketplaceStore;
