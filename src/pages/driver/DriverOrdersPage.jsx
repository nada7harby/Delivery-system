import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrderStore, useAuthStore } from "@/store";
import { DashboardLayout } from "@/layouts";
import { Card, Badge, Button, EmptyState } from "@/components";
import { ORDER_STATUS } from "@/constants";
import clsx from "clsx";

const TABS = [
  { id: "active", label: "Active", icon: "🔄" },
  { id: "available", label: "Available", icon: "📦" },
  { id: "completed", label: "Completed", icon: "✅" },
];

const DriverOrdersPage = () => {
  const { user } = useAuthStore();
  const { orders } = useOrderStore();
  const [activeTab, setActiveTab] = useState("active");

  const myOrders = orders.filter(
    (o) => o.driver?.id === user?.id || o.driver?.name === user?.name
  );
  const pendingOrders = orders.filter(
    (o) => o.status === ORDER_STATUS.PENDING && !o.driver
  );

  const tabs = {
    active: myOrders.filter(
      (o) =>
        o.status !== ORDER_STATUS.DELIVERED &&
        o.status !== ORDER_STATUS.CANCELLED
    ),
    available: pendingOrders,
    completed: myOrders.filter((o) => o.status === ORDER_STATUS.DELIVERED),
  };

  const displayed = tabs[activeTab];

  return (
    <DashboardLayout role="driver">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
          My Orders 📦
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-[#E5D0AC]/30 dark:bg-[#3d1a1a]/30 p-1 rounded-xl w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all",
              activeTab === tab.id
                ? "bg-white dark:bg-[#430000] text-primary shadow-sm"
                : "text-[#6b4040] dark:text-[#c9a97a] hover:text-primary"
            )}
          >
            {tab.icon} {tab.label}
            <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {tabs[tab.id].length}
            </span>
          </button>
        ))}
      </div>

      {displayed.length === 0 ? (
        <EmptyState
          icon={activeTab === "active" ? "😴" : activeTab === "available" ? "🎯" : "📭"}
          title={
            activeTab === "active"
              ? "No active orders"
              : activeTab === "available"
              ? "No orders available"
              : "No completed orders"
          }
          description="Orders will appear here when they're available"
        />
      ) : (
        <div className="space-y-3">
          {displayed.map((order) => (
            <Card key={order.id} hover>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
                      {order.id}
                    </span>
                    <Badge status={order.status} />
                  </div>
                  <div className="space-y-1 text-sm text-[#6b4040] dark:text-[#c9a97a]">
                    <p>👤 {order.customerName}</p>
                    <p className="truncate">📍 {order.customerAddress}</p>
                    <p>
                      {order.items?.length} items · 💰 $
                      {order.total?.toFixed(2)}
                    </p>
                    <p className="text-xs">
                      {new Date(order.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <Link to={`/driver/order/${order.id}`}>
                  <Button variant="primary" size="sm">
                    View →
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DriverOrdersPage;
