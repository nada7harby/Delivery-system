import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCheckCircle,
  faCreditCard,
  faSpinner,
  faLocationCrosshairs,
  faCommentAlt,
  faPhone,
  faWallet,
  faTrophy,
  faMoneyBillWave,
  faMobileAlt,
  faShoppingBag,
  faArrowRight,
  faExclamationTriangle,
  faChevronLeft,
  faMapMarkerAlt,
  faClock
} from "@/utils/icons";
import {
  useCartStore,
  useOrderStore,
  useAuthStore,
  useAppStore,
  useTrackingStore,
  useMarketplaceStore,
} from "@/store";
import { CustomerLayout } from "@/layouts";
import { Button, Input } from "@/components";
import clsx from "clsx";

/* ─── Step indicator ─────────────────────────────────── */
const StepDot = ({ step, currentStep, label, icon }) => {
  const done = currentStep > step;
  const active = currentStep === step;
  return (
    <div className="flex flex-col items-center gap-1.5 flex-1">
      <Motion.div
        animate={{
          backgroundColor: done || active ? "#6D2323" : "#E5D0AC",
          scale: active ? 1.15 : 1,
        }}
        transition={{ duration: 0.25 }}
        className={clsx(
          "w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-md",
          done || active ? "text-white" : "text-[#9e7272]",
        )}
      >
        {done ? <FontAwesomeIcon icon={faCheck} className="text-[10px]" /> : icon}
      </Motion.div>
      <span className={clsx("text-xs font-semibold hidden sm:block", active ? "text-primary" : "text-[#9e7272]")}>
        {label}
      </span>
    </div>
  );
};

const StepProgress = ({ step }) => (
  <div className="flex items-center gap-0 mb-8">
    <StepDot step={1} currentStep={step} label="Delivery" icon={<FontAwesomeIcon icon={faLocationCrosshairs} />} />
    <Motion.div
      animate={{ flex: 1, height: 2, background: step > 1 ? "#6D2323" : "#E5D0AC" }}
      transition={{ duration: 0.4 }}
      className="h-0.5 flex-1"
    />
    <StepDot step={2} currentStep={step} label="Payment" icon={<FontAwesomeIcon icon={faCreditCard} />} />
    <Motion.div
      animate={{ flex: 1, height: 2, background: step > 2 ? "#6D2323" : "#E5D0AC" }}
      transition={{ duration: 0.4 }}
      className="h-0.5 flex-1"
    />
    <StepDot step={3} currentStep={step} label="Review" icon={<FontAwesomeIcon icon={faCheckCircle} />} />
  </div>
);

/* ─── Payment method card ────────────────────────────── */
const PaymentOption = ({ value, icon, label, selected, onSelect }) => (
  <Motion.button
    whileTap={{ scale: 0.97 }}
    onClick={() => onSelect(value)}
    className={clsx(
      "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 font-semibold text-sm",
      selected
        ? "border-primary bg-primary/5 text-primary shadow-md"
        : "border-[#E5D0AC] dark:border-[#3d1a1a] text-[#6b4040] dark:text-[#c9a97a] hover:border-primary/40",
    )}
  >
    <span className="text-2xl"><FontAwesomeIcon icon={icon} /></span>
    {label}
    {selected && (
      <span className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
        <FontAwesomeIcon icon={faCheck} className="text-white text-[10px]" />
      </span>
    )}
  </Motion.button>
);

/* ─── Main ───────────────────────────────────────────── */
const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, getTotal, getDeliveryFee, getTax, getGrandTotal, clearCart, restaurantId } = useCartStore();
  const { getRestaurantById } = useMarketplaceStore();
  const { createOrder } = useOrderStore();
  const { user } = useAuthStore();
  const { addToast } = useAppStore();
  const { addNotification } = useTrackingStore();
  const restaurant = getRestaurantById(restaurantId);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    address: user?.address || "",
    phone: user?.phone || "",
    notes: "",
    paymentMethod: "card",
  });
  const [cardForm, setCardForm] = useState({ number: "", expiry: "", cvc: "" });
  const [isPlacing, setIsPlacing] = useState(false);
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (items.length === 0) {
      navigate("/");
    }
  }, [items.length, navigate]);

  if (items.length === 0) return null;

  const validateStep1 = () => {
    const e = {};
    if (!form.address.trim()) e.address = "Delivery address is required";
    if (!form.phone.trim()) e.phone = "Phone number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep((s) => Math.min(3, s + 1));
  };

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    await new Promise((r) => setTimeout(r, 1400));

    const order = createOrder({
      customerId: user?.id,
      customerName: user?.name,
      customerPhone: form.phone,
      customerAddress: form.address,
      restaurantId,
      restaurantName: restaurant?.name,
      pickupLocation: { lat: 40.7128, lng: -74.006, name: "Restaurant HQ" },
      deliveryLocation: {
        lat: 40.7228 + (Math.random() - 0.5) * 0.02,
        lng: -74.016 + (Math.random() - 0.5) * 0.02,
        address: form.address,
      },
      notes: form.notes,
      paymentMethod: form.paymentMethod,
      items: items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
      subtotal: getTotal(),
      deliveryFee: getDeliveryFee(),
      tax: getTax(),
      total: getGrandTotal(),
    });

    addNotification({ type: "order", title: "Order Placed!", message: `Order #${order.id} placed`, orderId: order.id });
    addToast({ type: "success", title: "Order placed!", message: `Searching for a driver…`, duration: 5000 });

    clearCart();
    setIsPlacing(false);
    navigate(`/order/${order.id}`);
  };

  const slideVariants = {
    enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <CustomerLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <Motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl lg:text-4xl font-black text-[#1a0a0a] dark:text-white">
            Checkout
          </h1>
          {restaurant && (
            <p className="text-[#6b4040] dark:text-[#c9a97a] mt-1">
              From <span className="font-bold text-[#1a0a0a] dark:text-white">{restaurant.name}</span>
            </p>
          )}
        </Motion.div>

        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          {/* Left: Steps */}
          <div>
            <StepProgress step={step} />

            <div className="relative overflow-hidden">
              <AnimatePresence mode="wait" custom={1}>
                {/* ── Step 1: Delivery ── */}
                {step === 1 && (
                  <Motion.div
                    key="step1"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="rounded-3xl border border-[#E5D0AC]/60 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] p-6">
                      <h2 className="font-bold text-[#1a0a0a] dark:text-white text-lg flex items-center gap-2 mb-5">
                        <FontAwesomeIcon icon={faMapMarkerAlt} className="text-primary" />
                        Delivery Details
                      </h2>
                      <div className="space-y-4">
                        <div>
                          <label className="input-label">Delivery Address *</label>
                          <div className="relative">
                            <FontAwesomeIcon icon={faLocationCrosshairs} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e7272] text-sm" />
                            <input
                              type="text"
                              placeholder="123 Main St, City, State"
                              value={form.address}
                              onChange={(e) => { setForm({ ...form, address: e.target.value }); setErrors({ ...errors, address: "" }); }}
                              className={clsx("input pl-10", errors.address && "border-red-500 focus:ring-red-400")}
                            />
                          </div>
                          {errors.address && <p className="text-xs text-red-500 mt-1"><FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" /> {errors.address}</p>}
                        </div>

                        <div>
                          <label className="input-label">Phone Number *</label>
                          <div className="relative">
                            <FontAwesomeIcon icon={faPhone} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e7272] text-sm" />
                            <input
                              type="tel"
                              placeholder="+1 (555) 000-0000"
                              value={form.phone}
                              onChange={(e) => { setForm({ ...form, phone: e.target.value }); setErrors({ ...errors, phone: "" }); }}
                              className={clsx("input pl-10", errors.phone && "border-red-500 focus:ring-red-400")}
                            />
                          </div>
                          {errors.phone && <p className="text-xs text-red-500 mt-1"><FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" /> {errors.phone}</p>}
                        </div>

                        <div>
                          <label className="input-label flex items-center gap-1.5">
                            <FontAwesomeIcon icon={faCommentAlt} className="text-xs" />
                            Special Instructions
                          </label>
                          <textarea
                            value={form.notes}
                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                            placeholder="E.g., no onions, extra sauce, leave at door…"
                            rows={3}
                            className="input resize-none"
                          />
                        </div>
                      </div>
                    </div>

                    <Button variant="primary" size="lg" className="w-full" onClick={handleNext}>
                      Continue to Payment <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                    </Button>
                  </Motion.div>
                )}

                {/* ── Step 2: Payment ── */}
                {step === 2 && (
                  <Motion.div
                    key="step2"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="rounded-3xl border border-[#E5D0AC]/60 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] p-6">
                      <h2 className="font-bold text-[#1a0a0a] dark:text-white text-lg flex items-center gap-2 mb-5">
                        <FontAwesomeIcon icon={faCreditCard} className="text-primary" />
                        Payment Method
                      </h2>

                      <div className="grid grid-cols-3 gap-3 mb-5">
                        {[
                          { value: "card", icon: faCreditCard, label: "Credit Card" },
                          { value: "cash", icon: faMoneyBillWave, label: "Cash" },
                          { value: "wallet", icon: faMobileAlt, label: "E-Wallet" },
                        ].map((m) => (
                          <PaymentOption
                            key={m.value}
                            {...m}
                            selected={form.paymentMethod === m.value}
                            onSelect={(v) => setForm({ ...form, paymentMethod: v })}
                          />
                        ))}
                      </div>

                      <AnimatePresence>
                        {form.paymentMethod === "card" && (
                          <Motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="space-y-3 pt-4 border-t border-[#E5D0AC]/60 dark:border-[#3d1a1a]"
                          >
                            <div>
                              <label className="input-label">Card Number</label>
                              <input
                                type="text"
                                placeholder="•••• •••• •••• 4242"
                                value={cardForm.number}
                                onChange={(e) => setCardForm({ ...cardForm, number: e.target.value })}
                                className="input"
                              />
                              <p className="text-xs text-[#9e7272] mt-1">Demo: any number works</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="input-label">Expiry</label>
                                <input type="text" placeholder="MM/YY" className="input" />
                              </div>
                              <div>
                                <label className="input-label">CVC</label>
                                <input type="text" placeholder="•••" className="input" />
                              </div>
                            </div>
                          </Motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">
                        <FontAwesomeIcon icon={faChevronLeft} className="mr-2" /> Back
                      </Button>
                      <Button variant="primary" size="lg" className="flex-[2]" onClick={handleNext}>
                        Review Order <FontAwesomeIcon icon={faArrowRight} className="ml-2" />
                      </Button>
                    </div>
                  </Motion.div>
                )}

                {/* ── Step 3: Review ── */}
                {step === 3 && (
                  <Motion.div
                    key="step3"
                    custom={1}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="rounded-3xl border border-[#E5D0AC]/60 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] p-6 space-y-4">
                      <h2 className="font-bold text-[#1a0a0a] dark:text-white text-lg flex items-center gap-2">
                        <FontAwesomeIcon icon={faCheckCircle} className="text-primary" />
                        Review Your Order
                      </h2>

                      {/* Delivery recap */}
                      <div className="p-4 rounded-2xl bg-[#f8f3e8] dark:bg-[#2a1010]">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#9e7272] mb-2">Delivery To</p>
                        <p className="font-semibold text-[#1a0a0a] dark:text-white text-sm">{form.address}</p>
                        <p className="text-xs text-[#9e7272] mt-0.5">{form.phone}</p>
                        {form.notes && <p className="text-xs text-[#6b4040] dark:text-[#c9a97a] mt-1">Note: {form.notes}</p>}
                      </div>

                      {/* Payment recap */}
                      <div className="p-4 rounded-2xl bg-[#f8f3e8] dark:bg-[#2a1010]">
                        <p className="text-xs font-bold uppercase tracking-widest text-[#9e7272] mb-2">Payment</p>
                        <p className="font-semibold text-[#1a0a0a] dark:text-white text-sm capitalize">
                          {form.paymentMethod === "card" ? "Credit Card" : form.paymentMethod === "cash" ? "Cash on Delivery" : "E-Wallet"}
                        </p>
                      </div>

                      {/* Items recap */}
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#9e7272] mb-3">Items</p>
                        <div className="space-y-2">
                          {items.map((item) => (
                            <div key={item.id} className="flex items-center gap-2 text-sm">
                              {item.image && (
                                <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                              )}
                              <span className="flex-1 text-[#1a0a0a] dark:text-white font-medium">{item.name}</span>
                              <span className="text-[#9e7272]">x{item.quantity}</span>
                              <span className="font-bold text-[#1a0a0a] dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="ghost" onClick={() => setStep(2)} className="flex-1">
                        <FontAwesomeIcon icon={faChevronLeft} className="mr-2" /> Back
                      </Button>
                      <Motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handlePlaceOrder}
                        disabled={isPlacing}
                        className="flex-[2] flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl font-bold text-sm shadow-lg hover:bg-primary-light transition-colors disabled:opacity-70"
                      >
                        {isPlacing ? (
                          <>
                             <FontAwesomeIcon icon={faSpinner} className="animate-spin mr-2" />
                             Placing Order…
                          </>
                        ) : (
                          "Place Order"
                        )}
                      </Motion.button>
                    </div>
                  </Motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Order summary */}
          <div className="sticky top-24">
            <Motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="rounded-3xl overflow-hidden border border-[#E5D0AC]/60 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] shadow-card"
            >
              <div className="bg-gradient-to-br from-[#1a0a0a] to-[#3d1a1a] p-5">
                <h3 className="font-bold text-white text-lg">Order Summary</h3>
                <p className="text-white/60 text-xs mt-0.5">{items.length} items from {restaurant?.name}</p>
              </div>
              <div className="p-5 space-y-3">
                <div className="max-h-48 overflow-y-auto space-y-2 scrollbar-hide mb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-[#1a0a0a] dark:text-white">{item.name} x{item.quantity}</span>
                      <span className="font-bold text-[#1a0a0a] dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#E5D0AC]/60 dark:border-[#3d1a1a] pt-3 space-y-2 text-sm">
                  <div className="flex justify-between text-[#6b4040] dark:text-[#c9a97a]">
                    <span>Subtotal</span><span>${getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#6b4040] dark:text-[#c9a97a]">
                    <span>Delivery</span>
                    <span className={getDeliveryFee() === 0 ? "text-emerald-600 font-bold" : ""}>
                      {getDeliveryFee() === 0 ? "FREE" : `$${getDeliveryFee().toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#6b4040] dark:text-[#c9a97a]">
                    <span>Tax</span><span>${getTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-[#E5D0AC]/60 dark:border-[#3d1a1a]">
                    <span className="font-bold text-[#1a0a0a] dark:text-white">Total</span>
                    <span className="font-black text-xl text-primary">${getGrandTotal().toFixed(2)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-xl bg-[#f8f3e8] dark:bg-[#2a1010] text-xs text-[#6b4040] dark:text-[#c9a97a] font-semibold">
                  <FontAwesomeIcon icon={faClock} className="mr-2" /> Estimated delivery: 25–45 minutes
                </div>
              </div>
            </Motion.div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CheckoutPage;
