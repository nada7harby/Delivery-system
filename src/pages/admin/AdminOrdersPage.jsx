import { useState } from "react";
import { Link } from "react-router-dom";
import { useOrderStore } from "@/store";
import { DashboardLayout } from "@/layouts";
import { Card, Badge, Button, EmptyState, CustomSelect } from "@/components";
import { ORDER_STATUS, STATUS_LABELS } from "@/constants";

const ALL_STATUSES = ["all", ...Object.values(ORDER_STATUS)];

const AdminOrdersPage = () => {
  const { orders } = useOrderStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = orders
    .filter((o) => {
      const matchSearch =
        !search ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        o.customerAddress?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" || o.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <DashboardLayout role="admin">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
          All Orders 📋
        </h1>
        <p className="text-[#6b4040] dark:text-[#c9a97a] mt-1">
          {filtered.length} of {orders.length} orders
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by order ID, customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>

          {/* Status filter */}
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full sm:w-60"
            options={ALL_STATUSES.map((s) => ({
              value: s,
              label: s === "all" ? "All Statuses" : STATUS_LABELS[s],
              icon: s === "all" ? "📋" : (s === ORDER_STATUS.DELIVERED ? "✅" : (s === ORDER_STATUS.CANCELLED ? "❌" : "⏳"))
            }))}
          />
        </div>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No orders found"
          description="Try adjusting your search or filter"
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
            >
              Clear Filters
            </Button>
          }
        />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Driver</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span className="font-mono font-bold text-primary text-xs">
                      {order.id}
                    </span>
                  </td>
                  <td>
                    <div>
                      <p className="font-medium">{order.customerName || "—"}</p>
                      <p className="text-xs text-[#6b4040] dark:text-[#c9a97a] truncate max-w-[140px]">
                        {order.customerAddress}
                      </p>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm">{order.items?.length || 0} items</span>
                  </td>
                  <td>
                    <span className="font-bold text-primary">
                      ${order.total?.toFixed(2)}
                    </span>
                  </td>
                  <td>
                    <Badge status={order.status} />
                  </td>
                  <td>
                    {order.driver ? (
                      <span className="text-sm">{order.driver.name}</span>
                    ) : (
                      <span className="text-xs text-[#9e7272] italic">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <span className="text-xs text-[#6b4040] dark:text-[#c9a97a]">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <Link to={`/admin/order/${order.id}`}>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminOrdersPage;
