import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  ORDER_STATUS,
  canTransition,
  STATUS_TRANSITIONS,
} from "@/constants/orderStatus";
import { MOCK_DRIVERS } from "@/constants/mockData";

const useOrderStore = create(
  persist(
    (set, get) => ({
      orders: [],
      isLoading: false,
      error: null,

      // Create a new order
      createOrder: (orderData) => {
        const order = {
          id: `ORD-${Date.now()}`,
          ...orderData,
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
          driver: null,
          rating: null,
          estimatedTime: Math.floor(Math.random() * 20) + 25, // 25-45 min
        };

        set({ orders: [...get().orders, order] });
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
              : o
          ),
        });

        return { success: true };
      },

      // Assign driver to order
      assignDriver: (orderId, driverId) => {
        const driver =
          MOCK_DRIVERS.find((d) => d.id === driverId) ||
          { id: driverId, name: "Driver" };
        const { orders } = get();

        set({
          orders: orders.map((o) =>
            o.id === orderId
              ? { ...o, driver, updatedAt: new Date().toISOString() }
              : o
          ),
        });

        // Auto-confirm when driver is assigned
        get().updateOrderStatus(orderId, ORDER_STATUS.CONFIRMED, "Driver assigned");
        return { success: true };
      },

      // Rate an order
      rateOrder: (orderId, rating, comment = "") => {
        const { orders } = get();
        set({
          orders: orders.map((o) =>
            o.id === orderId
              ? { ...o, rating, ratingComment: comment }
              : o
          ),
        });
      },

      // Cancel order
      cancelOrder: (orderId) => {
        return get().updateOrderStatus(orderId, ORDER_STATUS.CANCELLED, "Order cancelled");
      },

      // Get order by id
      getOrderById: (id) => get().orders.find((o) => o.id === id),

      // Get orders by customer
      getOrdersByCustomer: (customerId) =>
        get().orders.filter((o) => o.customerId === customerId),

      // Get orders by driver
      getOrdersByDriver: (driverId) =>
        get().orders.filter((o) => o.driver?.id === driverId),

      // Get active orders (not delivered/cancelled)
      getActiveOrders: () =>
        get().orders.filter(
          (o) =>
            o.status !== ORDER_STATUS.DELIVERED &&
            o.status !== ORDER_STATUS.CANCELLED
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
              o.status !== ORDER_STATUS.CANCELLED
          ).length,
          cancelled: orders.filter(
            (o) => o.status === ORDER_STATUS.CANCELLED
          ).length,
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
            driver: MOCK_DRIVERS[0],
            rating: 5,
            estimatedTime: 0,
            timeline: [
              { status: ORDER_STATUS.PENDING, timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), note: "Order placed" },
              { status: ORDER_STATUS.CONFIRMED, timestamp: new Date(Date.now() - 3600000 * 23.8).toISOString(), note: "Driver assigned" },
              { status: ORDER_STATUS.PREPARING, timestamp: new Date(Date.now() - 3600000 * 23.5).toISOString(), note: "Kitchen confirmed" },
              { status: ORDER_STATUS.DELIVERED, timestamp: new Date(Date.now() - 3600000 * 22).toISOString(), note: "Delivered" },
            ],
          },
          {
            id: "ORD-DEMO002",
            customerId: userId,
            customerName: "Alice Johnson",
            customerAddress: "456 Oak Ave, Springfield",
            items: [
              { id: "p2", name: "Margherita Pizza", price: 16.99, quantity: 1 },
              { id: "p8", name: "Chocolate Lava Cake", price: 7.99, quantity: 2 },
            ],
            subtotal: 32.97,
            deliveryFee: 0,
            tax: 2.64,
            total: 35.61,
            status: ORDER_STATUS.ON_THE_WAY,
            notes: "",
            createdAt: new Date(Date.now() - 1800000).toISOString(),
            updatedAt: new Date(Date.now() - 600000).toISOString(),
            driver: MOCK_DRIVERS[1],
            rating: null,
            estimatedTime: 10,
            timeline: [
              { status: ORDER_STATUS.PENDING, timestamp: new Date(Date.now() - 1800000).toISOString(), note: "Order placed" },
              { status: ORDER_STATUS.CONFIRMED, timestamp: new Date(Date.now() - 1500000).toISOString(), note: "Driver assigned" },
              { status: ORDER_STATUS.PREPARING, timestamp: new Date(Date.now() - 1200000).toISOString(), note: "Preparing" },
              { status: ORDER_STATUS.ON_THE_WAY, timestamp: new Date(Date.now() - 600000).toISOString(), note: "On the way" },
            ],
          },
        ];

        set({ orders: sampleOrders });
      },

      clearError: () => set({ error: null }),
      setLoading: (v) => set({ isLoading: v }),
    }),
    {
      name: "delivery-orders",
      partialize: (state) => ({ orders: state.orders }),
    }
  )
);

export default useOrderStore;
