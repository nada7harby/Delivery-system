import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/layouts";
import { Card } from "@/components";
import MultiOrderTrackingMap from "@/components/MultiOrderTrackingMap";
import {
  useAppStore,
  useAuthStore,
  useOrderStore,
  useTrackingStore,
} from "@/store";
import { ORDER_STATUS } from "@/constants";
import { socket } from "@/services";

const AdminLiveTrackingPage = () => {
  const { user } = useAuthStore();
  const { addToast } = useAppStore();
  const { orders, seedOrders, getDelayAnalytics } = useOrderStore();
  const {
    driverLocations,
    delayedOrderIds,
    riskOrderIds,
    delayedAlerts,
    upsertDriverLocation,
    startDelayMonitoring,
    processDelayChecks,
  } = useTrackingStore();

  useEffect(() => {
    seedOrders(user?.id);
  }, [seedOrders, user?.id]);

  useEffect(() => {
    startDelayMonitoring();
    processDelayChecks();

    // Simulation for demo: update driver locations periodically
    const simInterval = setInterval(() => {
      // Use getState() to avoid dependency loop and get fresh data
      const currentOrders = useOrderStore.getState().orders;
      const currentDriverLocations = useTrackingStore.getState().driverLocations;

      const activeOrders = currentOrders.filter(
        (o) =>
          o.status !== ORDER_STATUS.DELIVERED &&
          o.status !== ORDER_STATUS.CANCELLED,
      );

      activeOrders.forEach((order) => {
        if (!order.driverId) return;
        
        const currentLoc = currentDriverLocations[order.driverId] || order.driver?.currentLocation;
        if (!currentLoc) return;

        // Move slightly toward customer or just random jitter if already there
        const target = order.deliveryLocation || currentLoc;
        
        const nextLat = currentLoc.lat + (target.lat - currentLoc.lat) * 0.1 + (Math.random() - 0.5) * 0.0002;
        const nextLng = currentLoc.lng + (target.lng - currentLoc.lng) * 0.1 + (Math.random() - 0.5) * 0.0002;

        upsertDriverLocation({
          driverId: order.driverId,
          lat: nextLat,
          lng: nextLng,
          timestamp: new Date().toISOString()
        }, { emit: false });
      });
    }, 5000);

    const onOrderDelayed = (payload) => {
      addToast({
        type: "warning",
        title: `Delayed order ${payload.orderId}`,
        message: "Delivery ETA exceeded. Dispatch team should intervene.",
      });
    };

    socket.on("order-delayed", onOrderDelayed);
    return () => {
      clearInterval(simInterval);
      socket.off("order-delayed", onOrderDelayed);
    };
  }, [addToast, processDelayChecks, startDelayMonitoring, upsertDriverLocation]);

  const activeOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status !== ORDER_STATUS.DELIVERED &&
          order.status !== ORDER_STATUS.CANCELLED,
      ),
    [orders],
  );

  const delayedOrders = useMemo(
    () => activeOrders.filter((order) => delayedOrderIds.includes(order.id)),
    [activeOrders, delayedOrderIds],
  );

  const riskOrders = useMemo(
    () => activeOrders.filter((order) => riskOrderIds.includes(order.id)),
    [activeOrders, riskOrderIds],
  );

  const delayAnalytics = getDelayAnalytics();

  return (
    <DashboardLayout role="admin">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
            Live Multi Tracking Control Center
          </h1>
          <p className="text-sm text-[#6b4040] dark:text-[#c9a97a] mt-1">
            Monitor all active orders, moving drivers, and delay events in
            real-time.
          </p>
        </div>
        <Link
          to="/admin/orders"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-light"
        >
          Open Orders Desk
        </Link>
      </div>

      {delayedOrders.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
          {delayedOrders.map((order) => (
            <p key={order.id}>
              Order {order.id} is delayed and requires intervention.
            </p>
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card padding="p-0" className="overflow-hidden">
          <MultiOrderTrackingMap
            orders={activeOrders}
            driverLocations={driverLocations}
            height="h-[calc(100vh-220px)]"
          />
        </Card>

        <div className="space-y-4">
          <Card>
            <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
              Delay Insights
            </h2>
            <div className="mt-3 space-y-2 text-sm">
              <p className="flex items-center justify-between text-[#6b4040] dark:text-[#c9a97a]">
                <span>Delayed Orders</span>
                <span className="font-bold text-red-500">
                  {delayAnalytics.delayedCount}
                </span>
              </p>
              <p className="flex items-center justify-between text-[#6b4040] dark:text-[#c9a97a]">
                <span>Average Delay</span>
                <span className="font-bold">
                  {delayAnalytics.averageDelayMinutes} min
                </span>
              </p>
              <p className="flex items-center justify-between text-[#6b4040] dark:text-[#c9a97a]">
                <span>Risk Flags</span>
                <span className="font-bold text-amber-500">
                  {riskOrderIds.length}
                </span>
              </p>
            </div>
          </Card>

          <Card>
            <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
              Delayed Orders
            </h2>
            <div className="mt-3 max-h-[220px] space-y-2 overflow-y-auto pr-1">
              {delayedOrders.length === 0 ? (
                <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
                  No delayed orders right now.
                </p>
              ) : (
                delayedOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/admin/order/${order.id}`}
                    className="block rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm dark:border-red-900/40 dark:bg-red-900/20"
                  >
                    <p className="font-mono text-xs font-bold text-red-600 dark:text-red-300">
                      {order.id}
                    </p>
                    <p className="text-[#6b4040] dark:text-[#c9a97a]">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-red-500">
                      {order.delayReason || "Delivery behind schedule"}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
              Risk Flags
            </h2>
            <div className="mt-3 max-h-[180px] space-y-2 overflow-y-auto pr-1">
              {riskOrders.length === 0 ? (
                <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
                  No risk signals detected.
                </p>
              ) : (
                riskOrders.map((order) => (
                  <div
                    key={`risk-${order.id}`}
                    className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs dark:border-amber-900/40 dark:bg-amber-900/20"
                  >
                    <p className="font-mono font-bold text-amber-700 dark:text-amber-300">
                      {order.id}
                    </p>
                    <p className="text-[#6b4040] dark:text-[#c9a97a]">
                      {(order.riskFlags || []).join(" • ") ||
                        "Potential operational risk"}
                    </p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
              Recent Delay Alerts
            </h2>
            <div className="mt-3 max-h-[180px] space-y-2 overflow-y-auto pr-1">
              {delayedAlerts.length === 0 ? (
                <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
                  No alerts yet.
                </p>
              ) : (
                delayedAlerts.slice(0, 8).map((alert) => (
                  <p
                    key={`${alert.orderId}-${alert.at}`}
                    className="rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                  >
                    {alert.message}
                  </p>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminLiveTrackingPage;
