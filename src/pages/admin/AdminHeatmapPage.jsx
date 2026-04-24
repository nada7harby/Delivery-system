import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/layouts";
import { Card, CustomSelect } from "@/components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faClock,
  faCalendarAlt,
  faBox,
  faUtensils,
  faCircle,
} from "@/utils/icons";
import HeatmapSimulationMap from "@/components/HeatmapSimulationMap";
import { useHeatmapStore, useOrderStore, useTrackingStore } from "@/store";
import { ORDER_STATUS, STATUS_LABELS } from "@/constants";
import { socket } from "@/services";

const TIME_OPTIONS = [
  { value: "last-hour", label: "Last Hour", icon: faClock },
  { value: "last-2-hours", label: "Last 2 Hours", icon: faClock },
  { value: "today", label: "Today", icon: faCalendarAlt },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses", icon: faBox },
  ...Object.values(ORDER_STATUS).map((status) => ({
    value: status,
    label: STATUS_LABELS[status],
    icon: faCircle,
  })),
];

const AdminHeatmapPage = () => {
  const { seedOrders } = useOrderStore();
  const { driverLocations } = useTrackingStore();
  const {
    filters,
    viewMode,
    showDrivers,
    isLoadingSnapshot,
    snapshotError,
    setHeatmapFilters,
    setViewMode,
    setShowDrivers,
    getHeatmapPoints,
    getHotZones,
    getRestaurantOptions,
    refreshExternalSnapshot,
    touchHeatmap,
  } = useHeatmapStore();

  const [livePulse, setLivePulse] = useState(false);

  useEffect(() => {
    seedOrders("u1");
    refreshExternalSnapshot();
  }, [refreshExternalSnapshot, seedOrders]);

  useEffect(() => {
    const onHeatmapUpdate = () => {
      touchHeatmap();
      setLivePulse(true);
      setTimeout(() => setLivePulse(false), 1200);
    };

    const onOrderCreated = () => touchHeatmap();
    const onOrderCancelled = () => touchHeatmap();

    socket.on("heatmap-updated", onHeatmapUpdate);
    socket.on("order-created", onOrderCreated);
    socket.on("order-cancelled", onOrderCancelled);

    return () => {
      socket.off("heatmap-updated", onHeatmapUpdate);
      socket.off("order-created", onOrderCreated);
      socket.off("order-cancelled", onOrderCancelled);
    };
  }, [touchHeatmap]);

  const points = getHeatmapPoints();
  const zones = getHotZones();
  const restaurants = getRestaurantOptions();

  const topZones = useMemo(() => zones.slice(0, 3), [zones]);

  return (
    <DashboardLayout role="admin">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
            Demand Heatmap Center
          </h1>
          <p className="text-sm text-[#6b4040] dark:text-[#c9a97a] mt-1">
            Detect high-pressure zones and rebalance drivers in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode("heatmap")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              viewMode === "heatmap"
                ? "bg-primary text-white"
                : "bg-[#E5D0AC]/40 text-[#6b4040] dark:bg-[#3d1a1a]/40 dark:text-[#c9a97a]"
            }`}
          >
            Show Heatmap
          </button>
          <button
            type="button"
            onClick={() => setViewMode("markers")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              viewMode === "markers"
                ? "bg-primary text-white"
                : "bg-[#E5D0AC]/40 text-[#6b4040] dark:bg-[#3d1a1a]/40 dark:text-[#c9a97a]"
            }`}
          >
            Show Markers
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <CustomSelect
          value={filters.timeRange}
          onChange={(value) => setHeatmapFilters({ timeRange: value })}
          options={TIME_OPTIONS}
        />
        <CustomSelect
          value={filters.status}
          onChange={(value) => setHeatmapFilters({ status: value })}
          options={STATUS_OPTIONS}
        />
        <CustomSelect
          value={filters.restaurant}
          onChange={(value) => setHeatmapFilters({ restaurant: value })}
          options={restaurants.map((name) => ({
            value: name,
            label: name === "all" ? "All Restaurants" : name,
            icon: faUtensils,
          }))}
        />
        <label className="flex items-center gap-2 rounded-xl border border-[#E5D0AC] bg-white px-3 py-2.5 text-sm text-[#6b4040] dark:border-[#3d1a1a] dark:bg-[#120606] dark:text-[#c9a97a]">
          <input
            type="checkbox"
            checked={filters.activeOnly}
            onChange={(event) =>
              setHeatmapFilters({ activeOnly: event.target.checked })
            }
          />
          Active Orders Only
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card padding="p-0" className="overflow-hidden">
          <HeatmapSimulationMap
            points={points}
            zones={zones}
            driverLocations={driverLocations}
            mode={viewMode}
            showDrivers={showDrivers}
            height="h-[calc(100vh-250px)]"
          />
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
                Live Summary
              </h2>
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  livePulse ? "bg-emerald-500 animate-ping" : "bg-emerald-500"
                }`}
              />
            </div>
            <div className="mt-3 space-y-2 text-sm text-[#6b4040] dark:text-[#c9a97a]">
              <p className="flex items-center justify-between">
                <span>Active Heat Points</span>
                <span className="font-bold text-primary">{points.length}</span>
              </p>
              <p className="flex items-center justify-between">
                <span>Detected Zones</span>
                <span className="font-bold">{zones.length}</span>
              </p>
              <p className="flex items-center justify-between">
                <span>View</span>
                <span className="font-bold capitalize">{viewMode}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDrivers(!showDrivers)}
              className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs font-semibold text-primary"
            >
              {showDrivers ? "Hide Drivers Overlay" : "Show Drivers Overlay"}
            </button>
            {snapshotError && (
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-300">
                {snapshotError}
              </p>
            )}
            {isLoadingSnapshot && (
              <p className="mt-3 text-xs text-[#6b4040] dark:text-[#c9a97a]">
                Refreshing API snapshot...
              </p>
            )}
          </Card>

          <Card>
            <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
              Hot Zones
            </h2>
            <div className="mt-3 space-y-2">
              {topZones.length === 0 ? (
                <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
                  No recent pressure zones.
                </p>
              ) : (
                topZones.map((zone, index) => (
                  <div
                    key={zone.key}
                    className="rounded-lg border border-[#E5D0AC] bg-[#f8f8f8] px-3 py-2 dark:border-[#3d1a1a] dark:bg-[#120606]"
                  >
                    <p className="text-xs font-bold text-primary">
                      Zone {index + 1}
                    </p>
                    <p className="text-xs text-[#6b4040] dark:text-[#c9a97a]">
                      Orders: {zone.count}
                    </p>
                    <p className="text-xs text-[#6b4040] dark:text-[#c9a97a]">
                      Intensity: {zone.intensity.toFixed(2)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminHeatmapPage;
