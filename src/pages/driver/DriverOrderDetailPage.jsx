import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useOrderStore,
  useAuthStore,
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
  MapSimulation,
  Modal,
} from "@/components";
import { ORDER_STATUS, STATUS_LABELS } from "@/constants";
import clsx from "clsx";

const NEXT_STATUS_ACTIONS = {
  [ORDER_STATUS.PENDING]: {
    label: "Accept Order",
    icon: "✅",
    status: ORDER_STATUS.CONFIRMED,
    variant: "success",
  },
  [ORDER_STATUS.CONFIRMED]: {
    label: "Start Preparing",
    icon: "👨‍🍳",
    status: ORDER_STATUS.PREPARING,
    variant: "primary",
  },
  [ORDER_STATUS.PREPARING]: {
    label: "Ready for Pickup",
    icon: "📦",
    status: ORDER_STATUS.READY,
    variant: "primary",
  },
  [ORDER_STATUS.READY]: {
    label: "Picked Up",
    icon: "🛵",
    status: ORDER_STATUS.PICKED_UP,
    variant: "primary",
  },
  [ORDER_STATUS.PICKED_UP]: {
    label: "Start Delivery (On Way)",
    icon: "🚴",
    status: ORDER_STATUS.ON_THE_WAY,
    variant: "primary",
  },
  [ORDER_STATUS.ON_THE_WAY]: {
    label: "Complete Delivery",
    icon: "🎉",
    status: ORDER_STATUS.DELIVERED,
    variant: "success",
  },
};

const DriverOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    getOrderById,
    updateOrderStatus,
    driverAcceptOrder,
    driverRejectOrder,
  } = useOrderStore();
  const { user } = useAuthStore();
  const { getDriverByUser } = useDriverStore();
  const { addToast } = useAppStore();
  const {
    startTracking,
    stopTracking,
    driverLocation,
    customerLocation,
    restaurantLocation,
    addNotification,
    isTracking,
  } = useTrackingStore();

  const [isUpdating, setIsUpdating] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("Too far");
  const [showProof, setShowProof] = useState(false);
  const [proofImage, setProofImage] = useState(null);

  const order = getOrderById(id);
  const loggedDriver = getDriverByUser(user);

  useEffect(() => {
    if (order?.status === ORDER_STATUS.ON_THE_WAY && !isTracking) {
      startTracking(order.id, order.customerAddress);
    }
  }, [order?.status]);

  if (!order) {
    return (
      <DashboardLayout role="driver">
        <div className="text-center py-16">
          <div className="text-5xl mb-3">❓</div>
          <p className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
            Order not found
          </p>
          <Button
            onClick={() => navigate("/driver/orders")}
            variant="primary"
            className="mt-4"
          >
            Back to Orders
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const nextAction = NEXT_STATUS_ACTIONS[order.status];
  const isMyOrder =
    order.driverId === loggedDriver?.id ||
    order.driver?.id === loggedDriver?.id;
  const isAwaitingResponse = Boolean(order.awaitingDriverResponse && isMyOrder);

  const handleAccept = async () => {
    setIsUpdating(true);
    await new Promise((r) => setTimeout(r, 600));

    const result = driverAcceptOrder(order.id, loggedDriver?.id);
    if (result.success) {
      addNotification({
        type: "order",
        title: "Assignment accepted",
        message: `Driver accepted order ${order.id}`,
      });
      addToast({
        type: "success",
        title: "Order Accepted!",
        message: "Navigate to restaurant to pick up.",
      });
    } else {
      addToast({
        type: "error",
        title: "Unable to accept",
        message: result.error,
      });
    }
    setIsUpdating(false);
  };

  const handleReject = async () => {
    setIsUpdating(true);
    await new Promise((r) => setTimeout(r, 600));

    const result = driverRejectOrder(
      order.id,
      loggedDriver?.id,
      `Driver rejected: ${rejectReason}`,
    );
    if (result.success) {
      addNotification({
        type: "order",
        title: "Driver rejected order",
        message: `Order ${order.id} is being reassigned`,
      });
      addToast({
        type: "warning",
        title: "Order rejected",
        message: "We are assigning this order to the next best driver.",
      });
      navigate("/driver/orders");
    } else {
      addToast({
        type: "error",
        title: "Unable to reject",
        message: result.error,
      });
    }

    setShowReject(false);
    setIsUpdating(false);
  };

  const handleStatusUpdate = async () => {
    if (!nextAction) return;

    // Require proof of delivery for the final stage
    if (nextAction.status === ORDER_STATUS.DELIVERED && !proofImage) {
      setShowProof(true);
      return;
    }

    setIsUpdating(true);
    await new Promise((r) => setTimeout(r, 600));

    const result = updateOrderStatus(order.id, nextAction.status);
    if (result.success) {
      addToast({
        type: "success",
        title: `Status: ${STATUS_LABELS[nextAction.status]}`,
      });

      if (nextAction.status === ORDER_STATUS.DELIVERED) {
        stopTracking();
      }
    }
    setIsUpdating(false);
  };

  const simulatePhoto = () => {
    setProofImage("📸 Delivery Photo Captured");
    addToast({
      type: "info",
      title: "Photo Captured",
      message: "Proof of delivery attached.",
    });
  };

  return (
    <DashboardLayout role="driver">
      <div className="max-w-4xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-2xl bg-white dark:bg-gray-900 flex items-center justify-center shadow-sm hover:text-primary transition-colors"
            >
              ←
            </button>
            <div>
              <h1 className="text-xl font-black text-[#1a0a0a] dark:text-[#f8f8f8]">
                Order #{order.id.slice(-6).toUpperCase()}
              </h1>
              <Badge status={order.status} size="sm" />
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-400">
              CUSTOMER PAY
            </span>
            <span className="font-black text-emerald-600 text-xl">
              ${order.total?.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Map Card */}
            <Card
              padding="p-0"
              className="overflow-hidden border-none shadow-xl"
            >
              <div className="px-5 py-4 bg-white dark:bg-gray-900 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
                <h2 className="font-black text-[#1a0a0a] dark:text-[#f8f8f8] flex items-center gap-2">
                  <span className="text-primary">📍</span> Live Navigation
                </h2>
                {isTracking && (
                  <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-[10px] font-black rounded-full animate-pulse border border-emerald-200">
                    LIVE TRACKING
                  </span>
                )}
              </div>
              <MapSimulation
                driverLocation={driverLocation}
                customerLocation={customerLocation}
                restaurantLocation={restaurantLocation}
                height="h-64 sm:h-80"
                className="rounded-none"
              />
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase">
                      Distance
                    </span>
                    <span className="font-bold">1.4 km</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase">
                      Est. Time
                    </span>
                    <span className="font-bold">6 min</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    window.open(
                      `https://maps.google.com/?q=${order.customerAddress}`,
                    )
                  }
                  icon="↗️"
                >
                  Open Outer Map
                </Button>
              </div>
            </Card>

            {/* Order Stepper */}
            <Card className="border-none shadow-lg">
              <Stepper currentStatus={order.status} />
            </Card>

            {/* Details Card */}
            <Card className="border-none shadow-lg">
              <h2 className="font-black text-[#1a0a0a] dark:text-[#f8f8f8] mb-6">
                Order Details
              </h2>
              <div className="space-y-4">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden flex items-center justify-center shadow-sm border border-gray-100 dark:border-gray-800">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-[#1a0a0a] dark:text-[#f8f8f8]">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                <span className="font-bold">Total Bill</span>
                <span className="font-black text-primary text-lg">
                  ${order.total?.toFixed(2)}
                </span>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Customer Contact */}
            <Card className="border-none shadow-lg bg-primary/5">
              <h2 className="font-black text-[#1a0a0a] dark:text-[#f8f8f8] mb-4">
                Contact Customer
              </h2>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center text-xl shadow-sm border-2 border-primary/20">
                  👤
                </div>
                <div>
                  <p className="font-black text-[#1a0a0a] dark:text-[#f8f8f8]">
                    {order.customerName}
                  </p>
                  <p className="text-xs text-primary font-bold">
                    {order.customerPhone || "Default Customer"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  icon="📱"
                  onClick={() => window.open(`tel:${order.customerPhone}`)}
                >
                  Call
                </Button>
                <Button variant="secondary" className="flex-1" icon="💬">
                  Chat
                </Button>
              </div>
              <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-xl">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">
                  Customer Notes
                </p>
                <p className="text-sm font-medium italic">
                  {order.notes || "No extra instructions provided."}
                </p>
              </div>
            </Card>

            {/* Sticky Action Footer/Card */}
            <Card
              className={clsx(
                "border-none shadow-2xl transition-all duration-500",
                isUpdating
                  ? "opacity-50 pointer-events-none scale-95"
                  : "scale-100",
              )}
            >
              <h2 className="font-black text-[#1a0a0a] dark:text-[#f8f8f8] mb-4">
                Update Status
              </h2>

              {isAwaitingResponse && (
                <div className="flex flex-col gap-3">
                  <Button
                    variant="success"
                    size="lg"
                    className="w-full py-6 text-lg"
                    onClick={handleAccept}
                    loading={isUpdating}
                  >
                    ACCEPT ORDER ✅
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => setShowReject(true)}
                  >
                    REJECT ORDER
                  </Button>
                </div>
              )}

              {isMyOrder && !isAwaitingResponse && nextAction && (
                <div className="space-y-4">
                  <Button
                    variant={nextAction.variant || "primary"}
                    size="lg"
                    className="w-full py-6 text-lg shadow-glow"
                    onClick={handleStatusUpdate}
                    loading={isUpdating}
                    icon={nextAction.icon}
                  >
                    {nextAction.label}
                  </Button>

                  {order.status === ORDER_STATUS.READY && (
                    <p className="text-[10px] text-center text-gray-400 animate-bounce">
                      Arrived at restaurant? Click Picked Up ↑
                    </p>
                  )}
                </div>
              )}

              {order.status === ORDER_STATUS.DELIVERED && (
                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <p className="font-black text-emerald-600">
                    MISSION COMPLETED
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Order successfully delivered.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-4"
                    onClick={() => navigate("/driver")}
                  >
                    Back to Dashboard
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Proof Modal */}
      <Modal
        isOpen={showProof}
        onClose={() => setShowProof(false)}
        title="Proof of Delivery 📸"
        footer={
          <Button
            variant="primary"
            className="w-full"
            disabled={!proofImage}
            onClick={handleStatusUpdate}
          >
            Confirm Delivery
          </Button>
        }
      >
        <div className="flex flex-col items-center gap-6 py-6">
          <div
            onClick={simulatePhoto}
            className={clsx(
              "w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all",
              proofImage
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-gray-300 hover:border-primary hover:bg-primary/5",
            )}
          >
            {proofImage ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">📸</span>
                <span className="font-bold text-emerald-600">
                  Photo Attached!
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProofImage(null);
                  }}
                  className="text-xs text-red-500 underline mt-2"
                >
                  Retake Photo
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <span className="text-4xl">📷</span>
                <span className="font-bold text-gray-500">
                  Take a photo of the package
                </span>
                <span className="text-xs text-gray-400">
                  (Click to simulate camera)
                </span>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400 text-center italic">
            This step ensures proof of delivery for the customer and avoids
            complaints.
          </p>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={showReject}
        onClose={() => setShowReject(false)}
        title="Reject Assignment?"
      >
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-500">
            Please provide a reason for rejecting this order:
          </p>
          <div className="grid gap-2">
            {["Too far", "Emergency", "Vehicle trouble", "Traffic"].map(
              (reason) => (
                <button
                  key={reason}
                  onClick={() => setRejectReason(reason)}
                  className={clsx(
                    "p-3 rounded-xl text-left text-sm font-bold transition-colors",
                    rejectReason === reason
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-gray-50 dark:bg-gray-900 hover:bg-primary/10 hover:text-primary",
                  )}
                >
                  {reason}
                </button>
              ),
            )}
          </div>
          <Button
            variant="danger"
            className="w-full mt-4"
            loading={isUpdating}
            onClick={handleReject}
          >
            Confirm Rejection
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default DriverOrderDetailPage;
