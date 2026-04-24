import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  useOrderStore,
  useAuthStore,
  useAppStore,
  useDriverStore,
  useTrackingStore,
} from "@/store";
import { DashboardLayout } from "@/layouts";
import { Card, Badge, Button } from "@/components";
import { ORDER_STATUS } from "@/constants";
import { socket } from "@/services";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSyncAlt,
  faCoins,
  faCheckCircle,
  faStar,
  faBed,
  faFire,
  faHome,
  faClock,
  faInbox,
  faPizzaSlice,
  faHamburger,
  faChevronRight,
} from "@/utils/icons";
import clsx from "clsx";

const DriverDashboard = () => {
  const { user } = useAuthStore();
  const { orders, seedOrders, handleDriverOffline } = useOrderStore();
  const { addToast } = useAppStore();
  const {
    isOnline,
    setOnlineStatus,
    getDriverByUser,
    setStatus,
    getDriverById,
  } = useDriverStore();
  const { upsertDriverLocation, delayedOrderIds } = useTrackingStore();

  const loggedDriver = getDriverByUser(user); // current driver profile

  useEffect(() => {
    seedOrders(user?.id);
  }, [seedOrders, user?.id]);

  useEffect(() => {
    const onDriverAssigned = (payload) => {
      if (!payload?.driverId || payload.driverId !== loggedDriver?.id) return;
      addToast({
        type: "info",
        title: "New order assigned to you",
        message: `Order ${payload.orderId} has been auto-assigned.`,
      });
    };

    const onOrderCancelled = (payload) => {
      if (!payload?.driverId || payload.driverId !== loggedDriver?.id) return;
      addToast({
        type: "warning",
        title: "Order cancelled",
        message: `Order ${payload.orderId} was cancelled by ${
          payload.cancelledBy || "ops"
        }.`,
      });
    };

    socket.on("driver-assigned", onDriverAssigned);
    socket.on("order-cancelled", onOrderCancelled);
    return () => {
      socket.off("driver-assigned", onDriverAssigned);
      socket.off("order-cancelled", onOrderCancelled);
    };
  }, [addToast, loggedDriver?.id]);

  const myOrders = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.driverId === loggedDriver?.id || o.driver?.id === loggedDriver?.id,
      ),
    [orders, loggedDriver?.id],
  );

  const pendingOrders = useMemo(
    () =>
      orders.filter((o) => o.status === ORDER_STATUS.PENDING && !o.driverId),
    [orders],
  );

  const activeOrders = myOrders.filter(
    (o) =>
      o.status !== ORDER_STATUS.DELIVERED &&
      o.status !== ORDER_STATUS.CANCELLED,
  );
  const completedToday = myOrders.filter((o) => {
    const isDelivered = o.status === ORDER_STATUS.DELIVERED;
    const isToday =
      new Date(o.createdAt).toDateString() === new Date().toDateString();
    return isDelivered && isToday;
  });

  const dailyEarnings = completedToday.reduce(
    (sum, o) => sum + o.total * 0.15,
    0,
  ); // 15% commission mock

  const delayedMyOrders = activeOrders.filter((order) =>
    delayedOrderIds.includes(order.id),
  );

  useEffect(() => {
    if (!isOnline || !loggedDriver?.id) return;

    const interval = setInterval(() => {
      const freshDriver = getDriverById(loggedDriver.id);
      if (!freshDriver) return;

      const movingOrder = activeOrders.find((order) => order.deliveryLocation);
      const current = freshDriver.currentLocation || {
        lat: freshDriver.lat,
        lng: freshDriver.lng,
      };

      let nextLocation = current;
      if (movingOrder?.deliveryLocation) {
        const target = movingOrder.deliveryLocation;
        nextLocation = {
          lat: current.lat + (target.lat - current.lat) * 0.12,
          lng: current.lng + (target.lng - current.lng) * 0.12,
        };
      } else {
        nextLocation = {
          lat: current.lat + (Math.random() - 0.5) * 0.0015,
          lng: current.lng + (Math.random() - 0.5) * 0.0015,
        };
      }

      upsertDriverLocation({
        driverId: loggedDriver.id,
        lat: nextLocation.lat,
        lng: nextLocation.lng,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [
    activeOrders,
    getDriverById,
    isOnline,
    loggedDriver?.id,
    upsertDriverLocation,
  ]);

  const stats = [
    {
      label: "Active Orders",
      value: activeOrders.length,
      icon: faSyncAlt,
      color: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",
    },
    {
      label: "Today's Earnings",
      value: `$${dailyEarnings.toFixed(2)}`,
      icon: faCoins,
      color:
        "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Completed Today",
      value: completedToday.length,
      icon: faCheckCircle,
      color:
        "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300",
    },
    {
      label: "My Rating",
      value: <>{loggedDriver?.rating || "4.9"} <FontAwesomeIcon icon={faStar} className="text-amber-400 text-xs" /></>,
      icon: faStar,
      color:
        "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300",
    },
  ];

  const statsWithIcons = stats.map(s => ({...s, icon: <FontAwesomeIcon icon={s.icon} />}));

  const handleToggleOnline = () => {
    const newStatus = !isOnline;
    setOnlineStatus(newStatus);

    if (loggedDriver?.id) {
      setStatus(loggedDriver.id, newStatus ? "online" : "offline");
      if (!newStatus) {
        handleDriverOffline(loggedDriver.id);
      }
    }

    addToast({
      type: newStatus ? "success" : "info",
      title: newStatus ? "You are Online!" : "You are Offline",
      message: newStatus
        ? "You can now receive new order assignments."
        : "Go online to start receiving orders.",
    });
  };

  return (
    <DashboardLayout role="driver">
      {/* Header & Status Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-black text-[#1a0a0a] dark:text-[#f8f8f8]">
            Hello, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-[#6b4040] dark:text-[#c9a97a] mt-1 font-medium italic">
            Ready for your shifts today?
          </p>
        </div>

        <button
          onClick={handleToggleOnline}
          className={clsx(
            "flex items-center gap-3 px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-lg",
            isOnline
              ? "bg-emerald-500 text-white shadow-emerald-500/20 hover:bg-emerald-600"
              : "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700",
          )}
        >
          <div
            className={clsx(
              "w-3 h-3 rounded-full animate-pulse",
              isOnline ? "bg-white" : "bg-gray-400",
            )}
          />
          {isOnline ? "ONLINE" : "OFFLINE"}
          <span className="text-sm font-normal opacity-80">
            | Click to toggle
          </span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {statsWithIcons.map((stat) => (
          <Card
            key={stat.label}
            className={clsx(stat.color, "border-none shadow-sm")}
          >
            <div className="flex flex-col gap-1">
              <span className="text-2xl mb-1">{stat.icon}</span>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-60">
                {stat.label}
              </p>
              <p className="text-2xl font-black">{stat.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {delayedMyOrders.length > 0 && (
        <Card className="mb-8 border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/20">
          <p className="font-bold text-amber-700 dark:text-amber-300">
            You are running late on {delayedMyOrders.length} order(s). Please
            prioritize these deliveries.
          </p>
        </Card>
      )}

      {!isOnline && (
        <Card className="mb-8 border-dashed border-2 border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 text-center py-12">
          <div className="text-5xl mb-4 text-primary/20"><FontAwesomeIcon icon={faBed} /></div>
          <h2 className="text-xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-2">
            You are currently offline
          </h2>
          <p className="text-[#6b4040] dark:text-[#c9a97a] max-w-xs mx-auto mb-6">
            Go online to see available orders in your area and start earning.
          </p>
          <Button onClick={handleToggleOnline} variant="primary">
            Go Online Now
          </Button>
        </Card>
      )}

      <div
        className={clsx(
          "grid lg:grid-cols-2 gap-8 transition-opacity duration-300",
          !isOnline && "opacity-40 grayscale pointer-events-none",
        )}
      >
        {/* Active Deliveries */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-black text-[#1a0a0a] dark:text-[#f8f8f8] flex items-center gap-2">
              <span className="text-primary"><FontAwesomeIcon icon={faFire} /></span> Active Deliveries
            </h2>
            <Link
              to="/driver/orders"
              className="text-xs font-bold text-primary hover:underline"
            >
              View History
            </Link>
          </div>

          <div className="space-y-4">
            {activeOrders.length === 0 ? (
              <Card className="text-center py-10 bg-white/40 dark:bg-black/20 border-gray-100 dark:border-gray-800">
                <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
                  No active tasks. Tap an available order to start.
                </p>
              </Card>
            ) : (
              activeOrders.map((order) => (
                <Link key={order.id} to={`/driver/order/${order.id}`}>
                  <Card hover className="group p-4 border-l-4 border-l-primary">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-black text-sm text-[#1a0a0a] dark:text-[#f8f8f8]">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <Badge status={order.status} size="sm" />
                    </div>
                    <div className="space-y-2 mb-4">
                      <p className="text-xs flex items-center gap-2 text-[#6b4040] dark:text-[#c9a97a]">
                        <span className="w-4"><FontAwesomeIcon icon={faHome} /></span>
                        <span className="truncate">
                          {order.customerAddress}
                        </span>
                      </p>
                      <p className="text-xs flex items-center gap-2 text-[#6b4040] dark:text-[#c9a97a]">
                        <span className="w-4"><FontAwesomeIcon icon={faClock} /></span>
                        <span>
                          Ordered{" "}
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-800/50">
                      <span className="font-bold text-primary">
                        ${order.total?.toFixed(2)}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-primary transition-colors flex items-center gap-1">
                        START NAVIGATION <FontAwesomeIcon icon={faChevronRight} className="text-[8px]" />
                      </span>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Incoming/Available Orders */}
        <section>
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-black text-[#1a0a0a] dark:text-[#f8f8f8] flex items-center gap-2">
              <span className="text-amber-500"><FontAwesomeIcon icon={faInbox} /></span> Available Near You
            </h2>
          </div>

          <div className="space-y-4">
            {pendingOrders.length === 0 ? (
              <Card className="text-center py-10 bg-white/40 dark:bg-black/20 border-gray-100 dark:border-gray-800">
                <div className="animate-spin-slow inline-block mb-2 text-3xl text-primary/20"><FontAwesomeIcon icon={faPizzaSlice} /></div>
                <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
                  Scanning for new orders...
                </p>
              </Card>
            ) : (
              pendingOrders.map((order) => (
                <Link key={order.id} to={`/driver/order/${order.id}`}>
                  <Card
                    hover
                    className="bg-amber-50/30 dark:bg-amber-900/5 border-amber-100/50 dark:border-amber-900/20 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-black text-sm">
                        #{order.id.slice(-6).toUpperCase()}
                      </span>
                      <div className="px-2 py-0.5 bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-200 text-[10px] font-black rounded uppercase">
                        NEW
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center text-xl shadow-sm">
                        {order.items?.[0]?.image ? (
                           <img src={order.items[0].image} alt="Dish" className="w-full h-full object-cover" />
                        ) : (
                           <FontAwesomeIcon icon={faHamburger} className="text-primary/20" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1a0a0a] dark:text-[#f8f8f8] truncate">
                          {order.customerAddress}
                        </p>
                        <p className="text-[10px] text-[#9e7272]">
                          {order.items?.length} items · ~1.2 km
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-gray-400 uppercase">
                          Estimated Pay
                        </span>
                        <span className="font-black text-emerald-600 text-lg">
                          ${(order.total * 0.15).toFixed(2)}
                        </span>
                      </div>
                      <Button variant="primary" size="sm" className="px-6">
                        Review
                      </Button>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

export default DriverDashboard;
