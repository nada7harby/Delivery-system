import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ORDER_STATUS } from "@/constants";
import useOrderStore from "@/store/orderStore";
import useDriverStore from "@/store/driverStore";
import { socket } from "@/services";

// Simulated locations
const RESTAURANT_LOCATION = {
  lat: 40.7128,
  lng: -74.006,
  name: "Restaurant HQ",
};
const DELAY_THRESHOLD_MINUTES = 30;
const LOCATION_STALE_SECONDS = 20;
const STUCK_STATUS_MINUTES = 20;

const getRandomNearby = (base) => ({
  lat: base.lat + (Math.random() - 0.5) * 0.02,
  lng: base.lng + (Math.random() - 0.5) * 0.02,
});

const isFiniteLocation = (loc) =>
  loc && Number.isFinite(loc.lat) && Number.isFinite(loc.lng);

const minutesDiff = (fromIso, toIso = new Date().toISOString()) => {
  if (!fromIso) return 0;
  return Math.max(
    0,
    Math.floor(
      (new Date(toIso).getTime() - new Date(fromIso).getTime()) / 60000,
    ),
  );
};

const getOnTheWayTimestamp = (order) =>
  order.onTheWayAt ||
  order.timeline?.find((entry) => entry.status === ORDER_STATUS.ON_THE_WAY)
    ?.timestamp ||
  null;

const getExpectedDeliveryTime = (order) => {
  if (order.expectedDeliveryTime) return order.expectedDeliveryTime;

  const base = order.assignedAt || order.createdAt;
  const minutes = order.estimatedTime || DELAY_THRESHOLD_MINUTES;
  return new Date(new Date(base).getTime() + minutes * 60 * 1000).toISOString();
};

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
      monitoringInterval: null,
      listenersBound: false,
      driverLocations: {},
      delayedOrderIds: [],
      riskOrderIds: [],
      delayedAlerts: [],
      playedDelayedAlertFor: {},
      notifications: [],
      unreadCount: 0,

      startTracking: (orderId) => {
        const existing = get().trackingInterval;
        if (existing) clearInterval(existing);

        const order = useOrderStore.getState().getOrderById(orderId);
        const knownDriverLocation = order?.driverId
          ? get().driverLocations[order.driverId] ||
            useDriverStore.getState().getDriverById(order.driverId)
              ?.currentLocation
          : null;
        const customerLoc =
          order?.deliveryLocation ||
          getRandomNearby({ lat: 40.7228, lng: -74.016 });
        const driverLoc =
          knownDriverLocation || getRandomNearby(RESTAURANT_LOCATION);

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

          const trackedOrder = useOrderStore.getState().getOrderById(orderId);
          if (
            trackedOrder?.driverId &&
            get().driverLocations[trackedOrder.driverId]
          ) {
            set({ eta: Math.max(0, (eta || 0) - 1) });
            return;
          }

          const newLat =
            driverLocation.lat +
            (customerLocation.lat - driverLocation.lat) * 0.05;
          const newLng =
            driverLocation.lng +
            (customerLocation.lng - driverLocation.lng) * 0.05;

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

      upsertDriverLocation: (payload, options = {}) => {
        const { driverId, lat, lng } = payload || {};
        if (!driverId || !Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const now = new Date().toISOString();
        const nextLocation = {
          lat,
          lng,
          updatedAt: payload.timestamp || now,
        };

        set((state) => ({
          driverLocations: {
            ...state.driverLocations,
            [driverId]: nextLocation,
          },
        }));

        useDriverStore.getState().setCurrentLocation(driverId, {
          lat,
          lng,
        });

        const activeOrders = useOrderStore.getState().getActiveOrders();
        const assignedOrder = activeOrders.find(
          (order) => order.driverId === driverId,
        );
        if (assignedOrder) {
          useOrderStore
            .getState()
            .updateTrackingMeta(assignedOrder.id, {
              lastLocationUpdateAt: nextLocation.updatedAt,
            });
        }

        const trackedOrder = get().activeOrderId
          ? useOrderStore.getState().getOrderById(get().activeOrderId)
          : null;
        if (trackedOrder?.driverId === driverId) {
          get().updateDriverLocation({ lat, lng });
        }

        if (options.emit !== false) {
          socket.emit("driver-location-update", {
            driverId,
            lat,
            lng,
            timestamp: nextLocation.updatedAt,
          });
        }
      },

      processDelayChecks: () => {
        const now = new Date().toISOString();
        const activeOrders = useOrderStore.getState().getActiveOrders();
        const driverStore = useDriverStore.getState();
        const previousDelayed = new Set(get().delayedOrderIds);
        const nextDelayed = [];
        const nextRisk = [];
        const newlyDelayed = [];

        activeOrders.forEach((order) => {
          const expectedDeliveryTime = getExpectedDeliveryTime(order);
          const expectedDelayMinutes = minutesDiff(expectedDeliveryTime, now);
          const onTheWayAt = getOnTheWayTimestamp(order);
          const onTheWayMinutes = minutesDiff(onTheWayAt, now);
          const driverLocation = order.driverId
            ? get().driverLocations[order.driverId]
            : null;
          const driver = order.driverId
            ? driverStore.getDriverById(order.driverId)
            : null;

          const staleLocationSeconds = order.lastLocationUpdateAt
            ? Math.floor(
                (new Date(now).getTime() -
                  new Date(order.lastLocationUpdateAt).getTime()) /
                  1000,
              )
            : null;

          const delayByExpected =
            new Date(now) > new Date(expectedDeliveryTime);
          const delayByThreshold =
            order.status === ORDER_STATUS.ON_THE_WAY &&
            onTheWayMinutes > DELAY_THRESHOLD_MINUTES;
          const isDelayed = delayByExpected || delayByThreshold;

          const riskFlags = [];
          if (order.driverId && !isFiniteLocation(driverLocation)) {
            riskFlags.push("Driver location unavailable");
          }
          if (
            staleLocationSeconds !== null &&
            staleLocationSeconds > LOCATION_STALE_SECONDS
          ) {
            riskFlags.push("No location updates from driver");
          }
          if (driver?.status === "offline") {
            riskFlags.push("Driver went offline");
          }

          const statusStuckMinutes = minutesDiff(order.updatedAt, now);
          if (
            statusStuckMinutes > STUCK_STATUS_MINUTES &&
            order.status !== ORDER_STATUS.DELIVERED &&
            order.status !== ORDER_STATUS.CANCELLED
          ) {
            riskFlags.push("Order status appears stuck");
          }

          if (isDelayed) {
            nextDelayed.push(order.id);
          }
          if (riskFlags.length) {
            nextRisk.push(order.id);
          }

          const delayMinutes = Math.max(
            expectedDelayMinutes,
            onTheWayMinutes - DELAY_THRESHOLD_MINUTES,
            0,
          );
          const delayReason = delayByExpected
            ? "Expected delivery time exceeded"
            : delayByThreshold
            ? "Order has been on the way for too long"
            : null;

          if (isDelayed && !previousDelayed.has(order.id)) {
            newlyDelayed.push({
              orderId: order.id,
              at: now,
              message: `Order ${order.id} is delayed`,
            });

            socket.emit("order-delayed", {
              orderId: order.id,
              delayMinutes,
              reason: delayReason,
              timestamp: now,
            });
          }

          useOrderStore.getState().updateTrackingMeta(order.id, {
            expectedDeliveryTime,
            onTheWayAt,
            isDelayed,
            delayMinutes,
            delayReason,
            riskFlags,
          });
        });

        set((state) => ({
          delayedOrderIds: nextDelayed,
          riskOrderIds: nextRisk,
          delayedAlerts: [...newlyDelayed, ...state.delayedAlerts].slice(0, 30),
        }));
      },

      startDelayMonitoring: () => {
        if (get().monitoringInterval) return;

        get().processDelayChecks();
        const interval = setInterval(() => {
          get().processDelayChecks();
        }, 10000);

        set({ monitoringInterval: interval });
      },

      stopDelayMonitoring: () => {
        const interval = get().monitoringInterval;
        if (interval) clearInterval(interval);
        set({ monitoringInterval: null });
      },

      bindRealtimeListeners: () => {
        if (get().listenersBound) return;

        const onDriverLocationUpdate = (payload) => {
          get().upsertDriverLocation(payload, { emit: false });
        };

        const onOrderStatusUpdate = () => {
          get().processDelayChecks();
        };

        socket.on("driver-location-update", onDriverLocationUpdate);
        socket.on("order-status-update", onOrderStatusUpdate);

        set({
          listenersBound: true,
          realtimeCallbacks: {
            onDriverLocationUpdate,
            onOrderStatusUpdate,
          },
        });
      },

      unbindRealtimeListeners: () => {
        const callbacks = get().realtimeCallbacks;
        if (callbacks?.onDriverLocationUpdate) {
          socket.off(
            "driver-location-update",
            callbacks.onDriverLocationUpdate,
          );
        }
        if (callbacks?.onOrderStatusUpdate) {
          socket.off("order-status-update", callbacks.onOrderStatusUpdate);
        }

        set({ listenersBound: false, realtimeCallbacks: null });
      },

      getDelayedOrdersWithDetails: () => {
        const delayedSet = new Set(get().delayedOrderIds);
        return useOrderStore
          .getState()
          .orders.filter((order) => delayedSet.has(order.id));
      },

      markDelayedAlertPlayed: (orderId) => {
        set((state) => ({
          playedDelayedAlertFor: {
            ...state.playedDelayedAlertFor,
            [orderId]: true,
          },
        }));
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
            n.id === id ? { ...n, read: true } : n,
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: "delivery-tracking",
      partialize: (state) => ({
        driverLocations: state.driverLocations,
        notifications: state.notifications,
        unreadCount: state.unreadCount,
      }),
    },
  ),
);

export default useTrackingStore;
