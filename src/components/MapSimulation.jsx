import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUtensils,
  faMotorcycle,
  faHome,
  faMapMarkerAlt,
} from "@/utils/icons";
import clsx from "clsx";

const GRID_SIZE = 12;

const MapSimulation = ({
  driverLocation,
  customerLocation,
  restaurantLocation,
  height = "h-64",
  className = "",
}) => {
  // Normalize lat/lng to canvas x/y percentage
  const normalize = (lat, lng, bounds) => {
    const x =
      ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y =
      ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { x: Math.min(Math.max(x, 5), 95), y: Math.min(Math.max(y, 5), 95) };
  };

  // Compute bounds from all known locations
  const allLats = [
    driverLocation?.lat,
    customerLocation?.lat,
    restaurantLocation?.lat,
  ].filter(Boolean);
  const allLngs = [
    driverLocation?.lng,
    customerLocation?.lng,
    restaurantLocation?.lng,
  ].filter(Boolean);

  const pad = 0.005;
  const bounds = {
    minLat: Math.min(...allLats) - pad,
    maxLat: Math.max(...allLats) + pad,
    minLng: Math.min(...allLngs) - pad,
    maxLng: Math.max(...allLngs) + pad,
  };

  const driverPos = driverLocation
    ? normalize(driverLocation.lat, driverLocation.lng, bounds)
    : null;
  const customerPos = customerLocation
    ? normalize(customerLocation.lat, customerLocation.lng, bounds)
    : null;
  const restaurantPos = restaurantLocation
    ? normalize(restaurantLocation.lat, restaurantLocation.lng, bounds)
    : null;

  return (
    <div
      className={clsx(
        "map-container map-grid relative overflow-hidden",
        height,
        className
      )}
    >
      {/* Road lines (decorative) */}
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`h${i}`}
            className="absolute w-full h-px bg-white"
            style={{ top: `${(i + 1) * 16.67}%` }}
          />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`v${i}`}
            className="absolute h-full w-px bg-white"
            style={{ left: `${(i + 1) * 16.67}%` }}
          />
        ))}
      </div>

      {/* Route line */}
      {driverPos && customerPos && (
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 1 }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line
            x1={`${driverPos.x}%`}
            y1={`${driverPos.y}%`}
            x2={`${customerPos.x}%`}
            y2={`${customerPos.y}%`}
            stroke="#A31D1D"
            strokeWidth="0.5"
            strokeDasharray="2 2"
            opacity="0.6"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      {/* Restaurant marker */}
      {restaurantPos && (
        <div
          className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `${restaurantPos.x}%`, top: `${restaurantPos.y}%` }}
        >
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg text-lg border-2 border-white">
            <FontAwesomeIcon icon={faUtensils} className="text-white" />
          </div>
          <span className="text-white text-[9px] font-bold mt-0.5 bg-black/50 px-1 rounded">
            Restaurant
          </span>
        </div>
      )}

      {/* Driver marker */}
      {driverPos && (
        <div
          className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-[3000ms] ease-linear"
          style={{ left: `${driverPos.x}%`, top: `${driverPos.y}%` }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping-slow" />
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-glow text-lg border-2 border-white relative z-10">
              <FontAwesomeIcon icon={faMotorcycle} className="text-white" />
            </div>
          </div>
          <span className="text-white text-[9px] font-bold mt-0.5 bg-primary/80 px-1 rounded">
            Driver
          </span>
        </div>
      )}

      {/* Customer marker */}
      {customerPos && (
        <div
          className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
          style={{ left: `${customerPos.x}%`, top: `${customerPos.y}%` }}
        >
          <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg text-lg border-2 border-white">
            <FontAwesomeIcon icon={faHome} className="text-white" />
          </div>
          <span className="text-white text-[9px] font-bold mt-0.5 bg-black/50 px-1 rounded">
            You
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5 z-30">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5 text-white text-[10px]">
            <span><FontAwesomeIcon icon={faMotorcycle} className="text-primary" /></span>
            <span>Driver</span>
          </div>
          <div className="flex items-center gap-1.5 text-white text-[10px]">
            <span><FontAwesomeIcon icon={faHome} className="text-emerald-500" /></span>
            <span>Destination</span>
          </div>
          <div className="flex items-center gap-1.5 text-white text-[10px]">
            <span><FontAwesomeIcon icon={faUtensils} className="text-amber-500" /></span>
            <span>Restaurant</span>
          </div>
        </div>
      </div>

      {/* Simulated map label */}
      <div className="absolute top-2 right-2 bg-black/50 text-white text-[9px] px-2 py-1 rounded-md z-30">
        <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-1" /> Live Simulation
      </div>
    </div>
  );
};

export default MapSimulation;
