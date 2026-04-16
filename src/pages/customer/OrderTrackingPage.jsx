import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useOrderStore, useTrackingStore, useAppStore } from "@/store";
import { CustomerLayout } from "@/layouts";
import {
  Card,
  Badge,
  Stepper,
  Button,
  MapSimulation,
  Modal,
} from "@/components";
import { ORDER_STATUS, STATUS_LABELS, STATUS_ICONS } from "@/constants";
import { socket } from "@/services";

const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => onChange(star)}
        className="star"
      >
        <span className={star <= value ? "text-amber-400" : "text-gray-300"}>
          ★
        </span>
      </button>
    ))}
  </div>
);

const OrderTrackingPage = () => {
  const { id } = useParams();
  const { getOrderById, getAssignmentStatus, rateOrder } = useOrderStore();
  const {
    startTracking,
    stopTracking,
    driverLocation,
    customerLocation,
    restaurantLocation,
    eta,
    isTracking,
  } = useTrackingStore();
  const { addToast } = useAppStore();

  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  const order = getOrderById(id);
  const assignmentStatus = getAssignmentStatus(id);

  useEffect(() => {
    if (
      order &&
      order.status !== ORDER_STATUS.DELIVERED &&
      order.status !== ORDER_STATUS.CANCELLED
    ) {
      startTracking(id, order.customerAddress);
    }
    return () => stopTracking();
  }, [id]);

  useEffect(() => {
    const onDriverAssigned = (payload) => {
      if (payload?.orderId !== id) return;
      addToast({
        type: "success",
        title: "Driver assigned",
        message: `Driver assigned: ${payload.driverName}`,
      });
    };

    const onDriverRejected = (payload) => {
      if (payload?.orderId !== id) return;
      addToast({
        type: "warning",
        title: "Reassigning order",
        message:
          payload.reason ||
          "Driver rejected the order. Finding next best driver...",
      });
    };

    socket.on("driver-assigned", onDriverAssigned);
    socket.on("driver-rejected", onDriverRejected);

    return () => {
      socket.off("driver-assigned", onDriverAssigned);
      socket.off("driver-rejected", onDriverRejected);
    };
  }, [id, addToast]);

  if (!order) {
    return (
      <CustomerLayout>
        <div className="text-center py-16">
          <div className="text-5xl mb-3">❓</div>
          <h3 className="text-xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-2">
            Order not found
          </h3>
          <Link to="/">
            <Button variant="primary" icon="🍔">
              Go to Menu
            </Button>
          </Link>
        </div>
      </CustomerLayout>
    );
  }

  const isLive =
    order.status !== ORDER_STATUS.DELIVERED &&
    order.status !== ORDER_STATUS.CANCELLED;

  const handleSubmitRating = () => {
    rateOrder(order.id, rating, ratingComment);
    addToast({
      type: "success",
      title: "Thanks for your rating! ⭐",
      message: `You rated your experience ${rating} stars`,
    });
    setShowRating(false);
  };

  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                to="/orders"
                className="text-sm text-[#6b4040] dark:text-[#c9a97a] hover:text-primary transition-colors"
              >
                ← My Orders
              </Link>
            </div>
            <h1 className="font-display text-2xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
              Tracking Order <span className="text-primary">#{order.id}</span>
            </h1>
            <p className="text-sm text-[#6b4040] dark:text-[#c9a97a] mt-1">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <Badge status={order.status} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left col */}
          <div className="lg:col-span-2 space-y-5">
            {/* Map */}
            <Card padding="p-0" className="overflow-hidden">
              <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#E5D0AC] dark:border-[#3d1a1a]">
                <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] flex items-center gap-2">
                  📍 Live Tracking
                  {isLive && isTracking && (
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block" />
                  )}
                </h2>
                {eta !== null && isLive && (
                  <div className="bg-primary/10 text-primary rounded-lg px-3 py-1.5 text-sm font-bold">
                    ⏱ {eta} min ETA
                  </div>
                )}
              </div>
              <MapSimulation
                driverLocation={order.driver ? driverLocation : null}
                customerLocation={customerLocation}
                restaurantLocation={restaurantLocation}
                height="h-72"
                className="rounded-none border-0"
              />
              {!order.driver && (
                <div className="px-5 py-3 text-sm text-[#6b4040] dark:text-[#c9a97a] flex items-center gap-2">
                  <span className="animate-spin-slow text-base">⏳</span>
                  {assignmentStatus?.message || "Searching for driver..."}
                </div>
              )}
            </Card>

            {assignmentStatus && (
              <Card>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
                      Smart Assignment
                    </p>
                    <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
                      {assignmentStatus.message}
                    </p>
                  </div>
                  {typeof assignmentStatus.score === "number" && (
                    <div className="px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
                      score {assignmentStatus.score.toFixed(3)}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Stepper */}
            <Card>
              <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-5">
                Order Progress
              </h2>
              {order.status === ORDER_STATUS.CANCELLED ? (
                <div className="text-center py-4">
                  <div className="text-4xl mb-2">❌</div>
                  <p className="font-bold text-red-500">Order Cancelled</p>
                </div>
              ) : (
                <Stepper currentStatus={order.status} />
              )}
            </Card>

            {/* Timeline */}
            <Card>
              <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-4">
                Timeline
              </h2>
              <div className="space-y-3">
                {[...order.timeline].reverse().map((entry, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-base">
                      {STATUS_ICONS[entry.status]}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[#1a0a0a] dark:text-[#f8f8f8]">
                        {STATUS_LABELS[entry.status]}
                      </p>
                      {entry.note && (
                        <p className="text-[#6b4040] dark:text-[#c9a97a] text-xs">
                          {entry.note}
                        </p>
                      )}
                      <p className="text-[#9e7272] text-xs mt-0.5">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Right col */}
          <div className="space-y-5">
            {/* Driver info */}
            {order.driver && (
              <Card>
                <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-3 flex items-center gap-2">
                  🛵 Your Driver
                </h2>
                {order.awaitingDriverResponse && (
                  <div className="mb-3 text-xs px-2.5 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-semibold">
                    Driver notified. Waiting for acceptance...
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-brand rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                    {order.driver.name?.[0]}
                  </div>
                  <div>
                    <p className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
                      {order.driver.name}
                    </p>
                    <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
                      ⭐ {order.driver.rating} · {order.driver.vehicleType}
                    </p>
                    {order.driver.phone && (
                      <a
                        href={`tel:${order.driver.phone}`}
                        className="text-xs text-primary hover:underline mt-0.5 block"
                      >
                        {order.driver.phone}
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Order summary */}
            <Card>
              <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-3">
                Items
              </h2>
              <div className="space-y-2">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="flex-1 text-[#1a0a0a] dark:text-[#f8f8f8]">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="text-[#6b4040] dark:text-[#c9a97a]">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#E5D0AC] dark:border-[#3d1a1a] text-sm space-y-1">
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
                <div className="flex justify-between font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
                  <span>Total</span>
                  <span className="text-primary">
                    ${order.total?.toFixed(2)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Delivery info */}
            <Card>
              <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-3">
                Delivery Info
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span>🏠</span>
                  <p className="text-[#6b4040] dark:text-[#c9a97a]">
                    {order.customerAddress}
                  </p>
                </div>
                {order.notes && (
                  <div className="flex gap-2">
                    <span>📝</span>
                    <p className="text-[#6b4040] dark:text-[#c9a97a]">
                      {order.notes}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Rating */}
            {order.status === ORDER_STATUS.DELIVERED && (
              <Card>
                {order.rating ? (
                  <div className="text-center">
                    <p className="font-bold mb-1 text-[#1a0a0a] dark:text-[#f8f8f8]">
                      Your Rating
                    </p>
                    <div className="flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          className={`text-2xl ${
                            s <= order.rating
                              ? "text-amber-400"
                              : "text-gray-300"
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
                  </div>
                ) : (
                  <>
                    <p className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-3">
                      🎉 Order Delivered!
                    </p>
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={() => setShowRating(true)}
                    >
                      Rate Your Experience
                    </Button>
                  </>
                )}
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Rating modal */}
      <Modal
        isOpen={showRating}
        onClose={() => setShowRating(false)}
        title="Rate Your Experience ⭐"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowRating(false)}>
              Skip
            </Button>
            <Button variant="primary" onClick={handleSubmitRating}>
              Submit Rating
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="text-5xl">🍔</div>
          <p className="text-[#6b4040] dark:text-[#c9a97a] text-center">
            How was your order from QuickBite?
          </p>
          <StarRating value={rating} onChange={setRating} />
          <p className="text-sm font-semibold text-[#1a0a0a] dark:text-[#f8f8f8]">
            {["", "Poor", "Fair", "Good", "Great", "Excellent!"][rating]}
          </p>
          <textarea
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            placeholder="Tell us more about your experience..."
            rows={3}
            className="input w-full resize-none"
          />
        </div>
      </Modal>
    </CustomerLayout>
  );
};

export default OrderTrackingPage;
