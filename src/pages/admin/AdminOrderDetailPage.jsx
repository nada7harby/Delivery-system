import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useOrderStore,
  useAppStore,
  useTrackingStore,
  useDriverStore,
} from "@/store";
import { DashboardLayout } from "@/layouts";
import {
  Card,
  Badge,
  Button,
  Stepper,
  Modal,
  MapSimulation,
} from "@/components";
import { ORDER_STATUS, STATUS_LABELS, STATUS_TRANSITIONS } from "@/constants";

const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getOrderById,
    updateOrderStatus,
    assignDriverByAdmin,
    requestOrderCancellation,
  } = useOrderStore();
  const { drivers } = useDriverStore();
  const { addToast } = useAppStore();
  const {
    addNotification,
    driverLocation,
    customerLocation,
    restaurantLocation,
  } = useTrackingStore();

  const [showAssignDriver, setShowAssignDriver] = useState(false);
  const [showForceStatus, setShowForceStatus] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [targetStatus, setTargetStatus] = useState("");
  const [cancelReason, setCancelReason] = useState("Operational decision");
  const [isUpdating, setIsUpdating] = useState(false);

  const order = getOrderById(id);

  if (!order) {
    return (
      <DashboardLayout role="admin">
        <div className="text-center py-16">
          <div className="text-5xl mb-3">❓</div>
          <p className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-2">
            Order not found
          </p>
          <Button onClick={() => navigate("/admin/orders")} variant="primary">
            Back
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const allowedNextStatuses = STATUS_TRANSITIONS[order.status] || [];

  const handleAssignDriver = async () => {
    if (!selectedDriver) return;
    setIsUpdating(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = assignDriverByAdmin(order.id, selectedDriver);
    if (result.success) {
      addToast({
        type: "success",
        title: "Driver assigned!",
        message: `Driver assigned to order ${order.id}`,
      });
      addNotification({
        type: "order",
        title: "Driver Assigned",
        message: `Order ${order.id} assigned to driver`,
      });
    } else {
      addToast({
        type: "error",
        title: "Assignment failed",
        message: result.error,
      });
    }
    setShowAssignDriver(false);
    setIsUpdating(false);
  };

  const handleForceStatus = async () => {
    if (!targetStatus) return;
    setIsUpdating(true);
    await new Promise((r) => setTimeout(r, 600));
    const result = updateOrderStatus(order.id, targetStatus, "Admin override");
    if (result.success) {
      addToast({
        type: "success",
        title: "Status updated!",
        message: `Order is now: ${STATUS_LABELS[targetStatus]}`,
      });
    } else {
      addToast({ type: "error", title: "Error", message: result.error });
    }
    setShowForceStatus(false);
    setIsUpdating(false);
  };

  const handleCancel = async () => {
    setIsUpdating(true);
    await new Promise((r) => setTimeout(r, 400));
    const result = requestOrderCancellation(order.id, {
      actorRole: "admin",
      actorId: "admin-panel",
      reason: cancelReason,
      isAdminOverride: true,
    });
    if (result.success) {
      addToast({
        type: "info",
        title: "Order cancelled",
        message: result.message,
      });
      setShowCancelModal(false);
    } else {
      addToast({
        type: "error",
        title: "Cannot cancel",
        message: result.error,
      });
    }
    setIsUpdating(false);
  };

  return (
    <DashboardLayout role="admin">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button
            onClick={() => navigate("/admin/orders")}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#E5D0AC]/50 dark:hover:bg-[#3d1a1a]/50 text-[#6b4040] dark:text-[#c9a97a] transition-colors"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
              Order {order.id}
            </h1>
            <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge status={order.status} />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Map */}
            <Card padding="p-0">
              <div className="px-5 py-4 border-b border-[#E5D0AC] dark:border-[#3d1a1a]">
                <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
                  📍 Live Map
                </h2>
              </div>
              <MapSimulation
                driverLocation={order.driver ? driverLocation : null}
                customerLocation={customerLocation}
                restaurantLocation={restaurantLocation}
                height="h-56"
                className="rounded-none border-0"
              />
            </Card>

            {/* Order progress */}
            <Card>
              <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-5">
                Order Progress
              </h2>
              {order.status === ORDER_STATUS.CANCELLED ? (
                <div className="text-center py-4 text-red-500 font-bold">
                  ❌ Order Cancelled
                </div>
              ) : (
                <Stepper currentStatus={order.status} />
              )}
            </Card>

            {/* Items */}
            <Card>
              <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-4">
                Order Items
              </h2>
              <div className="divide-y divide-[#E5D0AC]/50 dark:divide-[#3d1a1a]/50">
                {order.items?.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2.5 text-sm"
                  >
                    <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="flex-1 font-medium text-[#1a0a0a] dark:text-[#f8f8f8]">
                      {item.name}
                    </span>
                    <span className="text-[#6b4040] dark:text-[#c9a97a]">
                      x{item.quantity}
                    </span>
                    <span className="font-bold text-primary">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#E5D0AC] dark:border-[#3d1a1a] space-y-1 text-sm">
                <div className="flex justify-between text-[#6b4040] dark:text-[#c9a97a]">
                  <span>Subtotal</span>
                  <span>${order.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#6b4040] dark:text-[#c9a97a]">
                  <span>Delivery</span>
                  <span>
                    {order.deliveryFee === 0
                      ? "FREE"
                      : `$${order.deliveryFee?.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-[#1a0a0a] dark:text-[#f8f8f8] text-base">
                  <span>Total</span>
                  <span className="text-primary">
                    ${order.total?.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Timeline */}
            <Card>
              <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-4">
                Timeline
              </h2>
              <div className="space-y-3">
                {[...order.timeline].reverse().map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-sm">
                      ✓
                    </div>
                    <div>
                      <p className="font-semibold text-[#1a0a0a] dark:text-[#f8f8f8]">
                        {STATUS_LABELS[entry.status]}
                      </p>
                      {entry.note && (
                        <p className="text-xs text-[#6b4040] dark:text-[#c9a97a]">
                          {entry.note}
                        </p>
                      )}
                      <p className="text-xs text-[#9e7272]">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="space-y-5">
            {/* Customer info */}
            <Card>
              <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-3">
                Customer Info
              </h2>
              <div className="space-y-2 text-sm text-[#6b4040] dark:text-[#c9a97a]">
                <p className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
                  {order.customerName}
                </p>
                {order.customerPhone && <p>📱 {order.customerPhone}</p>}
                <p>📍 {order.customerAddress}</p>
                {order.notes && (
                  <p className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-700 dark:text-amber-300">
                    📝 {order.notes}
                  </p>
                )}
              </div>
            </Card>

            {/* Driver info */}
            <Card>
              <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-3">
                Driver
              </h2>
              {order.driverId && (
                <div
                  className={`mb-3 text-[11px] px-2.5 py-1.5 rounded-lg font-semibold w-fit ${
                    order.autoAssigned
                      ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                      : "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                  }`}
                >
                  {order.autoAssigned ? "Auto Assigned" : "Manual Override"}
                </div>
              )}
              {typeof order.assignmentScore === "number" && (
                <p className="text-xs text-[#6b4040] dark:text-[#c9a97a] mb-3">
                  Assignment score: {order.assignmentScore.toFixed(3)}
                </p>
              )}
              {order.driver ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-brand rounded-full flex items-center justify-center text-white font-bold">
                    {order.driver.name?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
                      {order.driver.name}
                    </p>
                    <p className="text-xs text-[#6b4040] dark:text-[#c9a97a]">
                      ⭐ {order.driver.rating}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-sm text-[#6b4040] dark:text-[#c9a97a] mb-3">
                    No driver assigned
                  </p>
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => setShowAssignDriver(true)}
                    disabled={order.status === ORDER_STATUS.CANCELLED}
                  >
                    Assign Driver
                  </Button>
                </div>
              )}
              {order.driver && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => setShowAssignDriver(true)}
                >
                  Reassign Driver
                </Button>
              )}
            </Card>

            {/* Admin actions */}
            <Card>
              <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-4">
                Admin Actions
              </h2>
              <div className="space-y-2">
                {allowedNextStatuses.length > 0 &&
                  allowedNextStatuses[0] !== ORDER_STATUS.CANCELLED && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setTargetStatus(allowedNextStatuses[0]);
                        setShowForceStatus(true);
                      }}
                    >
                      Force → {STATUS_LABELS[allowedNextStatuses[0]]}
                    </Button>
                  )}
                {order.status !== ORDER_STATUS.CANCELLED && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    loading={isUpdating}
                    onClick={() => setShowCancelModal(true)}
                  >
                    Cancel Order
                  </Button>
                )}
                {order.status === ORDER_STATUS.CANCELLED && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
                    <p>Reason: {order.cancelReason || "No reason provided"}</p>
                    <p>Cancelled by: {order.cancelledBy || "system"}</p>
                    {typeof order.partialRefundAmount === "number" && (
                      <p>
                        Refund simulation: $
                        {order.partialRefundAmount.toFixed(2)}
                      </p>
                    )}
                  </div>
                )}
                {order.status === ORDER_STATUS.DELIVERED && (
                  <div className="text-center text-emerald-600 dark:text-emerald-400 font-bold py-2">
                    🎉 Delivered!
                  </div>
                )}
              </div>
            </Card>

            {/* Rating */}
            {order.rating !== null && order.rating !== undefined && (
              <Card>
                <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-2">
                  Customer Rating
                </h2>
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`text-xl ${
                        s <= order.rating ? "text-amber-400" : "text-gray-300"
                      }`}
                    >
                      ★
                    </span>
                  ))}
                </div>
                {order.ratingComment && (
                  <p className="text-sm text-[#6b4040] dark:text-[#c9a97a] mt-1">
                    "{order.ratingComment}"
                  </p>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Assign Driver Modal */}
      <Modal
        isOpen={showAssignDriver}
        onClose={() => setShowAssignDriver(false)}
        title="Assign Driver 🛵"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAssignDriver(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={isUpdating}
              onClick={handleAssignDriver}
              disabled={!selectedDriver}
            >
              Assign
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {drivers.map((driver) => (
            <button
              key={driver.id}
              onClick={() => setSelectedDriver(driver.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                selectedDriver === driver.id
                  ? "border-primary bg-primary/10"
                  : "border-[#E5D0AC] dark:border-[#3d1a1a] hover:border-primary/50"
              }`}
            >
              <div className="w-10 h-10 bg-gradient-brand rounded-full flex items-center justify-center text-white font-bold">
                {driver.name[0]}
              </div>
              <div className="flex-1">
                <p className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
                  {driver.name}
                </p>
                <p className="text-xs text-[#6b4040] dark:text-[#c9a97a]">
                  ⭐ {driver.rating} · {driver.vehicleType} ·{" "}
                  {driver.deliveries} deliveries
                </p>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  driver.status === "online" && driver.availability === "free"
                    ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
                    : driver.status === "offline"
                    ? "bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-300"
                    : "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300"
                }`}
              >
                {driver.status === "online" ? driver.availability : "offline"}
              </span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Force status modal */}
      <Modal
        isOpen={showForceStatus}
        onClose={() => setShowForceStatus(false)}
        title="Force Status Update"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowForceStatus(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={isUpdating}
              onClick={handleForceStatus}
            >
              Update Status
            </Button>
          </>
        }
      >
        <p className="text-[#6b4040] dark:text-[#c9a97a] mb-4">
          Force update order {order.id} to:
        </p>
        <div className="space-y-2">
          {allowedNextStatuses
            .filter((s) => s !== ORDER_STATUS.CANCELLED)
            .map((status) => (
              <button
                key={status}
                onClick={() => setTargetStatus(status)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  targetStatus === status
                    ? "border-primary bg-primary/10"
                    : "border-[#E5D0AC] dark:border-[#3d1a1a] hover:border-primary/50"
                }`}
              >
                <Badge status={status} />
              </button>
            ))}
        </div>
      </Modal>

      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Admin Cancellation Override"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>
              Back
            </Button>
            <Button
              variant="danger"
              loading={isUpdating}
              onClick={handleCancel}
            >
              Confirm Override
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
            Admin can cancel any order with override. Add a clear reason for
            audit trail.
          </p>
          <label className="block text-xs font-semibold text-[#6b4040] dark:text-[#c9a97a]">
            Cancellation reason
          </label>
          <select
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            className="input"
          >
            <option>Operational decision</option>
            <option>Customer support escalation</option>
            <option>Driver unavailable</option>
            <option>Fraud prevention</option>
            <option>Inventory issue</option>
          </select>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminOrderDetailPage;
