import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ORDER_STATUS,
  canTransition,
  STATUS_TRANSITIONS,
} from "@/constants/orderStatus";
import useDriverStore from "@/store/driverStore";
import { socket } from "@/services";
import { selectBestDriver } from "@/utils/assignment";

const ASSIGNMENT_RETRY_INTERVAL_MS = 5000;
const DRIVER_RESPONSE_TIMEOUT_MS = 15000;
const DEFAULT_PICKUP_LOCATION = {
  lat: 40.7128,
  lng: -74.006,
  name: "Restaurant HQ",
};

const retryTimers = new Map();
const driverResponseTimers = new Map();

const clearRetryTimer = (orderId) => {
  const timerId = retryTimers.get(orderId);
  if (timerId) {
    clearTimeout(timerId);
    retryTimers.delete(orderId);
  }
};

const clearDriverResponseTimer = (orderId) => {
  const timerId = driverResponseTimers.get(orderId);
  if (timerId) {
    clearTimeout(timerId);
    driverResponseTimers.delete(orderId);
  }
};

const useOrderStore = create(
  persist(
    (set, get) => ({
      orders: [],
      assignmentStatusByOrder: {},
      isLoading: false,
      error: null,

      setAssignmentStatus: (orderId, patch) => {
        set((state) => ({
          assignmentStatusByOrder: {
            ...state.assignmentStatusByOrder,
            [orderId]: {
              ...(state.assignmentStatusByOrder[orderId] || {}),
              ...patch,
              updatedAt: new Date().toISOString(),
            },
          },
        }));
      },

      getAssignmentStatus: (orderId) =>
        get().assignmentStatusByOrder[orderId] || null,

      // Create a new order
      createOrder: (orderData) => {
        const order = {
          id: `ORD-${Date.now()}`,
          ...orderData,
          totalPrice: orderData.totalPrice ?? orderData.total ?? 0,
          pickupLocation: orderData.pickupLocation || DEFAULT_PICKUP_LOCATION,
          deliveryLocation: orderData.deliveryLocation || {
            lat: 40.7228 + (Math.random() - 0.5) * 0.02,
            lng: -74.016 + (Math.random() - 0.5) * 0.02,
            address: orderData.customerAddress || "Customer address",
          },
          status: ORDER_STATUS.PENDING,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          timeline: [
            {
              status: ORDER_STATUS.PENDING,
              timestamp: new Date().toISOString(),
              note: "Order placed",
            },
          ],
          driverId: null,
          driver: null,
          autoAssigned: false,
          assignmentScore: null,
          awaitingDriverResponse: false,
          rejectedDriverIds: [],
          rating: null,
          estimatedTime: Math.floor(Math.random() * 20) + 25, // 25-45 min
        };

        set({ orders: [...get().orders, order] });

        get().setAssignmentStatus(order.id, {
          state: "searching",
          message: "Searching for driver...",
          retryCount: 0,
          score: null,
          isAutoAssigned: true,
          lastEvent: "order-created",
        });

        socket.emit("order-created", {
          orderId: order.id,
          customerId: order.customerId,
        });

        get().runSmartAssignment(order.id, { trigger: "order-created" });
        return order;
      },

      // Update order status (with transition validation)
      updateOrderStatus: (orderId, newStatus, note = "") => {
        const { orders } = get();
        const order = orders.find((o) => o.id === orderId);

        if (!order) return { success: false, error: "Order not found" };
        if (!canTransition(order.status, newStatus)) {
          return {
            success: false,
            error: `Cannot transition from ${order.status} to ${newStatus}`,
          };
        }

        const timeline = [
          ...order.timeline,
          {
            status: newStatus,
            timestamp: new Date().toISOString(),
            note: note || STATUS_TRANSITIONS[newStatus]?.[0] || "",
          },
        ];

        // Reduce ETA as order progresses
        let estimatedTime = order.estimatedTime;
        if (newStatus === ORDER_STATUS.ON_THE_WAY) estimatedTime = 10;
        if (newStatus === ORDER_STATUS.DELIVERED) estimatedTime = 0;

        set({
          orders: orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: newStatus,
                  updatedAt: new Date().toISOString(),
                  timeline,
                  estimatedTime,
                }
              : o,
          ),
        });

        if (
          newStatus === ORDER_STATUS.DELIVERED ||
          newStatus === ORDER_STATUS.CANCELLED
        ) {
          clearRetryTimer(orderId);
          clearDriverResponseTimer(orderId);

          if (order.driverId) {
            useDriverStore.getState().releaseOrderFromDriver(order.driverId);
          }

          get().setAssignmentStatus(orderId, {
            state:
              newStatus === ORDER_STATUS.DELIVERED ? "completed" : "cancelled",
            message:
              newStatus === ORDER_STATUS.DELIVERED
                ? "Order delivered successfully"
                : "Order cancelled",
          });
        }

        useDriverStore.getState().syncActiveOrderCounts(get().orders);

        return { success: true };
      },

      runSmartAssignment: (orderId, options = {}) => {
        const order = get().getOrderById(orderId);
        if (!order) return { success: false, error: "Order not found" };

        if (
          order.status === ORDER_STATUS.DELIVERED ||
          order.status === ORDER_STATUS.CANCELLED
        ) {
          return { success: false, error: "Order is not assignable" };
        }

        clearRetryTimer(orderId);
        clearDriverResponseTimer(orderId);

        const rejectedDriverIds = new Set(order.rejectedDriverIds || []);
        const candidates = useDriverStore
          .getState()
          .getAssignableDrivers()
          .filter((driver) => !rejectedDriverIds.has(driver.id));

        if (!candidates.length) {
          const retryCount =
            Number(get().assignmentStatusByOrder[orderId]?.retryCount || 0) + 1;

          get().setAssignmentStatus(orderId, {
            state: "searching",
            message: "No drivers available, retrying...",
            retryCount,
            score: null,
            driverId: null,
            lastEvent: options.trigger || "retry",
          });

          const timerId = setTimeout(() => {
            get().runSmartAssignment(orderId, { trigger: "retry" });
          }, ASSIGNMENT_RETRY_INTERVAL_MS);
          retryTimers.set(orderId, timerId);

          return { success: false, error: "No drivers available" };
        }

        const bestDriver = selectBestDriver(candidates, order.pickupLocation);
        if (!bestDriver) {
          return { success: false, error: "Could not rank drivers" };
        }

        const previousDriverId = order.driverId;
        if (previousDriverId && previousDriverId !== bestDriver.id) {
          useDriverStore.getState().releaseOrderFromDriver(previousDriverId);
        }
        useDriverStore.getState().assignOrderToDriver(bestDriver.id);

        const now = new Date().toISOString();
        const wasPending = order.status === ORDER_STATUS.PENDING;

        set((state) => ({
          orders: state.orders.map((o) => {
            if (o.id !== orderId) return o;

            const timeline = [
              ...o.timeline,
              {
                status: ORDER_STATUS.CONFIRMED,
                timestamp: now,
                note: `Auto assigned to ${
                  bestDriver.name
                } (score ${bestDriver.assignmentScore.toFixed(3)})`,
              },
            ];

            return {
              ...o,
              status: ORDER_STATUS.CONFIRMED,
              updatedAt: now,
              timeline: wasPending ? timeline : o.timeline,
              driverId: bestDriver.id,
              driver: {
                id: bestDriver.id,
                name: bestDriver.name,
                phone: bestDriver.phone,
                vehicleType: bestDriver.vehicleType,
                rating: bestDriver.rating,
              },
              autoAssigned: options.manual ? false : true,
              assignmentScore: bestDriver.assignmentScore,
              awaitingDriverResponse: true,
            };
          }),
        }));

        get().setAssignmentStatus(orderId, {
          state: "assigned",
          message: `Driver assigned: ${bestDriver.name}`,
          retryCount: Number(
            get().assignmentStatusByOrder[orderId]?.retryCount || 0,
          ),
          score: bestDriver.assignmentScore,
          driverId: bestDriver.id,
          nearestDistance: bestDriver.assignmentMeta.distance,
          isAutoAssigned: !options.manual,
          lastEvent: "driver-assigned",
        });

        socket.emit("driver-assigned", {
          orderId,
          driverId: bestDriver.id,
          driverName: bestDriver.name,
          score: bestDriver.assignmentScore,
          autoAssigned: !options.manual,
        });

        const timeoutId = setTimeout(() => {
          get().handleDriverTimeout(orderId, bestDriver.id);
        }, DRIVER_RESPONSE_TIMEOUT_MS);
        driverResponseTimers.set(orderId, timeoutId);

        useDriverStore.getState().syncActiveOrderCounts(get().orders);

        return {
          success: true,
          driver: bestDriver,
          score: bestDriver.assignmentScore,
        };
      },

      // Manual admin assignment
      assignDriverByAdmin: (orderId, driverId) => {
        const order = get().getOrderById(orderId);
        if (!order) return { success: false, error: "Order not found" };

        const driver = useDriverStore.getState().getDriverById(driverId);
        if (!driver) return { success: false, error: "Driver not found" };

        clearRetryTimer(orderId);
        clearDriverResponseTimer(orderId);

        if (order.driverId && order.driverId !== driverId) {
          useDriverStore.getState().releaseOrderFromDriver(order.driverId);
        }
        useDriverStore.getState().assignOrderToDriver(driverId);

        const now = new Date().toISOString();
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  driverId: driver.id,
                  driver: {
                    id: driver.id,
                    name: driver.name,
                    phone: driver.phone,
                    vehicleType: driver.vehicleType,
                    rating: driver.rating,
                  },
                  status: ORDER_STATUS.CONFIRMED,
                  updatedAt: now,
                  awaitingDriverResponse: false,
                  autoAssigned: false,
                  timeline: [
                    ...o.timeline,
                    {
                      status: ORDER_STATUS.CONFIRMED,
                      timestamp: now,
                      note: `Admin assigned ${driver.name}`,
                    },
                  ],
                }
              : o,
          ),
        }));

        get().setAssignmentStatus(orderId, {
          state: "assigned",
          message: `Admin assigned: ${driver.name}`,
          score: null,
          driverId: driver.id,
          isAutoAssigned: false,
          lastEvent: "driver-assigned",
        });

        socket.emit("driver-assigned", {
          orderId,
          driverId: driver.id,
          driverName: driver.name,
          autoAssigned: false,
        });

        useDriverStore.getState().syncActiveOrderCounts(get().orders);
        return { success: true };
      },

      // Backward-compatible assignment API
      assignDriver: (orderId, driverId) =>
        get().assignDriverByAdmin(orderId, driverId),

      driverAcceptOrder: (orderId, driverId) => {
        const order = get().getOrderById(orderId);
        if (!order) return { success: false, error: "Order not found" };
        if (order.driverId !== driverId) {
          return {
            success: false,
            error: "Order is not assigned to this driver",
          };
        }

        clearDriverResponseTimer(orderId);
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  awaitingDriverResponse: false,
                  updatedAt: new Date().toISOString(),
                  timeline: [
                    ...o.timeline,
                    {
                      status: o.status,
                      timestamp: new Date().toISOString(),
                      note: "Driver accepted the assignment",
                    },
                  ],
                }
              : o,
          ),
        }));

        get().setAssignmentStatus(orderId, {
          state: "accepted",
          message: "Driver accepted the order",
          lastEvent: "driver-accepted",
        });

        return { success: true };
      },

      driverRejectOrder: (
        orderId,
        driverId,
        reason = "Driver rejected the assignment",
      ) => {
        const order = get().getOrderById(orderId);
        if (!order) return { success: false, error: "Order not found" };
        if (order.driverId !== driverId) {
          return {
            success: false,
            error: "Order is not assigned to this driver",
          };
        }

        clearDriverResponseTimer(orderId);
        useDriverStore.getState().releaseOrderFromDriver(driverId);

        const now = new Date().toISOString();
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: ORDER_STATUS.PENDING,
                  updatedAt: now,
                  driverId: null,
                  driver: null,
                  assignmentScore: null,
                  awaitingDriverResponse: false,
                  rejectedDriverIds: [
                    ...new Set([...(o.rejectedDriverIds || []), driverId]),
                  ],
                  timeline: [
                    ...o.timeline,
                    {
                      status: ORDER_STATUS.PENDING,
                      timestamp: now,
                      note: reason,
                    },
                  ],
                }
              : o,
          ),
        }));

        socket.emit("driver-rejected", {
          orderId,
          driverId,
          reason,
        });

        get().setAssignmentStatus(orderId, {
          state: "searching",
          message: "Driver rejected. Reassigning to next best driver...",
          driverId: null,
          score: null,
          lastEvent: "driver-rejected",
        });

        get().runSmartAssignment(orderId, { trigger: "driver-rejected" });
        return { success: true };
      },

      handleDriverTimeout: (orderId, driverId) => {
        const order = get().getOrderById(orderId);
        if (!order) return;
        if (!order.awaitingDriverResponse || order.driverId !== driverId)
          return;

        get().driverRejectOrder(
          orderId,
          driverId,
          "Driver did not respond in time. Reassigning order.",
        );
      },

      handleDriverOffline: (driverId) => {
        const affectedOrders = get().orders.filter(
          (o) =>
            o.driverId === driverId &&
            o.status !== ORDER_STATUS.DELIVERED &&
            o.status !== ORDER_STATUS.CANCELLED,
        );

        affectedOrders.forEach((order) => {
          get().driverRejectOrder(
            order.id,
            driverId,
            "Driver went offline. Reassigning order.",
          );
        });
      },

      // Rate an order
      rateOrder: (orderId, rating, comment = "") => {
        const { orders } = get();
        set({
          orders: orders.map((o) =>
            o.id === orderId ? { ...o, rating, ratingComment: comment } : o,
          ),
        });
      },

      // Cancel order
      cancelOrder: (orderId) => {
        return get().updateOrderStatus(
          orderId,
          ORDER_STATUS.CANCELLED,
          "Order cancelled",
        );
      },

      // Get order by id
      getOrderById: (id) => get().orders.find((o) => o.id === id),

      // Get orders by customer
      getOrdersByCustomer: (customerId) =>
        get().orders.filter((o) => o.customerId === customerId),

      // Get orders by driver
      getOrdersByDriver: (driverId) =>
        get().orders.filter(
          (o) => o.driverId === driverId || o.driver?.id === driverId,
        ),

      // Get active orders (not delivered/cancelled)
      getActiveOrders: () =>
        get().orders.filter(
          (o) =>
            o.status !== ORDER_STATUS.DELIVERED &&
            o.status !== ORDER_STATUS.CANCELLED,
        ),

      // Filter orders by status
      getOrdersByStatus: (status) =>
        get().orders.filter((o) => o.status === status),

      // Analytics
      getAnalytics: () => {
        const { orders } = get();
        return {
          total: orders.length,
          delivered: orders.filter((o) => o.status === ORDER_STATUS.DELIVERED)
            .length,
          active: orders.filter(
            (o) =>
              o.status !== ORDER_STATUS.DELIVERED &&
              o.status !== ORDER_STATUS.CANCELLED,
          ).length,
          cancelled: orders.filter((o) => o.status === ORDER_STATUS.CANCELLED)
            .length,
          revenue: orders
            .filter((o) => o.status === ORDER_STATUS.DELIVERED)
            .reduce((sum, o) => sum + (o.total || 0), 0),
          pending: orders.filter((o) => o.status === ORDER_STATUS.PENDING)
            .length,
        };
      },

      // Seed sample orders for demo
      seedOrders: (userId) => {
        const { orders } = get();
        if (orders.length > 0) return;

        const sampleOrders = [
          {
            id: "ORD-DEMO001",
            customerId: userId,
            customerName: "Alice Johnson",
            customerAddress: "123 Main St, Springfield",
            items: [
              { id: "p1", name: "Classic Burger", price: 12.99, quantity: 2 },
              { id: "p12", name: "Mango Smoothie", price: 5.99, quantity: 1 },
            ],
            subtotal: 31.97,
            deliveryFee: 0,
            tax: 2.56,
            total: 34.53,
            status: ORDER_STATUS.DELIVERED,
            notes: "No onions please",
            createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
            updatedAt: new Date(Date.now() - 3600000 * 22).toISOString(),
            driverId: "d1",
            driver: {
              id: "d1",
              name: "Ahmed Driver",
              rating: 4.9,
              vehicleType: "Motorcycle",
              phone: "+20 123-456-7890",
            },
            autoAssigned: true,
            assignmentScore: -0.72,
            awaitingDriverResponse: false,
            rejectedDriverIds: [],
            rating: 5,
            estimatedTime: 0,
            timeline: [
              {
                status: ORDER_STATUS.PENDING,
                timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
                note: "Order placed",
              },
              {
                status: ORDER_STATUS.CONFIRMED,
                timestamp: new Date(Date.now() - 3600000 * 23.8).toISOString(),
                note: "Driver assigned",
              },
              {
                status: ORDER_STATUS.PREPARING,
                timestamp: new Date(Date.now() - 3600000 * 23.5).toISOString(),
                note: "Kitchen confirmed",
              },
              {
                status: ORDER_STATUS.DELIVERED,
                timestamp: new Date(Date.now() - 3600000 * 22).toISOString(),
                note: "Delivered",
              },
            ],
          },
          {
            id: "ORD-DEMO002",
            customerId: userId,
            customerName: "Alice Johnson",
            customerAddress: "456 Oak Ave, Springfield",
            items: [
              { id: "p2", name: "Margherita Pizza", price: 16.99, quantity: 1 },
              {
                id: "p8",
                name: "Chocolate Lava Cake",
                price: 7.99,
                quantity: 2,
              },
            ],
            subtotal: 32.97,
            deliveryFee: 0,
            tax: 2.64,
            total: 35.61,
            status: ORDER_STATUS.ON_THE_WAY,
            notes: "",
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            updatedAt: new Date(Date.now() - 600000).toISOString(),
            driverId: "d2",
            driver: {
              id: "d2",
              name: "Maria Garcia",
              rating: 4.6,
              vehicleType: "Bicycle",
              phone: "+1 555-0104",
            },
            autoAssigned: true,
            assignmentScore: -0.64,
            awaitingDriverResponse: false,
            rejectedDriverIds: [],
            rating: null,
            estimatedTime: 10,
            timeline: [
              {
                status: ORDER_STATUS.PENDING,
                timestamp: new Date(Date.now() - 1800000).toISOString(),
                note: "Order placed",
              },
              {
                status: ORDER_STATUS.CONFIRMED,
                timestamp: new Date(Date.now() - 1500000).toISOString(),
                note: "Driver assigned",
              },
              {
                status: ORDER_STATUS.PREPARING,
                timestamp: new Date(Date.now() - 1200000).toISOString(),
                note: "Preparing",
              },
              {
                status: ORDER_STATUS.ON_THE_WAY,
                timestamp: new Date(Date.now() - 600000).toISOString(),
                note: "On the way",
              },
            ],
          },
        ];

        set({ orders: sampleOrders });
        useDriverStore.getState().syncActiveOrderCounts(sampleOrders);
      },

      clearError: () => set({ error: null }),
      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: "delivery-orders",
      partialize: (state) => ({
        orders: state.orders,
        assignmentStatusByOrder: state.assignmentStatusByOrder,
      }),
    },
  ),
);

export default useOrderStore;
