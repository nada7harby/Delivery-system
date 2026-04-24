import { useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMotorcycle } from "@/utils/icons";
import clsx from "clsx";

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

const colorByRatio = (ratio) => {
  if (ratio >= 0.7) return "rgba(239,68,68,0.75)";
  if (ratio >= 0.4) return "rgba(249,115,22,0.65)";
  return "rgba(59,130,246,0.55)";
};

const HeatmapSimulationMap = ({
  points,
  zones,
  driverLocations = {},
  mode = "heatmap",
  showDrivers = true,
  height = "h-[70vh]",
  className = "",
}) => {
  const bounds = useMemo(() => {
    const all = [
      ...points.map((point) => ({ lat: point.lat, lng: point.lng })),
      ...Object.values(driverLocations)
        .filter(
          (location) =>
            Number.isFinite(location?.lat) && Number.isFinite(location?.lng),
        )
        .map((location) => ({ lat: location.lat, lng: location.lng })),
    ];

    if (!all.length) {
      return {
        minLat: 40.7,
        maxLat: 40.74,
        minLng: -74.03,
        maxLng: -73.98,
      };
    }

    const lats = all.map((point) => point.lat);
    const lngs = all.map((point) => point.lng);

    return {
      minLat: Math.min(...lats) - 0.005,
      maxLat: Math.max(...lats) + 0.005,
      minLng: Math.min(...lngs) - 0.005,
      maxLng: Math.max(...lngs) + 0.005,
    };
  }, [driverLocations, points]);

  const maxZoneIntensity = Math.max(...zones.map((zone) => zone.intensity), 1);

  return (
    <div
      className={clsx(
        "map-container map-grid relative overflow-hidden",
        height,
        className,
      )}
    >
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`h-${index}`}
            className="absolute w-full h-px bg-white"
            style={{ top: `${(index + 1) * 14.2}%` }}
          />
        ))}
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`v-${index}`}
            className="absolute h-full w-px bg-white"
            style={{ left: `${(index + 1) * 14.2}%` }}
          />
        ))}
      </div>

      {mode === "heatmap" &&
        zones.map((zone) => {
          const position = normalize(zone.lat, zone.lng, bounds);
          const ratio = zone.intensity / maxZoneIntensity;
          const size = 60 + ratio * 90;

          return (
            <div
              key={zone.key}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-xl transition-all duration-700"
              style={{
                left: `${position.x}%`,
                top: `${position.y}%`,
                width: `${size}px`,
                height: `${size}px`,
                background: colorByRatio(ratio),
              }}
            />
          );
        })}

      {mode === "markers" &&
        points.map((point) => {
          const position = normalize(point.lat, point.lng, bounds);
          return (
            <div
              key={`point-${point.orderId}`}
              className="absolute z-20 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
            >
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-white bg-primary text-xs font-black text-white shadow-lg">
                ●
              </span>
            </div>
          );
        })}

      {showDrivers &&
        Object.entries(driverLocations).map(([driverId, location]) => {
          if (
            !Number.isFinite(location?.lat) ||
            !Number.isFinite(location?.lng)
          )
            return null;

          const position = normalize(location.lat, location.lng, bounds);
          return (
            <div
              key={`driver-${driverId}`}
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${position.x}%`, top: `${position.y}%` }}
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-emerald-500 text-sm shadow-xl">
                <FontAwesomeIcon icon={faMotorcycle} className="text-white" />
              </span>
            </div>
          );
        })}

      <div className="absolute bottom-3 left-3 z-40 rounded-lg bg-black/60 px-3 py-2 text-[10px] text-white">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          <span>Low</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-orange-400" />
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span>High</span>
        </div>
      </div>
    </div>
  );
};

export default HeatmapSimulationMap;
