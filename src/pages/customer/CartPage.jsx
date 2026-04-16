import { Link } from "react-router-dom";
import { useCartStore, useAppStore, useMarketplaceStore } from "@/store";
import { CustomerLayout } from "@/layouts";
import { Button, Card, EmptyState } from "@/components";

const CartPage = () => {
  const {
    items,
    removeItem,
    updateQuantity,
    getTotal,
    getDeliveryFee,
    getTax,
    getGrandTotal,
    clearCart,
  } = useCartStore();
  const { restaurantId } = useCartStore();
  const { getRestaurantById } = useMarketplaceStore();
  const { addToast } = useAppStore();
  const restaurant = getRestaurantById(restaurantId);

  const handleRemove = (item) => {
    removeItem(item.id);
    addToast({
      type: "info",
      title: "Item removed",
      message: `${item.name} removed from cart`,
    });
  };

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          description="Add some delicious items from the menu to get started!"
          action={
            <Link to="/">
              <Button variant="primary" size="lg" icon="🍔">
                Browse Restaurants
              </Button>
            </Link>
          }
        />
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-6">
            Your Cart 🛒
          </h1>

          {restaurant && (
            <div className="mb-4 text-sm text-[#6b4040] dark:text-[#c9a97a]">
              Ordering from{" "}
              <span className="font-semibold text-[#1a0a0a] dark:text-[#f8f8f8]">
                {restaurant.name}
              </span>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6">
            {/* ... items ... */}
            <div className="lg:col-span-2 space-y-3">
              {items.map((item) => (
                <Card key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-900 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100 dark:border-gray-800">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[#1a0a0a] dark:text-[#f8f8f8] truncate">
                      {item.name}
                    </h3>
                    <p className="text-primary font-bold">
                      ${item.price.toFixed(2)} each
                    </p>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-[#E5D0AC]/50 dark:bg-[#3d1a1a]/50 flex items-center justify-center font-bold text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      −
                    </button>
                    <span className="w-6 text-center font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-[#E5D0AC]/50 dark:bg-[#3d1a1a]/50 flex items-center justify-center font-bold text-primary hover:bg-primary hover:text-white transition-colors"
                    >
                      +
                    </button>
                  </div>

                  <div className="text-right">
                    <p className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => handleRemove(item)}
                      className="text-xs text-red-500 hover:text-red-700 mt-0.5 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </Card>
              ))}

              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    clearCart();
                    addToast({ type: "info", title: "Cart cleared" });
                  }}
                >
                  Clear Cart
                </Button>
              </div>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <h2 className="font-bold text-lg text-[#1a0a0a] dark:text-[#f8f8f8] mb-4">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-[#6b4040] dark:text-[#c9a97a]">
                    <span>Subtotal ({items.length} items)</span>
                    <span className="font-medium">
                      ${getTotal().toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#6b4040] dark:text-[#c9a97a]">
                    <span>Delivery fee</span>
                    <span
                      className={`font-medium ${
                        getDeliveryFee() === 0 ? "text-emerald-600" : ""
                      }`}
                    >
                      {getDeliveryFee() === 0
                        ? "FREE"
                        : `$${getDeliveryFee().toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#6b4040] dark:text-[#c9a97a]">
                    <span>Tax (8%)</span>
                    <span className="font-medium">${getTax().toFixed(2)}</span>
                  </div>
                  {getDeliveryFee() === 0 && (
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs">
                      🎉 Free delivery on orders over $30!
                    </div>
                  )}
                  <div className="pt-3 border-t border-[#E5D0AC] dark:border-[#3d1a1a] flex justify-between font-bold text-base text-[#1a0a0a] dark:text-[#f8f8f8]">
                    <span>Total</span>
                    <span className="text-primary">
                      ${getGrandTotal().toFixed(2)}
                    </span>
                  </div>
                </div>

                <Link to="/checkout" className="block mt-6">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    iconRight="→"
                  >
                    Proceed to Checkout
                  </Button>
                </Link>
                <Link
                  to={restaurantId ? `/restaurant/${restaurantId}` : "/"}
                  className="block mt-2"
                >
                  <Button variant="ghost" size="sm" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CartPage;
