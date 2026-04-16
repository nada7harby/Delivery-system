import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useCartStore,
  useOrderStore,
  useAuthStore,
  useAppStore,
  useTrackingStore,
  useMarketplaceStore,
} from "@/store";
import { CustomerLayout } from "@/layouts";
import { Button, Card, Input } from "@/components";
const CheckoutPage = () => {
  const navigate = useNavigate();
  const {
    items,
    getTotal,
    getDeliveryFee,
    getTax,
    getGrandTotal,
    clearCart,
    restaurantId,
  } = useCartStore();
  const { getRestaurantById } = useMarketplaceStore();
  const { createOrder } = useOrderStore();
  const { user } = useAuthStore();
  const { addToast } = useAppStore();
  const { addNotification } = useTrackingStore();
  const restaurant = getRestaurantById(restaurantId);

  const [form, setForm] = useState({
    address: user?.address || "",
    phone: user?.phone || "",
    notes: "",
    paymentMethod: "card",
  });
  const [isPlacing, setIsPlacing] = useState(false);

  const handlePlaceOrder = async () => {
    if (!form.address.trim()) {
      addToast({
        type: "error",
        title: "Address required",
        message: "Please enter a delivery address",
      });
      return;
    }

    setIsPlacing(true);
    await new Promise((r) => setTimeout(r, 1200));

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
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
      })),
      subtotal: getTotal(),
      deliveryFee: getDeliveryFee(),
      tax: getTax(),
      total: getGrandTotal(),
    });

    addNotification({
      type: "order",
      title: "Order Placed! 🎉",
      message: `Order #${order.id} placed successfully`,
      orderId: order.id,
    });

    addNotification({
      type: "order",
      title: "Searching for driver...",
      message:
        "We are auto-assigning the best available driver for your order.",
      orderId: order.id,
    });

    addToast({
      type: "success",
      title: "Order placed! 🎉",
      message: `Order #${order.id} is searching for a driver`,
      duration: 5000,
    });

    clearCart();
    setIsPlacing(false);
    navigate(`/order/${order.id}`);
  };

  if (items.length === 0) {
    navigate("/");
    return null;
  }

  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-6">
            Checkout 🛍️
          </h1>
          {restaurant && (
            <p className="mb-5 text-sm text-[#6b4040] dark:text-[#c9a97a]">
              You are checking out items from{" "}
              <span className="font-semibold text-[#1a0a0a] dark:text-[#f8f8f8]">
                {restaurant.name}
              </span>
            </p>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2 space-y-5">
              {/* Delivery details */}
              <Card>
                <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-4 flex items-center gap-2">
                  <span>📍</span> Delivery Details
                </h2>
                <div className="space-y-4">
                  <Input
                    label="Delivery Address"
                    placeholder="123 Main St, City, State"
                    value={form.address}
                    onChange={(e) =>
                      setForm({ ...form, address: e.target.value })
                    }
                    icon="🏠"
                    required
                  />
                  <Input
                    label="Phone Number"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    icon="📱"
                  />
                  <div>
                    <label className="input-label">Special Instructions</label>
                    <textarea
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                      placeholder="E.g., no onions, extra sauce, leave at door..."
                      rows={3}
                      className="input resize-none"
                    />
                  </div>
                </div>
              </Card>

              {/* Payment method */}
              <Card>
                <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-4 flex items-center gap-2">
                  <span>💳</span> Payment Method
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { value: "card", icon: "💳", label: "Credit Card" },
                    { value: "cash", icon: "💵", label: "Cash" },
                    { value: "wallet", icon: "📱", label: "Digital Wallet" },
                  ].map((method) => (
                    <button
                      key={method.value}
                      onClick={() =>
                        setForm({ ...form, paymentMethod: method.value })
                      }
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        form.paymentMethod === method.value
                          ? "border-primary bg-primary/10"
                          : "border-[#E5D0AC] dark:border-[#3d1a1a] hover:border-primary/50"
                      }`}
                    >
                      <span className="text-2xl">{method.icon}</span>
                      <span className="text-xs font-semibold text-[#1a0a0a] dark:text-[#f8f8f8]">
                        {method.label}
                      </span>
                    </button>
                  ))}
                </div>

                {form.paymentMethod === "card" && (
                  <div className="mt-4 space-y-3">
                    <Input
                      label="Card Number"
                      placeholder="•••• •••• •••• 4242"
                      icon="💳"
                      hint="Demo: any number works"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Expiry" placeholder="MM/YY" />
                      <Input label="CVC" placeholder="•••" />
                    </div>
                  </div>
                )}
              </Card>
            </div>

            {/* Order summary */}
            <div>
              <Card className="sticky top-24">
                <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-4">
                  Order Summary
                </h2>

                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[#1a0a0a] dark:text-[#f8f8f8] truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#6b4040] dark:text-[#c9a97a]">
                          x{item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold text-[#1a0a0a] dark:text-[#f8f8f8]">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 text-sm border-t border-[#E5D0AC] dark:border-[#3d1a1a] pt-4">
                  <div className="flex justify-between text-[#6b4040] dark:text-[#c9a97a]">
                    <span>Subtotal</span>
                    <span>${getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#6b4040] dark:text-[#c9a97a]">
                    <span>Delivery</span>
                    <span
                      className={
                        getDeliveryFee() === 0
                          ? "text-emerald-600 font-semibold"
                          : ""
                      }
                    >
                      {getDeliveryFee() === 0
                        ? "FREE"
                        : `$${getDeliveryFee().toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#6b4040] dark:text-[#c9a97a]">
                    <span>Tax</span>
                    <span>${getTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base text-[#1a0a0a] dark:text-[#f8f8f8] pt-2 border-t border-[#E5D0AC] dark:border-[#3d1a1a]">
                    <span>Total</span>
                    <span className="text-primary">
                      ${getGrandTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-[#E5D0AC]/30 dark:bg-[#3d1a1a]/30 rounded-xl text-xs text-[#6b4040] dark:text-[#c9a97a] flex items-center gap-2">
                  <span>⏱</span>
                  <span>Estimated delivery: 25–45 minutes</span>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  className="w-full mt-5"
                  loading={isPlacing}
                  onClick={handlePlaceOrder}
                  icon="🛍️"
                >
                  Place Order
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CheckoutPage;
