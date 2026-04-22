import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import {
  ArrowUpRight,
  PackageSearch,
  Repeat2,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import {
  useOrderStore,
  useAuthStore,
  useCartStore,
  useAppStore,
} from "@/store";
import { CustomerLayout } from "@/layouts";
import { Button, Card, Badge, EmptyState } from "@/components";
import { ORDER_STATUS } from "@/constants";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: ORDER_STATUS.DELIVERED, label: "Delivered" },
  { key: ORDER_STATUS.CANCELLED, label: "Cancelled" },
];

const itemVariants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
};

const isActiveOrder = (status) => {
  return status !== ORDER_STATUS.DELIVERED && status !== ORDER_STATUS.CANCELLED;
};

const OrderCard = ({ order }) => {
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { addToast } = useAppStore();

  const handleReorder = (event) => {
    event.stopPropagation();
    order.items.forEach((item) => {
      addItem(item);
    });
    addToast({
      type: "success",
      title: "Reordered",
      message: "Items from this order were added to your cart.",
    });
    navigate("/cart");
  };

  return (
    <Motion.div variants={itemVariants}>
      <Card
        hover
        className="cursor-pointer rounded-3xl border-white/60 bg-white/85 shadow-lg backdrop-blur-sm dark:border-[#284754] dark:bg-[#17303b]/80"
        onClick={() => navigate(`/order/${order.id}`)}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ff8e42] to-[#f2552c] items-center justify-center text-white">
            <ShoppingBag size={22} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-display font-bold text-[#0f2a35] dark:text-[#f2fbff]">
                    Order #{order.id}
                  </h3>
                  <Badge status={order.status} />
                </div>
                <p className="text-xs text-[#6c8794] dark:text-[#9fb9c6]">
                  {new Date(order.createdAt).toLocaleDateString()} at{" "}
                  {new Date(order.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="font-black text-xl text-[#f2552c]">
                  ${order.total?.toFixed(2)}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-[#6c8794] dark:text-[#9fb9c6]">
                  {order.items?.length} items
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
              {order.items.slice(0, 5).map((item, index) => (
                <div
                  key={`${order.id}-${item.id}-${index}`}
                  className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-white/40"
                  title={item.name}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {order.items.length > 5 && (
                <span className="text-xs font-semibold text-[#6c8794] dark:text-[#9fb9c6]">
                  +{order.items.length - 5} more
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-initial"
                onClick={() => navigate(`/order/${order.id}`)}
              >
                <span className="inline-flex items-center gap-1">
                  Track <ArrowUpRight size={14} />
                </span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 sm:flex-initial"
                onClick={handleReorder}
              >
                <span className="inline-flex items-center gap-1">
                  Reorder <Repeat2 size={14} />
                </span>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </Motion.div>
  );
};

const CustomerOrdersPage = () => {
  const { user } = useAuthStore();
  const { getOrdersByCustomer } = useOrderStore();
  const [filter, setFilter] = useState("all");

  const allOrders = useMemo(() => {
    return getOrdersByCustomer(user?.id).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [getOrdersByCustomer, user?.id]);

  const orders = useMemo(() => {
    if (filter === "all") return allOrders;
    if (filter === "active") {
      return allOrders.filter((order) => isActiveOrder(order.status));
    }
    return allOrders.filter((order) => order.status === filter);
  }, [allOrders, filter]);

  return (
    <CustomerLayout>
      <section className="max-w-5xl mx-auto px-4 py-8">
        <Motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] p-6 bg-gradient-to-r from-[#102a36] via-[#154457] to-[#1e5f78] text-white shadow-2xl"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-white/70 inline-flex items-center gap-2">
            <Sparkles size={13} /> Customer Portal
          </p>
          <h1 className="font-display text-3xl font-black mt-2">
            Order Command Center
          </h1>
          <p className="text-sm text-white/80 mt-2">
            Review every order, track live progress, and reorder in one tap.
          </p>
          <div className="mt-5 inline-flex px-3 py-1 rounded-xl bg-white/15 text-sm font-semibold">
            Total orders: {allOrders.length}
          </div>
        </Motion.div>

        {allOrders.length > 0 && (
          <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {FILTERS.map((option) => (
              <button
                key={option.key}
                onClick={() => setFilter(option.key)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filter === option.key
                    ? "bg-[#f2552c] text-white"
                    : "bg-white/80 text-[#24404d] hover:bg-white dark:bg-[#18323e] dark:text-[#b7d2de]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        <div className="mt-6">
          {orders.length === 0 ? (
            <EmptyState
              icon="🍽️"
              title={
                allOrders.length === 0
                  ? "No orders yet"
                  : "No orders in this filter"
              }
              description={
                allOrders.length === 0
                  ? "Start exploring restaurants and place your first order."
                  : "Try a different status filter to see your orders."
              }
              action={
                <Link to="/">
                  <Button variant="primary" size="lg">
                    Explore Restaurants
                  </Button>
                </Link>
              }
            />
          ) : (
            <Motion.div
              initial="initial"
              animate="animate"
              transition={{ staggerChildren: 0.06 }}
              className="grid gap-5"
            >
              {orders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </Motion.div>
          )}
        </div>

        {allOrders.length > 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-[#bcd0da] dark:border-[#35525f] p-4 flex items-center gap-3 text-sm text-[#426170] dark:text-[#9fb9c6]">
            <PackageSearch size={16} />
            Orders update in real time. Open any card to view live tracking and
            timeline events.
          </div>
        )}
      </section>
    </CustomerLayout>
  );
};

export default CustomerOrdersPage;
