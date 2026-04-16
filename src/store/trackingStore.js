import { create } from "zustand";
import { persist } from "zustand/middleware";

// Simulated locations
const RESTAURANT_LOCATION = { lat: 40.7128, lng: -74.006, name: "Restaurant HQ" };
const getRandomNearby = (base) => ({
  lat: base.lat + (Math.random() - 0.5) * 0.02,
  lng: base.lng + (Math.random() - 0.5) * 0.02,
});

const useTrackingStore = create(
  persist(
    (set, get) => ({
      activeOrderId: null,
      driverLocation: null,
      customerLocation: null,
      restaurantLocation: RESTAURANT_LOCATION,
      eta: null,
      isTracking: false,
      trackingInterval: null,
      notifications: [],
      unreadCount: 0,

      startTracking: (orderId, customerAddress) => {
        const existing = get().trackingInterval;
        if (existing) clearInterval(existing);

        const customerLoc = getRandomNearby({ lat: 40.7228, lng: -74.016 });
        const driverLoc = getRandomNearby(RESTAURANT_LOCATION);

        set({
          activeOrderId: orderId,
          customerLocation: customerLoc,
          driverLocation: driverLoc,
          isTracking: true,
          eta: Math.floor(Math.random() * 15) + 10,
        });

        // Simulate driver movement toward customer
        const interval = setInterval(() => {
          const { driverLocation, customerLocation, eta } = get();
          if (!driverLocation || !customerLocation) return;

          const newLat =
            driverLocation.lat + (customerLocation.lat - driverLocation.lat) * 0.05;
          const newLng =
            driverLocation.lng + (customerLocation.lng - driverLocation.lng) * 0.05;

          const newEta = Math.max(0, (eta || 0) - 1);

          set({
            driverLocation: { lat: newLat, lng: newLng },
            eta: newEta,
          });
        }, 3000);

        set({ trackingInterval: interval });
      },

      stopTracking: () => {
        const { trackingInterval } = get();
        if (trackingInterval) clearInterval(trackingInterval);
        set({ isTracking: false, trackingInterval: null });
      },

      updateDriverLocation: (location) => {
        set({ driverLocation: location });
      },

      // Notifications
      addNotification: (notification) => {
        const newNotif = {
          id: `notif-${Date.now()}`,
          ...notification,
          timestamp: new Date().toISOString(),
          read: false,
        };
        set((state) => ({
          notifications: [newNotif, ...state.notifications].slice(0, 50),
          unreadCount: state.unreadCount + 1,
        }));
        return newNotif;
      },

      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      markRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: "delivery-tracking",
      partialize: (state) => ({
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    }
  )
);

export default useTrackingStore;
