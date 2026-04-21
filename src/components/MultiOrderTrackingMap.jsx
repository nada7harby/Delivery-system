import { useMemo, useState } from "react";
import clsx from "clsx";

const padding = 0.005;

const normalize = (lat, lng, bounds) => {
  const x =
    ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng || 1)) * 100;
  const y =
    ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat || 1)) * 100;
  return {
    x: Math.min(Math.max(x, 4), 96),
    y: Math.min(Math.max(y, 4), 96),
  };
};

const toEtaMinutes = (order) => {
  if (!order.expectedDeliveryTime) return "--";
  const diff = Math.ceil(
    (new Date(order.expectedDeliveryTime).getTime() - Date.now()) / 60000,
  );
  return diff > 0 ? `${diff} min` : `+${Math.abs(diff)} min`;
};

const MultiOrderTrackingMap = ({
  orders,
  driverLocations,
  height = "h-[70vh]",
  className = "",
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const points = useMemo(() => {
    const all = [];
    orders.forEach((order) => {
      const driverPoint =
        driverLocations[order.driverId] || order.driver?.currentLocation;
      if (driverPoint?.lat && driverPoint?.lng) {
        all.push({ lat: driverPoint.lat, lng: driverPoint.lng });
      }
      if (order.deliveryLocation?.lat && order.deliveryLocation?.lng) {
        all.push({
          lat: order.deliveryLocation.lat,
          lng: order.deliveryLocation.lng,
        });
      }
      if (order.pickupLocation?.lat && order.pickupLocation?.lng) {
        all.push({
          lat: order.pickupLocation.lat,
          lng: order.pickupLocation.lng,
        });
      }
    });

    return all;
  }, [orders, driverLocations]);

  const bounds = useMemo(() => {
    if (!points.length) {
      return {
        minLat: 40.7,
        maxLat: 40.74,
        minLng: -74.03,
        maxLng: -73.98,
      };
    }

    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    return {
      minLat: Math.min(...lats) - padding,
      maxLat: Math.max(...lats) + padding,
      minLng: Math.min(...lngs) - padding,
      maxLng: Math.max(...lngs) + padding,
    };
  }, [points]);

  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) || null;

  return (
    <div
      className={clsx(
        "map-container map-grid relative overflow-hidden",
        height,
        className,
      )}
    >
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute w-full h-px bg-white"
            style={{ top: `${(i + 1) * 14.2}%` }}
          />
        ))}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute h-full w-px bg-white"
            style={{ left: `${(i + 1) * 14.2}%` }}
          />
        ))}
      </div>

      <svg
        className="absolute inset-0 w-full h-full z-[1]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {orders.map((order) => {
          const driverPoint =
            driverLocations[order.driverId] || order.driver?.currentLocation;
          const customerPoint = order.deliveryLocation;
          if (!driverPoint?.lat || !customerPoint?.lat) return null;

          const from = normalize(driverPoint.lat, driverPoint.lng, bounds);
          const to = normalize(customerPoint.lat, customerPoint.lng, bounds);

          return (
            <line
              key={`route-${order.id}`}
              x1={`${from.x}%`}
              y1={`${from.y}%`}
              x2={`${to.x}%`}
              y2={`${to.y}%`}
              stroke={order.isDelayed ? "#ef4444" : "#A31D1D"}
              strokeWidth="0.4"
              strokeDasharray="2 2"
              opacity="0.6"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
      </svg>

      {orders.map((order) => {
        const driverPoint =
          driverLocations[order.driverId] || order.driver?.currentLocation;
        if (!driverPoint?.lat || !driverPoint?.lng) return null;

        const position = normalize(driverPoint.lat, driverPoint.lng, bounds);

        return (
          <button
            key={`driver-${order.id}`}
            type="button"
            onClick={() => setSelectedOrderId(order.id)}
            className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-all duration-[4500ms] ease-linear"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          >
            <div className="relative">
              <span
                className={clsx(
                  "absolute inset-0 rounded-full animate-ping",
                  order.isDelayed ? "bg-red-500/50" : "bg-primary/40",
                )}
              />
              <span
                className={clsx(
                  "relative inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-lg shadow-xl",
                  order.isDelayed ? "bg-red-500" : "bg-primary",
                )}
              >
                {order.driver?.vehicleType === "Car" ? "🚗" : "🛵"}
              </span>
            </div>
          </button>
        );
      })}

      {orders.map((order) => {
        if (!order.deliveryLocation?.lat || !order.deliveryLocation?.lng)
          return null;
        const position = normalize(
          order.deliveryLocation.lat,
          order.deliveryLocation.lng,
          bounds,
        );

        return (
          <button
            key={`customer-${order.id}`}
            type="button"
            onClick={() => setSelectedOrderId(order.id)}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${position.x}%`, top: `${position.y}%` }}
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white bg-emerald-500 text-base shadow-lg">
              🏠
            </span>
          </button>
        );
      })}

      {selectedOrder && (
        <div className="absolute top-3 left-3 z-30 w-[280px] rounded-xl border border-[#E5D0AC] dark:border-[#3d1a1a] bg-white/95 dark:bg-[#120606]/95 p-3 shadow-2xl">
          <p className="text-xs text-[#9e7272] mb-1">Order Details</p>
          <p className="font-mono text-xs text-primary font-bold">
            {selectedOrder.id}
          </p>
          <div className="mt-2 space-y-1 text-xs text-[#6b4040] dark:text-[#c9a97a]">
            <p>Customer: {selectedOrder.customerName || "Unknown"}</p>
            <p>Driver: {selectedOrder.driver?.name || "Unassigned"}</p>
            <p>Status: {selectedOrder.status}</p>
            <p>ETA: {toEtaMinutes(selectedOrder)}</p>
            <p
              className={
                selectedOrder.isDelayed
                  ? "text-red-500 font-semibold"
                  : "text-emerald-600 dark:text-emerald-400"
              }
            >
              Delay: {selectedOrder.isDelayed ? "Delayed" : "On Time"}
            </p>
          </div>
        </div>
      )}

      <div className="absolute bottom-3 left-3 z-30 rounded-lg bg-black/60 px-2 py-1.5 text-[10px] text-white">
        <div className="flex items-center gap-2">
          <span>🛵</span>
          <span>Driver</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🏠</span>
          <span>Customer</span>
        </div>
      </div>
    </div>
  );
};

export default MultiOrderTrackingMap;
