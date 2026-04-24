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
const DEFAULT_EXPECTED_DELIVERY_MINUTES = 30;
const CONDITIONAL_CANCELLATION_STATUSES = new Set([ORDER_STATUS.PREPARING]);
const ALLOWED_CANCELLATION_STATUSES = new Set([
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
]);
const DEFAULT_PICKUP_LOCATION = {
  lat: 40.7128,
  lng: -74.006,
  name: "Restaurant HQ",
};

const addMinutesToIso = (isoDate, minutes) =>
  new Date(new Date(isoDate).getTime() + minutes * 60 * 1000).toISOString();

const resolveRefundRate = (status) => {
  if (status === ORDER_STATUS.PENDING) return 1;
  if (status === ORDER_STATUS.CONFIRMED) return 0.8;
  if (status === ORDER_STATUS.PREPARING) return 0.5;
  return 0;
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
      cancellationAttemptsByOrder: {},
      cancellationHistory: [],
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
        const now = new Date().toISOString();
        const expectedMinutes =
          orderData.expectedDeliveryMinutes ||
          orderData.estimatedTime ||
          DEFAULT_EXPECTED_DELIVERY_MINUTES;

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
          createdAt: now,
          updatedAt: now,
          assignedAt: null,
          expectedDeliveryTime: addMinutesToIso(now, expectedMinutes),
          actualDeliveryTime: null,
          onTheWayAt: null,
          isDelayed: false,
          delayMinutes: 0,
          delayReason: null,
          riskFlags: [],
          lastLocationUpdateAt: null,
          cancelledAt: null,
          cancelledBy: null,
          cancelReason: null,
          partialRefundAmount: 0,
          cancellationAttemptCount: 0,
          timeline: [
            {
              status: ORDER_STATUS.PENDING,
              timestamp: now,
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
          estimatedTime:
            orderData.estimatedTime || Math.floor(Math.random() * 20) + 25, // 25-45 min
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
        socket.emit("heatmap-updated", {
          reason: "order-created",
          orderId: order.id,
          timestamp: now,
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

        const now = new Date().toISOString();
        const onTheWayAt =
          newStatus === ORDER_STATUS.ON_THE_WAY
            ? order.onTheWayAt || now
            : order.onTheWayAt;
        const actualDeliveryTime =
          newStatus === ORDER_STATUS.DELIVERED ? now : order.actualDeliveryTime;
        const isCancellation = newStatus === ORDER_STATUS.CANCELLED;
        const refundRate = resolveRefundRate(order.status);
        const partialRefundAmount = isCancellation
          ? Number((order.total || 0) * refundRate)
          : order.partialRefundAmount;

        set({
          orders: orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: newStatus,
                  updatedAt: now,
                  timeline,
                  estimatedTime,
                  onTheWayAt,
                  actualDeliveryTime,
                  isDelayed:
                    newStatus === ORDER_STATUS.DELIVERED ||
                    newStatus === ORDER_STATUS.CANCELLED
                      ? false
                      : o.isDelayed,
                  cancelledAt: isCancellation ? now : o.cancelledAt,
                  cancelledBy: isCancellation
                    ? o.cancelledBy || "system"
                    : o.cancelledBy,
                  cancelReason: isCancellation
                    ? o.cancelReason || note || "Order cancelled"
                    : o.cancelReason,
                  partialRefundAmount,
                }
              : o,
          ),
        });

        socket.emit("order-status-update", {
          orderId,
          status: newStatus,
          updatedAt: now,
        });

        if (isCancellation) {
          socket.emit("order-cancelled", {
            orderId,
            statusBeforeCancellation: order.status,
            cancelledAt: now,
            cancelledBy: order.cancelledBy || "system",
            cancelReason: order.cancelReason || note || "Order cancelled",
            driverId: order.driverId,
            customerId: order.customerId,
            partialRefundAmount,
          });
          socket.emit("heatmap-updated", {
            reason: "order-cancelled",
            orderId,
            timestamp: now,
          });
        }

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
        const expectedMinutes =
          order.estimatedTime || DEFAULT_EXPECTED_DELIVERY_MINUTES;

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
              assignedAt: o.assignedAt || now,
              expectedDeliveryTime:
                o.expectedDeliveryTime || addMinutesToIso(now, expectedMinutes),
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
        const expectedMinutes =
          order.estimatedTime || DEFAULT_EXPECTED_DELIVERY_MINUTES;
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
                  assignedAt: o.assignedAt || now,
                  expectedDeliveryTime:
                    o.expectedDeliveryTime ||
                    addMinutesToIso(now, expectedMinutes),
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
                  assignedAt: null,
                  expectedDeliveryTime: addMinutesToIso(
                    now,
                    o.estimatedTime || DEFAULT_EXPECTED_DELIVERY_MINUTES,
                  ),
                  isDelayed: false,
                  delayMinutes: 0,
                  delayReason: null,
                  riskFlags: [],
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
      cancelOrder: (orderId, options = {}) => {
        return get().requestOrderCancellation(orderId, {
          actorRole: options.actorRole || "system",
          actorId: options.actorId || null,
          reason: options.reason || "Order cancelled",
          acknowledgePreparing: Boolean(options.acknowledgePreparing),
          isAdminOverride: Boolean(options.isAdminOverride),
        });
      },

      canCancelOrder: (order, options = {}) => {
        if (!order) {
          return {
            allowed: false,
            requiresWarning: false,
            message: "Order not found",
          };
        }

        if (order.status === ORDER_STATUS.CANCELLED) {
          return {
            allowed: false,
            requiresWarning: false,
            message: "Order is already cancelled",
          };
        }

        const isAdminOverride = Boolean(options.isAdminOverride);
        const actorRole = options.actorRole || "customer";

        if (isAdminOverride || actorRole === "admin") {
          return {
            allowed: true,
            requiresWarning: false,
            message: "Admin override cancellation",
          };
        }

        if (ALLOWED_CANCELLATION_STATUSES.has(order.status)) {
          return {
            allowed: true,
            requiresWarning: false,
            message: "Cancellation allowed",
          };
        }

        if (CONDITIONAL_CANCELLATION_STATUSES.has(order.status)) {
          return {
            allowed: true,
            requiresWarning: true,
            message: "Your order is being prepared",
          };
        }

        return {
          allowed: false,
          requiresWarning: false,
          message: "Order cannot be cancelled at this stage",
        };
      },

      requestOrderCancellation: (orderId, options = {}) => {
        const order = get().getOrderById(orderId);
        if (!order) return { success: false, error: "Order not found" };

        const actorRole = options.actorRole || "customer";
        const actorId = options.actorId || null;
        const reason = options.reason || "Cancelled by user";
        const isAdminOverride = Boolean(options.isAdminOverride);
        const decision = get().canCancelOrder(order, {
          actorRole,
          isAdminOverride,
        });

        const attemptTimestamp = new Date().toISOString();
        set((state) => ({
          cancellationAttemptsByOrder: {
            ...state.cancellationAttemptsByOrder,
            [orderId]:
              Number(state.cancellationAttemptsByOrder[orderId] || 0) + 1,
          },
          cancellationHistory: [
            {
              id: `cancel-attempt-${Date.now()}`,
              orderId,
              statusAtAttempt: order.status,
              actorRole,
              actorId,
              reason,
              allowed: decision.allowed,
              attemptedAt: attemptTimestamp,
            },
            ...state.cancellationHistory,
          ].slice(0, 150),
        }));

        if (!decision.allowed) {
          return { success: false, error: decision.message };
        }

        if (
          decision.requiresWarning &&
          !options.acknowledgePreparing &&
          !isAdminOverride
        ) {
          return {
            success: false,
            requiresWarning: true,
            error: decision.message,
          };
        }

        const now = new Date().toISOString();
        const refundRate = resolveRefundRate(order.status);
        const partialRefundAmount = Number((order.total || 0) * refundRate);

        set((state) => ({
          orders: state.orders.map((candidate) =>
            candidate.id !== orderId
              ? candidate
              : {
                  ...candidate,
                  status: ORDER_STATUS.CANCELLED,
                  updatedAt: now,
                  isDelayed: false,
                  cancelledAt: now,
                  cancelledBy: actorRole,
                  cancelReason: reason,
                  partialRefundAmount,
                  cancellationAttemptCount: Number(
                    state.cancellationAttemptsByOrder[orderId] || 0,
                  ),
                  timeline: [
                    ...candidate.timeline,
                    {
                      status: ORDER_STATUS.CANCELLED,
                      timestamp: now,
                      note: `${reason}${
                        actorRole === "admin" ? " (admin override)" : ""
                      }`,
                    },
                  ],
                },
          ),
        }));

        clearRetryTimer(orderId);
        clearDriverResponseTimer(orderId);
        if (order.driverId) {
          useDriverStore.getState().releaseOrderFromDriver(order.driverId);
        }

        get().setAssignmentStatus(orderId, {
          state: "cancelled",
          message: `Cancelled: ${reason}`,
        });

        socket.emit("order-status-update", {
          orderId,
          status: ORDER_STATUS.CANCELLED,
          updatedAt: now,
        });
        socket.emit("order-cancelled", {
          orderId,
          statusBeforeCancellation: order.status,
          cancelledAt: now,
          cancelledBy: actorRole,
          cancelReason: reason,
          driverId: order.driverId,
          customerId: order.customerId,
          partialRefundAmount,
        });
        socket.emit("heatmap-updated", {
          reason: "order-cancelled",
          orderId,
          timestamp: now,
        });

        useDriverStore.getState().syncActiveOrderCounts(get().orders);

        return {
          success: true,
          partialRefundAmount,
          message:
            partialRefundAmount > 0
              ? `Cancellation completed. Refund: $${partialRefundAmount.toFixed(
                  2,
                )}`
              : "Cancellation completed",
        };
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

      updateTrackingMeta: (orderId, patch) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  ...patch,
                  updatedAt: patch.updatedAt || o.updatedAt,
                }
              : o,
          ),
        }));
      },

      getDelayedOrders: () => get().orders.filter((o) => o.isDelayed),

      getDelayAnalytics: () => {
        const delayedOrders = get().orders.filter((o) => o.isDelayed);
        const totalDelay = delayedOrders.reduce(
          (sum, order) => sum + Number(order.delayMinutes || 0),
          0,
        );

        return {
          delayedCount: delayedOrders.length,
          averageDelayMinutes:
            delayedOrders.length > 0
              ? Math.round(totalDelay / delayedOrders.length)
              : 0,
        };
      },

      getCancellationAnalytics: () => {
        const { orders, cancellationHistory } = get();
        const cancelledOrders = orders.filter(
          (order) => order.status === ORDER_STATUS.CANCELLED,
        );

        const reasonCounts = cancelledOrders.reduce((acc, order) => {
          const reason = order.cancelReason || "Unspecified";
          acc[reason] = (acc[reason] || 0) + 1;
          return acc;
        }, {});

        const cancelledByCounts = cancelledOrders.reduce((acc, order) => {
          const key = order.cancelledBy || "unknown";
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        const frequentCustomers = cancelledOrders.reduce((acc, order) => {
          const customerKey =
            order.customerId || order.customerName || "unknown";
          acc[customerKey] = (acc[customerKey] || 0) + 1;
          return acc;
        }, {});

        return {
          cancelledCount: cancelledOrders.length,
          totalAttempts: cancellationHistory.length,
          reasonCounts,
          cancelledByCounts,
          riskyCustomers: Object.entries(frequentCustomers)
            .filter(([, count]) => count >= 2)
            .map(([customerId, count]) => ({ customerId, count }))
            .sort((a, b) => b.count - a.count),
        };
      },

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
            pickupLocation: { lat: 40.7128, lng: -74.006, name: "Restaurant HQ" },
            deliveryLocation: { lat: 40.7306, lng: -73.9352, address: "123 Main St, Springfield" },
            driverId: "d1",
            assignedAt: new Date(Date.now() - 3600000 * 23.8).toISOString(),
            expectedDeliveryTime: new Date(
              Date.now() - 3600000 * 22.4,
            ).toISOString(),
            actualDeliveryTime: new Date(
              Date.now() - 3600000 * 22,
            ).toISOString(),
            onTheWayAt: new Date(Date.now() - 3600000 * 22.3).toISOString(),
            isDelayed: false,
            delayMinutes: 0,
            delayReason: null,
            riskFlags: [],
            lastLocationUpdateAt: new Date(
              Date.now() - 3600000 * 22.1,
            ).toISOString(),
            driver: {
              id: "d1",
              name: "Ahmed Driver",
              rating: 4.9,
              vehicleType: "Motorcycle",
              phone: "+20 123-456-7890",
              currentLocation: { lat: 40.7306, lng: -73.9352 }
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
            pickupLocation: { lat: 40.7128, lng: -74.006, name: "Restaurant HQ" },
            deliveryLocation: { lat: 40.7228, lng: -74.016, address: "456 Oak Ave, Springfield" },
            driverId: "d2",
            assignedAt: new Date(Date.now() - 1500000).toISOString(),
            expectedDeliveryTime: new Date(Date.now() - 300000).toISOString(),
            actualDeliveryTime: null,
            onTheWayAt: new Date(Date.now() - 600000).toISOString(),
            isDelayed: true,
            delayMinutes: 5,
            delayReason: "ETA passed",
            riskFlags: [],
            lastLocationUpdateAt: new Date(Date.now() - 10000).toISOString(),
            driver: {
              id: "d2",
              name: "Maria Garcia",
              rating: 4.6,
              vehicleType: "Bicycle",
              phone: "+1 555-0104",
              currentLocation: { lat: 40.7188, lng: -74.01 }
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
        cancellationAttemptsByOrder: state.cancellationAttemptsByOrder,
        cancellationHistory: state.cancellationHistory,
      }),
    },
  ),
);

export default useOrderStore;
