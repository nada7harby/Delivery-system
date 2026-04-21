import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_DRIVERS } from "@/constants/mockData";

const normalizeDriver = (driver) => {
  const isLegacyAvailable = driver.status === "available";
  const isLegacyBusy = driver.status === "busy";
  const isOnline =
    driver.status === "online" || isLegacyAvailable || isLegacyBusy;
  const availability =
    driver.availability ||
    (isLegacyAvailable ? "free" : isLegacyBusy ? "busy" : "free");

  return {
    ...driver,
    status: isOnline ? "online" : "offline",
    availability,
    currentLocation: driver.currentLocation || {
      lat: driver.lat,
      lng: driver.lng,
    },
    activeOrdersCount: driver.activeOrdersCount || 0,
    blocked: Boolean(driver.blocked),
    joinedAt:
      driver.joinedAt ||
      new Date(Date.now() - Math.random() * 1e10).toISOString(),
  };
};

const useDriverStore = create(
  persist(
    (set, get) => ({
      drivers: MOCK_DRIVERS.map(normalizeDriver),
      isLoading: false,
      isOnline: true,

      setOnlineStatus: (status) => set({ isOnline: status }),

      // Add driver
      addDriver: (driverData) => {
        const driver = {
          id: `d${Date.now()}`,
          name: driverData.name,
          phone: driverData.phone,
          vehicleType: driverData.vehicleType || "Motorcycle",
          licensePlate: driverData.licensePlate || "",
          rating: 5.0,
          deliveries: 0,
          status: "online",
          availability: "free",
          activeOrdersCount: 0,
          blocked: false,
          joinedAt: new Date().toISOString(),
          lat: 40.71 + (Math.random() - 0.5) * 0.1,
          lng: -74.01 + (Math.random() - 0.5) * 0.1,
        };
        driver.currentLocation = { lat: driver.lat, lng: driver.lng };
        set((s) => ({ drivers: [...s.drivers, driver] }));
        return driver;
      },

      // Remove driver
      removeDriver: (id) => {
        set((s) => ({ drivers: s.drivers.filter((d) => d.id !== id) }));
      },

      // Block / Unblock
      toggleBlock: (id) => {
        set((s) => ({
          drivers: s.drivers.map((d) =>
            d.id === id ? { ...d, blocked: !d.blocked } : d,
          ),
        }));
      },

      // Update status
      setStatus: (id, status) => {
        set((s) => ({
          drivers: s.drivers.map((d) =>
            d.id === id
              ? {
                  ...d,
                  status,
                  availability:
                    status === "offline"
                      ? "busy"
                      : (d.activeOrdersCount || 0) > 0
                      ? "busy"
                      : "free",
                }
              : d,
          ),
        }));
      },

      setAvailability: (id, availability) => {
        set((s) => ({
          drivers: s.drivers.map((d) =>
            d.id === id ? { ...d, availability } : d,
          ),
        }));
      },

      setCurrentLocation: (id, location) => {
        set((s) => ({
          drivers: s.drivers.map((d) =>
            d.id === id
              ? {
                  ...d,
                  currentLocation: location,
                  lat: location?.lat,
                  lng: location?.lng,
                }
              : d,
          ),
        }));
      },

      assignOrderToDriver: (id) => {
        set((s) => ({
          drivers: s.drivers.map((d) =>
            d.id === id
              ? {
                  ...d,
                  status: "online",
                  availability: "busy",
                  activeOrdersCount: (d.activeOrdersCount || 0) + 1,
                }
              : d,
          ),
        }));
      },

      releaseOrderFromDriver: (id) => {
        set((s) => ({
          drivers: s.drivers.map((d) => {
            if (d.id !== id) return d;

            const nextActiveCount = Math.max(0, (d.activeOrdersCount || 0) - 1);
            return {
              ...d,
              activeOrdersCount: nextActiveCount,
              availability:
                d.status === "online" && nextActiveCount === 0
                  ? "free"
                  : d.availability,
            };
          }),
        }));
      },

      syncActiveOrderCounts: (orders = []) => {
        const activeStatuses = new Set([
          "confirmed",
          "preparing",
          "ready",
          "picked_up",
          "on_the_way",
        ]);

        const countMap = orders.reduce((acc, order) => {
          if (!order.driverId || !activeStatuses.has(order.status)) return acc;
          acc[order.driverId] = (acc[order.driverId] || 0) + 1;
          return acc;
        }, {});

        set((s) => ({
          drivers: s.drivers.map((d) => {
            const nextActiveCount = countMap[d.id] || 0;
            return {
              ...d,
              activeOrdersCount: nextActiveCount,
              availability:
                d.status === "online"
                  ? nextActiveCount > 0
                    ? "busy"
                    : "free"
                  : d.availability,
            };
          }),
        }));
      },

      // Update stats (deliveries, rating)
      incrementDeliveries: (id) => {
        set((s) => ({
          drivers: s.drivers.map((d) =>
            d.id === id ? { ...d, deliveries: (d.deliveries || 0) + 1 } : d,
          ),
        }));
      },

      getDriverById: (id) => get().drivers.find((d) => d.id === id),

      getDriverByUser: (user) => {
        if (!user) return null;
        const drivers = get().drivers;

        return (
          drivers.find((d) => d.userId === user.id) ||
          drivers.find((d) => d.id === user.id) ||
          drivers.find((d) => d.name === user.name) ||
          (user.role === "driver"
            ? drivers.find((d) => d.status === "online")
            : null) ||
          null
        );
      },

      getAvailableDrivers: () =>
        get().drivers.filter(
          (d) =>
            d.status === "online" && d.availability === "free" && !d.blocked,
        ),

      getAssignableDrivers: () => get().getAvailableDrivers(),

      getStats: () => {
        const { drivers } = get();
        return {
          total: drivers.length,
          available: drivers.filter(
            (d) =>
              d.status === "online" && d.availability === "free" && !d.blocked,
          ).length,
          busy: drivers.filter(
            (d) =>
              d.status === "online" && d.availability === "busy" && !d.blocked,
          ).length,
          blocked: drivers.filter((d) => d.blocked).length,
          offline: drivers.filter((d) => d.status === "offline" && !d.blocked)
            .length,
        };
      },
    }),
    {
      name: "delivery-drivers",
      partialize: (state) => ({ drivers: state.drivers }),
    },
  ),
);

export default useDriverStore;
