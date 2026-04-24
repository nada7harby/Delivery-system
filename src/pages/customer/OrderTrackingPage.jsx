import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMotorcycle,
  faClock,
  faMapMarkerAlt,
  faMapPinned,
  faPhone,
  faStar,
  faStickyNote,
  faTrophy,
  faHamburger,
  faQuestionCircle,
  faExclamationTriangle,
  faTimesCircle,
  faHourglassHalf
 } from "@/utils/icons";
import {
  useOrderStore,
  useTrackingStore,
  useAppStore,
  useAuthStore,
} from "@/store";
import { CustomerLayout } from "@/layouts";
import { Badge, Button, MapSimulation, Modal, Stepper } from "@/components";
import { ORDER_STATUS, STATUS_LABELS, STATUS_ICONS } from "@/constants";
import { socket } from "@/services";
import clsx from "clsx";

/* ─── Star rating ────────────────────────────────────── */
const StarRating = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <Motion.button
        key={star}
        whileTap={{ scale: 1.2 }}
        type="button"
        onClick={() => onChange(star)}
        className="text-3xl transition-transform"
      >
        <FontAwesomeIcon icon={faStar} className={star <= value ? "text-amber-400" : "text-gray-200 dark:text-gray-700"} />
      </Motion.button>
    ))}
  </div>
);

/* ─── Status pulse header ────────────────────────────── */
const StatusBanner = ({ status, eta, restaurantName }) => {
  const colors = {
    [ORDER_STATUS.PENDING]: "from-gray-500 to-gray-600",
    [ORDER_STATUS.CONFIRMED]: "from-blue-500 to-blue-600",
    [ORDER_STATUS.PREPARING]: "from-amber-500 to-orange-500",
    [ORDER_STATUS.READY]: "from-violet-500 to-purple-600",
    [ORDER_STATUS.PICKED_UP]: "from-pink-500 to-rose-500",
    [ORDER_STATUS.ON_THE_WAY]: "from-primary to-primary-light",
    [ORDER_STATUS.DELIVERED]: "from-emerald-500 to-teal-500",
    [ORDER_STATUS.CANCELLED]: "from-red-500 to-red-600",
  };

  const isLive = status !== ORDER_STATUS.DELIVERED && status !== ORDER_STATUS.CANCELLED;

  return (
    <div className={clsx("relative rounded-3xl p-6 text-white overflow-hidden", `bg-gradient-to-br ${colors[status] || "from-gray-500 to-gray-600"}`)}>
      <div className="absolute inset-0 overflow-hidden">
        {isLive && (
          <>
            <Motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-8 -right-8 w-32 h-32 bg-white rounded-full"
            />
            <Motion.div
              animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0, 0.2] }}
              transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
              className="absolute -bottom-8 -left-8 w-40 h-40 bg-white rounded-full"
            />
          </>
        )}
      </div>
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isLive && (
                <span className="inline-flex items-center gap-1.5 text-white/80 text-xs font-semibold">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping inline-block" />
                  Live
                </span>
              )}
            </div>
            <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">Order Status</p>
            <h2 className="font-display text-2xl font-black mt-1">
              {STATUS_LABELS[status] || status}
            </h2>
            {restaurantName && (
              <p className="text-white/70 text-sm mt-1">from {restaurantName}</p>
            )}
          </div>
          <div className="text-4xl">{STATUS_ICONS[status]}</div>
        </div>
        {eta !== null && isLive && (
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-bold">
            <FontAwesomeIcon icon={faClock} className="text-[10px]" />
            ETA: ~{eta} minutes
          </div>
        )}
      </div>
    </div>
  );
};

/* ─── Timeline entry ─────────────────────────────────── */
const TimelineEntry = ({ entry, isFirst }) => (
  <Motion.div
    initial={{ opacity: 0, x: -16 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-start gap-3 text-sm"
  >
    <div className="flex flex-col items-center flex-shrink-0 gap-1">
      <div className={clsx(
        "w-9 h-9 rounded-xl flex items-center justify-center text-base",
        isFirst ? "bg-primary/15 text-primary" : "bg-gray-100 dark:bg-gray-900 text-[#9e7272]",
      )}>
        <FontAwesomeIcon icon={STATUS_ICONS[entry.status]} />
      </div>
    </div>
    <div className="flex-1 pt-1">
      <p className={clsx("font-semibold", isFirst ? "text-[#1a0a0a] dark:text-white" : "text-[#6b4040] dark:text-[#c9a97a]")}>
        {STATUS_LABELS[entry.status]}
      </p>
      {entry.note && <p className="text-xs text-[#9e7272] mt-0.5">{entry.note}</p>}
      <p className="text-xs text-[#9e7272] mt-0.5">
        {new Date(entry.timestamp).toLocaleTimeString()}
      </p>
    </div>
  </Motion.div>
);

/* ─── Main ───────────────────────────────────────────── */
const OrderTrackingPage = () => {
  const { id } = useParams();
  const { getOrderById, getAssignmentStatus, rateOrder, canCancelOrder, requestOrderCancellation } = useOrderStore();
  const { user } = useAuthStore();
  const { startTracking, stopTracking, driverLocation, customerLocation, restaurantLocation, eta, isTracking } = useTrackingStore();
  const { addToast } = useAppStore();

  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Changed my mind");
  const [ackPreparing, setAckPreparing] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const delayedToastShown = useRef({});

  const order = getOrderById(id);
  const assignmentStatus = getAssignmentStatus(id);

  useEffect(() => {
    if (order && order.status !== ORDER_STATUS.DELIVERED && order.status !== ORDER_STATUS.CANCELLED) {
      startTracking(id);
    }
    return () => stopTracking();
  }, [id, order, order?.status, startTracking, stopTracking]);

  useEffect(() => {
    const onDriverAssigned = (p) => {
      if (p?.orderId !== id) return;
      addToast({ type: "success", title: "Driver assigned!", message: p.driverName });
    };
    const onDriverRejected = (p) => {
      if (p?.orderId !== id) return;
      addToast({ type: "warning", title: "Reassigning order", message: p.reason || "Finding next driver…" });
    };
    const onOrderCancelled = (p) => {
      if (p?.orderId !== id) return;
      addToast({ type: "info", title: "Order cancelled", message: p.cancelReason });
    };
    socket.on("driver-assigned", onDriverAssigned);
    socket.on("driver-rejected", onDriverRejected);
    socket.on("order-cancelled", onOrderCancelled);
    return () => {
      socket.off("driver-assigned", onDriverAssigned);
      socket.off("driver-rejected", onDriverRejected);
      socket.off("order-cancelled", onOrderCancelled);
    };
  }, [id, addToast]);

  useEffect(() => {
    if (!order?.isDelayed || delayedToastShown.current[order.id]) return;
    delayedToastShown.current[order.id] = true;
    addToast({ type: "warning", title: "Delay update", message: "Your order is taking longer than expected." });
  }, [addToast, order?.id, order?.isDelayed]);

  if (!order) {
    return (
      <CustomerLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4 text-primary/20"><FontAwesomeIcon icon={faQuestionCircle} /></div>
          <h3 className="text-xl font-bold text-[#1a0a0a] dark:text-white mb-4">Order not found</h3>
          <Link to="/orders"><Button variant="primary">My Orders</Button></Link>
        </div>
      </CustomerLayout>
    );
  }

  const isLive = order.status !== ORDER_STATUS.DELIVERED && order.status !== ORDER_STATUS.CANCELLED;
  const cancelDecision = canCancelOrder(order, { actorRole: "customer" });

  const handleSubmitRating = () => {
    rateOrder(order.id, rating, ratingComment);
    addToast({ type: "success", title: <>Thanks for rating! <FontAwesomeIcon icon={faStar} /></>, message: `${rating} stars — feedback saved` });
    setShowRating(false);
  };

  const handleCancelOrder = async () => {
    setIsCancelling(true);
    const result = requestOrderCancellation(order.id, { actorRole: "customer", actorId: user?.id, reason: cancelReason, acknowledgePreparing: ackPreparing });
    setIsCancelling(false);
    if (result.success) {
      addToast({ type: "success", title: "Order cancelled", message: result.message });
      setShowCancelModal(false);
    } else {
      addToast({ type: "warning", title: "Unable to cancel", message: result.error });
    }
  };

  return (
    <CustomerLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-5 text-sm text-[#6b4040] dark:text-[#c9a97a]">
          <Link to="/orders" className="hover:text-primary transition-colors">← My Orders</Link>
          <span>/</span>
          <span className="font-semibold text-[#1a0a0a] dark:text-white">Order #{order.id}</span>
          <Badge status={order.status} />
        </div>

        {/* Status banner */}
        <Motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <StatusBanner status={order.status} eta={isTracking ? eta : null} restaurantName={order.restaurantName} />
        </Motion.div>

        {/* Delay alert */}
        <AnimatePresence>
          {order.isDelayed && (
             <Motion.div
               initial={{ opacity: 0, height: 0 }}
               animate={{ opacity: 1, height: "auto" }}
               exit={{ opacity: 0, height: 0 }}
               className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-sm"
             >
               <FontAwesomeIcon icon={faExclamationTriangle} className="text-amber-500" /> Your order is taking longer than expected. Thank you for your patience!
             </Motion.div>
          )}
        </AnimatePresence>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left col (2/3) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Map */}
            <div className="rounded-3xl overflow-hidden border border-[#E5D0AC]/60 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] shadow-card">
              <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-[#E5D0AC]/60 dark:border-[#3d1a1a]">
                <h2 className="font-bold text-[#1a0a0a] dark:text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faMapPinned} className="text-primary text-sm" />
                  Live Tracking
                  {isLive && isTracking && (
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block ml-1" />
                  )}
                </h2>
                {!order.driver && (
                  <span className="text-xs text-[#9e7272] animate-pulse">
                    {assignmentStatus?.message || "Searching for driver…"}
                  </span>
                )}
              </div>
              <MapSimulation
                driverLocation={order.driver ? driverLocation : null}
                customerLocation={customerLocation}
                restaurantLocation={restaurantLocation}
                height="h-72"
                className="rounded-none border-0"
              />
            </div>

            {/* Progress stepper */}
            <div className="rounded-3xl border border-[#E5D0AC]/60 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] p-6 shadow-card">
              <h2 className="font-bold text-[#1a0a0a] dark:text-white mb-5">Order Progress</h2>
              {order.status === ORDER_STATUS.CANCELLED ? (
                 <div className="text-center py-6">
                   <div className="text-5xl mb-3 text-red-500/20"><FontAwesomeIcon icon={faTimesCircle} /></div>
                   <p className="font-bold text-red-500 text-lg">Order Cancelled</p>
                 </div>
              ) : (
                <Stepper currentStatus={order.status} />
              )}
            </div>

            {/* Timeline */}
            <div className="rounded-3xl border border-[#E5D0AC]/60 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] p-6 shadow-card">
              <h2 className="font-bold text-[#1a0a0a] dark:text-white mb-4">Event Timeline</h2>
              <div className="space-y-4">
                {[...order.timeline].reverse().map((entry, i) => (
                  <TimelineEntry key={i} entry={entry} isFirst={i === 0} />
                ))}
              </div>
            </div>
          </div>

          {/* Right col (1/3) */}
          <div className="space-y-5">
            {/* Driver card */}
            {order.driver && (
              <Motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-3xl border border-[#E5D0AC]/60 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] p-5 shadow-card"
              >
                <h3 className="font-bold text-[#1a0a0a] dark:text-white flex items-center gap-2 mb-4">
                  <FontAwesomeIcon icon={faMotorcycle} className="text-primary text-sm" /> Your Driver
                </h3>
                {order.awaitingDriverResponse && (
                   <div className="mb-3 text-xs px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-2">
                    <FontAwesomeIcon icon={faHourglassHalf} className="animate-pulse" /> Waiting for driver to accept…
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-brand rounded-2xl flex items-center justify-center text-white text-xl font-black flex-shrink-0 shadow-md">
                    {order.driver.name?.[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-[#1a0a0a] dark:text-white">{order.driver.name}</p>
                    <p className="text-sm text-[#9e7272] flex items-center gap-1">
                      <FontAwesomeIcon icon={faStar} className="text-[10px] text-amber-400" />
                      {order.driver.rating} · {order.driver.vehicleType}
                    </p>
                  </div>
                </div>
                {order.driver.phone && (
                  <a
                    href={`tel:${order.driver.phone}`}
                    className="mt-3 flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl bg-[#f8f3e8] dark:bg-[#2a1010] text-primary text-sm font-bold hover:bg-primary hover:text-white transition-colors"
                  >
                    <FontAwesomeIcon icon={faPhone} className="text-xs" /> {order.driver.phone}
                  </a>
                )}
              </Motion.div>
            )}

            {/* Order items */}
            <div className="rounded-3xl border border-[#E5D0AC]/60 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] p-5 shadow-card">
              <h3 className="font-bold text-[#1a0a0a] dark:text-white mb-4">Items</h3>
              <div className="space-y-2.5">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-sm">
                    {item.image && (
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <span className="flex-1 text-[#1a0a0a] dark:text-white font-medium">{item.name}</span>
                    <span className="text-[#9e7272]">x{item.quantity}</span>
                    <span className="font-bold text-[#1a0a0a] dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-[#E5D0AC]/60 dark:border-[#3d1a1a] space-y-1.5 text-sm">
                <div className="flex justify-between text-[#6b4040] dark:text-[#c9a97a]">
                  <span>Subtotal</span><span>${order.subtotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#6b4040] dark:text-[#c9a97a]">
                  <span>Delivery</span>
                  <span>{order.deliveryFee === 0 ? "FREE" : `$${order.deliveryFee?.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between font-black text-[#1a0a0a] dark:text-white text-base pt-1">
                  <span>Total</span>
                  <span className="text-primary">${order.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Delivery info */}
            <div className="rounded-3xl border border-[#E5D0AC]/60 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] p-5 shadow-card">
              <h3 className="font-bold text-[#1a0a0a] dark:text-white mb-3">Delivery Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary text-xs mt-0.5 flex-shrink-0" />
                  <p className="text-[#6b4040] dark:text-[#c9a97a]">{order.customerAddress}</p>
                </div>
                {order.notes && (
                  <div className="flex items-start gap-2">
                    <span className="text-base flex-shrink-0"><FontAwesomeIcon icon={faStickyNote} /></span>
                    <p className="text-[#6b4040] dark:text-[#c9a97a]">{order.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Cancel */}
            {isLive && (
              <div className="rounded-3xl border border-[#E5D0AC]/60 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] p-5 shadow-card">
                <h3 className="font-bold text-[#1a0a0a] dark:text-white mb-2">Need to Cancel?</h3>
                <p className="text-xs text-[#6b4040] dark:text-[#c9a97a] mb-3">
                  {cancelDecision.allowed
                    ? cancelDecision.requiresWarning
                      ? "Your order is being prepared. Partial refund may apply."
                      : "You can still cancel this order."
                    : "Order cannot be cancelled at this stage."}
                </p>
                <Button
                  variant={cancelDecision.allowed ? "danger" : "outline"}
                  size="sm"
                  className="w-full"
                  disabled={!cancelDecision.allowed}
                  onClick={() => setShowCancelModal(true)}
                >
                  Cancel Order
                </Button>
              </div>
            )}

            {/* Rating */}
            {order.status === ORDER_STATUS.DELIVERED && (
              <Motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-3xl border border-[#E5D0AC]/60 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] p-5 shadow-card"
              >
                {order.rating ? (
                  <div className="text-center">
                    <p className="font-bold text-[#1a0a0a] dark:text-white mb-2">Your Rating</p>
                    <div className="flex justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span key={s} className={`text-2xl ${s <= order.rating ? "text-amber-400" : "text-gray-200 dark:text-gray-700"}`}><FontAwesomeIcon icon={faStar} /></span>
                      ))}
                    </div>
                    {order.ratingComment && (
                      <p className="text-sm text-[#6b4040] dark:text-[#c9a97a] mt-2 italic">"{order.ratingComment}"</p>
                    )}
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-4xl mb-2 text-primary"><FontAwesomeIcon icon={faTrophy} /></div>
                    <p className="font-bold text-[#1a0a0a] dark:text-white mb-1">Order Delivered!</p>
                    <p className="text-xs text-[#9e7272] mb-3">How was your experience?</p>
                    <Button variant="primary" size="sm" className="w-full" onClick={() => setShowRating(true)}>
                      Rate Your Experience <FontAwesomeIcon icon={faStar} className="ml-1" />
                    </Button>
                  </div>
                )}
              </Motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Rating modal */}
      <Modal
        isOpen={showRating}
        onClose={() => setShowRating(false)}
        title={<>Rate Your Experience <FontAwesomeIcon icon={faStar} className="ml-2 text-amber-500" /></>}
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowRating(false)}>Skip</Button>
            <Button variant="primary" onClick={handleSubmitRating}>Submit Rating</Button>
          </>
        }
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="text-5xl text-primary/30"><FontAwesomeIcon icon={faHamburger} /></div>
          <p className="text-[#6b4040] dark:text-[#c9a97a] text-center text-sm">
            How was your order from <strong className="text-[#1a0a0a] dark:text-white">{order.restaurantName || "QuickBite"}</strong>?
          </p>
          <StarRating value={rating} onChange={setRating} />
          <p className="text-sm font-bold text-primary">{[ "", "Poor", "Fair", "Good", "Great", "Excellent!" ][rating]}</p>
          <textarea
            value={ratingComment}
            onChange={(e) => setRatingComment(e.target.value)}
            placeholder="Tell us more about your experience…"
            rows={3}
            className="input w-full resize-none"
          />
        </div>
      </Modal>

      {/* Cancel modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Order"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCancelModal(false)}>Keep Order</Button>
            <Button
              variant="danger"
              loading={isCancelling}
              onClick={handleCancelOrder}
              disabled={!cancelDecision.allowed || (cancelDecision.requiresWarning && !ackPreparing)}
            >
              Confirm Cancel
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">Are you sure you want to cancel this order?</p>
          <div>
            <label className="input-label mb-1">Reason</label>
            <select value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} className="input">
              <option>Changed my mind</option>
              <option>Wrong delivery address</option>
              <option>Long waiting time</option>
              <option>Placed by mistake</option>
              <option>Other</option>
            </select>
          </div>
          {cancelDecision.requiresWarning && (
            <label className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3">
              <input type="checkbox" checked={ackPreparing} onChange={(e) => setAckPreparing(e.target.checked)} className="mt-0.5" />
              <span>Your order is already being prepared. Partial refund may apply.</span>
            </label>
          )}
          {!cancelDecision.allowed && <p className="text-xs text-red-500">{cancelDecision.message}</p>}
        </div>
      </Modal>
    </CustomerLayout>
  );
};

export default OrderTrackingPage;
