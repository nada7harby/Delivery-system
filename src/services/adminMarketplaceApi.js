import apiClient from "@/services/apiClient";

const safeRequest = async (requestFn) => {
  try {
    await requestFn();
    return { synced: true };
  } catch {
    return { synced: false };
  }
};

export const adminMarketplaceApi = {
  createRestaurant: async (payload) => {
    return safeRequest(() => apiClient.post("/admin/restaurants", payload));
  },

  updateRestaurant: async (restaurantId, payload) => {
    return safeRequest(() =>
      apiClient.put(`/admin/restaurants/${restaurantId}`, payload),
    );
  },

  deleteRestaurant: async (restaurantId) => {
    return safeRequest(() =>
      apiClient.delete(`/admin/restaurants/${restaurantId}`),
    );
  },

  createMenuItem: async (restaurantId, payload) => {
    return safeRequest(() =>
      apiClient.post(`/admin/restaurants/${restaurantId}/menu`, payload),
    );
  },

  updateMenuItem: async (menuItemId, payload) => {
    return safeRequest(() =>
      apiClient.put(`/admin/menu/${menuItemId}`, payload),
    );
  },

  deleteMenuItem: async (menuItemId) => {
    return safeRequest(() => apiClient.delete(`/admin/menu/${menuItemId}`));
  },
};

export default adminMarketplaceApi;
