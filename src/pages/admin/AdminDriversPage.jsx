import { useState } from "react";
import { useOrderStore, useAppStore, useDriverStore } from "@/store";
import { DashboardLayout } from "@/layouts";
import { Card, Badge, Button, Modal, EmptyState } from "@/components";
import clsx from "clsx";

const VEHICLE_TYPES = ["Motorcycle", "Bicycle", "Car", "Scooter"];

const StatusDot = ({ status, blocked }) => {
  if (blocked)
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400">
        <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
        Blocked
      </span>
    );
  const map = {
    online: {
      dot: "bg-emerald-500",
      text: "Online",
      cls: "text-emerald-600 dark:text-emerald-400",
    },
    busy: {
      dot: "bg-amber-500",
      text: "Busy",
      cls: "text-amber-600 dark:text-amber-400",
    },
    offline: {
      dot: "bg-gray-400",
      text: "Offline",
      cls: "text-gray-500 dark:text-gray-400",
    },
  };
  const m = map[status] || map.offline;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-xs font-semibold",
        m.cls,
      )}
    >
      <span className={clsx("w-1.5 h-1.5 rounded-full", m.dot)} />
      {m.text}
    </span>
  );
};

const StarRating = ({ rating }) => (
  <span className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <span
        key={s}
        className={`text-xs ${
          s <= Math.round(rating)
            ? "text-amber-400"
            : "text-gray-300 dark:text-gray-600"
        }`}
      >
        ★
      </span>
    ))}
    <span className="ml-1 text-xs text-[#6b4040] dark:text-[#c9a97a]">
      {rating?.toFixed(1)}
    </span>
  </span>
);

// ─── Add Driver Modal Form ─────────────────────────────────────────────────────

const AddDriverModal = ({ isOpen, onClose, onAdd }) => {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    vehicleType: "Motorcycle",
    licensePlate: "",
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.phone.trim()) e.phone = "Phone is required";
    if (!form.licensePlate.trim()) e.licensePlate = "License plate is required";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onAdd(form);
    setForm({
      name: "",
      phone: "",
      vehicleType: "Motorcycle",
      licensePlate: "",
    });
    setErrors({});
    onClose();
  };

  const field = (key, label, placeholder, type = "text") => (
    <div>
      <label className="block text-xs font-semibold text-[#6b4040] dark:text-[#c9a97a] mb-1">
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => {
          setForm((f) => ({ ...f, [key]: e.target.value }));
          setErrors((er) => ({ ...er, [key]: undefined }));
        }}
        placeholder={placeholder}
        className={clsx("input", errors[key] && "border-red-400")}
      />
      {errors[key] && (
        <p className="text-xs text-red-500 mt-0.5">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Driver 🚴"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Add Driver
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {field("name", "Full Name", "e.g. John Doe")}
        {field("phone", "Phone Number", "e.g. +1 555-0100")}
        <div>
          <label className="block text-xs font-semibold text-[#6b4040] dark:text-[#c9a97a] mb-1">
            Vehicle Type
          </label>
          <select
            value={form.vehicleType}
            onChange={(e) =>
              setForm((f) => ({ ...f, vehicleType: e.target.value }))
            }
            className="input"
          >
            {VEHICLE_TYPES.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>
        {field("licensePlate", "License Plate", "e.g. DRV-001")}
      </div>
    </Modal>
  );
};

// ─── Driver Detail Drawer ──────────────────────────────────────────────────────

const DriverDetailModal = ({ driver, orders, onClose }) => {
  if (!driver) return null;
  const driverOrders = orders.filter((o) => o.driver?.id === driver.id);
  const delivered = driverOrders.filter((o) => o.status === "delivered").length;
  const activeOrders = driverOrders.filter(
    (o) => !["delivered", "cancelled"].includes(o.status),
  );

  return (
    <Modal
      isOpen={!!driver}
      onClose={onClose}
      title={`${driver.name} — Driver Profile`}
      footer={
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      }
    >
      {/* Profile card */}
      <div className="flex items-center gap-4 p-4 bg-[#f8f8f8] dark:bg-[#430000] rounded-xl mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-[#e05c5c] to-[#b04040] rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {driver.name[0]}
        </div>
        <div>
          <p className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
            {driver.name}
          </p>
          <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
            📱 {driver.phone}
          </p>
          <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
            🚗 {driver.vehicleType} · {driver.licensePlate}
          </p>
          <div className="mt-1">
            <StarRating rating={driver.rating} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Total Trips", value: driver.deliveries || 0, icon: "🛵" },
          { label: "Delivered", value: delivered, icon: "✅" },
          { label: "Active Now", value: activeOrders.length, icon: "🔄" },
        ].map((s) => (
          <div
            key={s.label}
            className="text-center p-3 bg-[#f8f8f8] dark:bg-[#430000] rounded-xl"
          >
            <div className="text-xl">{s.icon}</div>
            <div className="text-xl font-black text-[#1a0a0a] dark:text-[#f8f8f8]">
              {s.value}
            </div>
            <div className="text-[10px] text-[#9e7272]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div>
        <p className="text-xs font-semibold text-[#6b4040] dark:text-[#c9a97a] uppercase tracking-wide mb-2">
          Order History ({driverOrders.length})
        </p>
        {driverOrders.length === 0 ? (
          <p className="text-sm text-center text-[#9e7272] py-4">
            No orders yet
          </p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {[...driverOrders]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between text-sm p-2.5 bg-[#f8f8f8]/50 dark:bg-[#430000]/50 rounded-lg"
                >
                  <div>
                    <span className="font-mono font-bold text-primary text-xs">
                      {o.id}
                    </span>
                    <p className="text-xs text-[#9e7272]">{o.customerName}</p>
                  </div>
                  <div className="text-right">
                    <Badge status={o.status} />
                    <p className="text-xs font-bold text-primary mt-0.5">
                      ${o.total?.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Performance bars */}
      <div className="mt-4">
        <p className="text-xs font-semibold text-[#6b4040] dark:text-[#c9a97a] uppercase tracking-wide mb-2">
          Performance
        </p>
        {[
          {
            label: "Delivery Rate",
            value: driverOrders.length
              ? Math.round((delivered / driverOrders.length) * 100)
              : 0,
            color: "bg-emerald-500",
          },
          {
            label: "Customer Rating",
            value: Math.round((driver.rating / 5) * 100),
            color: "bg-amber-500",
          },
          {
            label: "Experience",
            value: Math.min(Math.round((driver.deliveries / 500) * 100), 100),
            color: "bg-blue-500",
          },
        ].map((p) => (
          <div key={p.label} className="mb-2">
            <div className="flex justify-between text-xs text-[#6b4040] dark:text-[#c9a97a] mb-0.5">
              <span>{p.label}</span>
              <span className="font-bold">{p.value}%</span>
            </div>
            <div className="h-1.5 bg-[#E5D0AC]/50 dark:bg-[#3d1a1a]/50 rounded-full overflow-hidden">
              <div
                className={`h-full ${p.color} rounded-full transition-all duration-1000`}
                style={{ width: `${p.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};

// ─── Main ──────────────────────────────────────────────────────────────────────

const AdminDriversPage = () => {
  const { drivers, addDriver, removeDriver, toggleBlock } = useDriverStore();
  const { orders } = useOrderStore();
  const { addToast } = useAppStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [detailDriver, setDetailDriver] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);

  const filtered = drivers.filter((d) => {
    const q = search.toLowerCase();
    const matchQ =
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.phone?.includes(q) ||
      d.vehicleType?.toLowerCase().includes(q);
    const matchS =
      statusFilter === "all" ||
      (statusFilter === "blocked" && d.blocked) ||
      (statusFilter === "online" &&
        !d.blocked &&
        d.status === "online" &&
        d.availability === "free") ||
      (statusFilter === "busy" &&
        !d.blocked &&
        d.status === "online" &&
        d.availability === "busy") ||
      (statusFilter === "offline" && !d.blocked && d.status === "offline");
    return matchQ && matchS;
  });

  const handleAdd = (data) => {
    addDriver(data);
    addToast({
      type: "success",
      title: "Driver Added!",
      message: `${data.name} has been added to the fleet`,
    });
  };

  const handleToggleBlock = (driver) => {
    toggleBlock(driver.id);
    addToast({
      type: driver.blocked ? "success" : "warning",
      title: driver.blocked ? "Driver Unblocked" : "Driver Blocked",
      message: `${driver.name} has been ${
        driver.blocked ? "unblocked" : "blocked"
      }`,
    });
  };

  const handleRemove = () => {
    if (!confirmRemove) return;
    addToast({
      type: "info",
      title: "Driver Removed",
      message: `${confirmRemove.name} removed from fleet`,
    });
    removeDriver(confirmRemove.id);
    setConfirmRemove(null);
  };

  const driverOrderCount = (id) =>
    orders.filter(
      (o) =>
        o.driver?.id === id && !["delivered", "cancelled"].includes(o.status),
    ).length;

  return (
    <DashboardLayout role="admin">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
            Drivers Management 🚴
          </h1>
          <p className="text-[#6b4040] dark:text-[#c9a97a] mt-0.5 text-sm">
            {filtered.length} of {drivers.length} drivers
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAdd(true)}>
          + Add Driver
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search by name, phone, vehicle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-full sm:w-44"
          >
            <option value="all">All Statuses</option>
            <option value="online">Available</option>
            <option value="busy">Busy</option>
            <option value="offline">Offline</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>
      </Card>

      {/* Drivers grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="🚴"
          title="No drivers found"
          description="Try adjusting your search or add a new driver"
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
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((driver) => {
            const activeCount = driverOrderCount(driver.id);
            const totalOrders = orders.filter((o) => o.driver?.id === driver.id)
              .length;
            return (
              <Card
                key={driver.id}
                className={clsx(
                  "group transition-all hover:shadow-lg",
                  driver.blocked && "opacity-60",
                )}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="relative">
                    <div
                      className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0",
                        driver.blocked
                          ? "bg-gray-400"
                          : "bg-gradient-to-br from-[#e05c5c] to-[#b04040]",
                      )}
                    >
                      {driver.name[0]}
                    </div>
                    {activeCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                        {activeCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] truncate">
                      {driver.name}
                    </p>
                    <p className="text-xs text-[#6b4040] dark:text-[#c9a97a]">
                      📱 {driver.phone}
                    </p>
                    <div className="mt-1">
                      <StatusDot
                        status={
                          driver.status === "online"
                            ? driver.availability === "busy"
                              ? "busy"
                              : "online"
                            : "offline"
                        }
                        blocked={driver.blocked}
                      />
                    </div>
                  </div>
                </div>

                {/* Info row */}
                <div className="flex items-center justify-between text-xs text-[#6b4040] dark:text-[#c9a97a] mb-4">
                  <span>{driver.vehicleType}</span>
                  <span>📦 {totalOrders} trips</span>
                  <StarRating rating={driver.rating} />
                </div>

                {/* Active orders badge */}
                {activeCount > 0 && (
                  <div className="mb-3 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    {activeCount} active order{activeCount > 1 ? "s" : ""}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setDetailDriver(driver)}
                  >
                    👁 View
                  </Button>
                  <Button
                    variant={driver.blocked ? "secondary" : "ghost"}
                    size="sm"
                    className="flex-1"
                    onClick={() => handleToggleBlock(driver)}
                  >
                    {driver.blocked ? "Unblock" : "Block"}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmRemove(driver)}
                  >
                    🗑
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Driver Modal */}
      <AddDriverModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={handleAdd}
      />

      {/* Driver Detail Modal */}
      <DriverDetailModal
        driver={detailDriver}
        orders={orders}
        onClose={() => setDetailDriver(null)}
      />

      {/* Confirm Remove Modal */}
      <Modal
        isOpen={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        title="Remove Driver?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmRemove(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleRemove}>
              Remove
            </Button>
          </>
        }
      >
        <p className="text-[#6b4040] dark:text-[#c9a97a]">
          Are you sure you want to remove{" "}
          <strong className="text-[#1a0a0a] dark:text-[#f8f8f8]">
            {confirmRemove?.name}
          </strong>{" "}
          from the system? This action cannot be undone.
        </p>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminDriversPage;
