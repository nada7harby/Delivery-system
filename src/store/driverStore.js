import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MOCK_DRIVERS } from "@/constants/mockData";

const useDriverStore = create(
  persist(
    (set, get) => ({
      drivers: MOCK_DRIVERS.map((d) => ({ ...d, blocked: false, joinedAt: new Date(Date.now() - Math.random() * 1e10).toISOString() })),
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
          status: "available",
          blocked: false,
          joinedAt: new Date().toISOString(),
          lat: 40.71 + (Math.random() - 0.5) * 0.1,
          lng: -74.01 + (Math.random() - 0.5) * 0.1,
        };
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
            d.id === id ? { ...d, blocked: !d.blocked } : d
          ),
        }));
      },

      // Update status
      setStatus: (id, status) => {
        set((s) => ({
          drivers: s.drivers.map((d) =>
            d.id === id ? { ...d, status } : d
          ),
        }));
      },

      // Update stats (deliveries, rating)
      incrementDeliveries: (id) => {
        set((s) => ({
          drivers: s.drivers.map((d) =>
            d.id === id ? { ...d, deliveries: (d.deliveries || 0) + 1 } : d
          ),
        }));
      },

      getDriverById: (id) => get().drivers.find((d) => d.id === id),

      getAvailableDrivers: () =>
        get().drivers.filter((d) => d.status === "available" && !d.blocked),

      getStats: () => {
        const { drivers } = get();
        return {
          total: drivers.length,
          available: drivers.filter((d) => d.status === "available" && !d.blocked).length,
          busy: drivers.filter((d) => d.status === "busy").length,
          blocked: drivers.filter((d) => d.blocked).length,
          offline: drivers.filter((d) => d.status === "offline" && !d.blocked).length,
        };
      },
    }),
    {
      name: "delivery-drivers",
      partialize: (state) => ({ drivers: state.drivers }),
    }
  )
);

export default useDriverStore;
