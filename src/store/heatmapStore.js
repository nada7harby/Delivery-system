import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ORDER_STATUS } from "@/constants";
import useOrderStore from "@/store/orderStore";
import { apiClient } from "@/services";

const HOUR_MS = 60 * 60 * 1000;

const withinWindow = (isoDate, mode) => {
  const now = Date.now();
  const ts = new Date(isoDate).getTime();
  if (!Number.isFinite(ts)) return false;

  if (mode === "last-hour") return now - ts <= HOUR_MS;
  if (mode === "last-2-hours") return now - ts <= HOUR_MS * 2;

  const today = new Date();
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  return ts >= start;
};

const weightByAge = (createdAt) => {
  const ageMinutes = Math.max(
    0,
    (Date.now() - new Date(createdAt).getTime()) / 60000,
  );
  if (ageMinutes <= 15) return 1.2;
  if (ageMinutes <= 45) return 1;
  if (ageMinutes <= 90) return 0.8;
  return 0.6;
};

const useHeatmapStore = create(
  persist(
    (set, get) => ({
      filters: {
        timeRange: "last-2-hours",
        status: "all",
        activeOnly: false,
        restaurant: "all",
      },
      viewMode: "heatmap",
      showDrivers: true,
      isLoadingSnapshot: false,
      snapshotError: null,
      externalSnapshot: null,
      lastUpdatedAt: null,

      setHeatmapFilters: (patch) => {
        set((state) => ({
          filters: {
            ...state.filters,
            ...patch,
          },
        }));
      },

      setViewMode: (viewMode) => set({ viewMode }),
      setShowDrivers: (showDrivers) => set({ showDrivers }),

      getFilteredOrders: () => {
        const { filters } = get();
        const allOrders = useOrderStore.getState().orders;

        return allOrders.filter((order) => {
          if (!withinWindow(order.createdAt, filters.timeRange)) return false;

          if (filters.activeOnly) {
            if (
              order.status === ORDER_STATUS.DELIVERED ||
              order.status === ORDER_STATUS.CANCELLED
            ) {
              return false;
            }
          }

          if (filters.status !== "all" && order.status !== filters.status) {
            return false;
          }

          if (
            filters.restaurant !== "all" &&
            order.pickupLocation?.name !== filters.restaurant
          ) {
            return false;
          }

          return Boolean(
            order.deliveryLocation?.lat && order.deliveryLocation?.lng,
          );
        });
      },

      getHeatmapPoints: () => {
        return get()
          .getFilteredOrders()
          .map((order) => ({
            orderId: order.id,
            lat: order.deliveryLocation.lat,
            lng: order.deliveryLocation.lng,
            status: order.status,
            createdAt: order.createdAt,
            intensity: weightByAge(order.createdAt),
          }));
      },

      getRestaurantOptions: () => {
        const orders = useOrderStore.getState().orders;
        const names = new Set(
          orders.map((order) => order.pickupLocation?.name).filter(Boolean),
        );
        return ["all", ...Array.from(names)];
      },

      getHotZones: () => {
        const points = get().getHeatmapPoints();
        const cells = points.reduce((acc, point) => {
          const latCell = Math.round(point.lat / 0.005) * 0.005;
          const lngCell = Math.round(point.lng / 0.005) * 0.005;
          const key = `${latCell.toFixed(3)}:${lngCell.toFixed(3)}`;

          if (!acc[key]) {
            acc[key] = {
              key,
              lat: latCell,
              lng: lngCell,
              count: 0,
              intensity: 0,
            };
          }

          acc[key].count += 1;
          acc[key].intensity += point.intensity;
          return acc;
        }, {});

        return Object.values(cells)
          .sort((a, b) => b.intensity - a.intensity)
          .slice(0, 8);
      },

      refreshExternalSnapshot: async () => {
        set({ isLoadingSnapshot: true, snapshotError: null });
        try {
          const response = await apiClient.get("/analytics/heatmap");
          set({
            externalSnapshot: response.data,
            isLoadingSnapshot: false,
            lastUpdatedAt: new Date().toISOString(),
          });
        } catch (error) {
          set({
            isLoadingSnapshot: false,
            snapshotError:
              error?.response?.data?.message ||
              "Live API snapshot unavailable, using local state.",
            lastUpdatedAt: new Date().toISOString(),
          });
        }
      },

      touchHeatmap: () => set({ lastUpdatedAt: new Date().toISOString() }),
    }),
    {
      name: "delivery-heatmap",
      partialize: (state) => ({
        filters: state.filters,
        viewMode: state.viewMode,
        showDrivers: state.showDrivers,
        lastUpdatedAt: state.lastUpdatedAt,
      }),
    },
  ),
);

export default useHeatmapStore;
