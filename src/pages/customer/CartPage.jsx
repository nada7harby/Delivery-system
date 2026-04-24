import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowRight,
  faMinus,
  faPlus,
  faShoppingCart,
  faStar,
  faTrash,
  faUtensils,
  faTrophy,
} from "@/utils/icons";
import { useCartStore, useAppStore, useMarketplaceStore } from "@/store";
import { CustomerLayout } from "@/layouts";
import { Button, EmptyState } from "@/components";

/* ─── Cart item row ──────────────────────────────────── */
const CartItemRow = ({ item, onIncrement, onDecrement, onRemove }) => (
  <Motion.div
    layout
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, x: -30, height: 0 }}
    transition={{ duration: 0.25 }}
    className="group flex items-center gap-4 p-4 rounded-2xl border border-[#E5D0AC]/60 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] hover:border-primary/20 hover:shadow-card transition-all duration-300"
  >
    {/* Image */}
    <div className="w-18 h-18 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 w-[72px] h-[72px]">
      {item.image ? (
        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-2xl text-primary/20"><FontAwesomeIcon icon={faUtensils} /></div>
      )}
    </div>

    {/* Info */}
    <div className="flex-1 min-w-0">
      <h3 className="font-bold text-[#1a0a0a] dark:text-white truncate mb-0.5">{item.name}</h3>
      <p className="text-primary font-bold text-sm">${item.price.toFixed(2)} each</p>
    </div>

    {/* Quantity */}
    <div className="flex items-center gap-2 flex-shrink-0">
      <Motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onDecrement}
        className="w-8 h-8 rounded-xl bg-[#f8f3e8] dark:bg-[#2a1010] flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors font-bold"
      >
        <FontAwesomeIcon icon={faMinus} className="text-xs" />
      </Motion.button>
      <span className="w-6 text-center font-black text-[#1a0a0a] dark:text-white">
        {item.quantity}
      </span>
      <Motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onIncrement}
        className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white hover:bg-primary-light transition-colors"
      >
        <FontAwesomeIcon icon={faPlus} className="text-xs" />
      </Motion.button>
    </div>

    {/* Total + remove */}
    <div className="text-right flex-shrink-0">
      <p className="font-black text-[#1a0a0a] dark:text-white">${(item.price * item.quantity).toFixed(2)}</p>
      <button
        onClick={onRemove}
        className="mt-1 inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-600 transition-colors"
      >
        <FontAwesomeIcon icon={faTrash} className="text-[10px]" /> Remove
      </button>
    </div>
  </Motion.div>
);

/* ─── Main ───────────────────────────────────────────── */
const CartPage = () => {
  const { items, removeItem, updateQuantity, getTotal, getDeliveryFee, getTax, getGrandTotal, clearCart, restaurantId } = useCartStore();
  const { getRestaurantById } = useMarketplaceStore();
  const { addToast } = useAppStore();
  const restaurant = getRestaurantById(restaurantId);

  const handleRemove = (item) => {
    removeItem(item.id);
    addToast({ type: "info", title: "Item removed", message: `${item.name} removed from cart` });
  };

  if (items.length === 0) {
    return (
      <CustomerLayout>
        <div className="max-w-2xl mx-auto px-4 py-16">
          <EmptyState
            icon={faShoppingCart}
            title="Your cart is empty"
            description="Browse our restaurants and add some delicious items!"
            action={
              <Link to="/">
                <Button variant="primary" size="lg">Browse Restaurants</Button>
              </Link>
            }
          />
        </div>
      </CustomerLayout>
    );
  }

  const isFreeDelivery = getDeliveryFee() === 0;

  return (
    <CustomerLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <Motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl lg:text-4xl font-black text-[#1a0a0a] dark:text-white flex items-center gap-3">
            <FontAwesomeIcon icon={faShoppingCart} className="text-primary text-2xl" />
            Your Cart
          </h1>
          {restaurant && (
            <p className="mt-2 text-[#6b4040] dark:text-[#c9a97a]">
              Ordering from{" "}
              <Link to={`/restaurant/${restaurantId}`} className="font-bold text-[#1a0a0a] dark:text-white hover:text-primary transition-colors underline underline-offset-2">
                {restaurant.name}
              </Link>
            </p>
          )}
        </Motion.div>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Items list */}
          <div>
            <AnimatePresence>
              <div className="space-y-3">
                {items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    onIncrement={() => updateQuantity(item.id, item.quantity + 1)}
                    onDecrement={() => updateQuantity(item.id, item.quantity - 1)}
                    onRemove={() => handleRemove(item)}
                  />
                ))}
              </div>
            </AnimatePresence>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => { clearCart(); addToast({ type: "info", title: "Cart cleared" }); }}
                className="inline-flex items-center gap-1.5 text-sm text-[#9e7272] hover:text-red-500 transition-colors py-2 font-semibold"
              >
                <FontAwesomeIcon icon={faTrash} className="text-xs" /> Clear Cart
              </button>
            </div>
          </div>

          {/* Order summary */}
          <div className="sticky top-24">
            <Motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-3xl overflow-hidden border border-[#E5D0AC]/60 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] shadow-card"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-[#1a0a0a] to-[#3d1a1a] dark:from-[#2a1010] dark:to-[#4a1515] p-5">
                <h2 className="font-display font-bold text-xl text-white">Order Summary</h2>
                <p className="text-white/60 text-sm mt-0.5">{items.length} item(s)</p>
              </div>

              <div className="p-5">
                {/* Items preview */}
                <div className="space-y-3 mb-5 max-h-48 overflow-y-auto scrollbar-hide">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5 text-sm">
                      {item.image && (
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#1a0a0a] dark:text-white truncate">{item.name}</p>
                        <p className="text-xs text-[#9e7272]">x{item.quantity}</p>
                      </div>
                      <span className="font-bold text-[#1a0a0a] dark:text-white">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="space-y-2.5 pt-4 border-t border-[#E5D0AC]/60 dark:border-[#3d1a1a]">
                  <div className="flex justify-between text-sm text-[#6b4040] dark:text-[#c9a97a]">
                    <span>Subtotal</span>
                    <span className="font-semibold">${getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6b4040] dark:text-[#c9a97a]">Delivery</span>
                    <span className={`font-semibold ${isFreeDelivery ? "text-emerald-600 dark:text-emerald-400" : "text-[#6b4040] dark:text-[#c9a97a]"}`}>
                      {isFreeDelivery ? "FREE" : `$${getDeliveryFee().toFixed(2)}`} {isFreeDelivery && <FontAwesomeIcon icon={faTrophy} className="ml-1 text-amber-500 animate-bounce" />}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-[#6b4040] dark:text-[#c9a97a]">
                    <span>Tax (8%)</span>
                    <span className="font-semibold">${getTax().toFixed(2)}</span>
                  </div>

                  {isFreeDelivery && (
                    <Motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-semibold"
                    >
                      <FontAwesomeIcon icon={faStar} className="text-[10px]" />
                      Free delivery on orders over $30!
                    </Motion.div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-[#E5D0AC]/60 dark:border-[#3d1a1a]">
                    <span className="font-bold text-[#1a0a0a] dark:text-white">Total</span>
                    <span className="font-black text-xl text-primary">${getGrandTotal().toFixed(2)}</span>
                  </div>
                </div>

                <Link to="/checkout" className="block mt-5">
                  <Motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-between px-5 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg hover:bg-primary-light transition-colors"
                  >
                    <span>Proceed to Checkout</span>
                    <FontAwesomeIcon icon={faArrowRight} className="text-base" />
                  </Motion.button>
                </Link>

                <Link to={restaurantId ? `/restaurant/${restaurantId}` : "/"} className="block mt-2">
                  <button className="w-full py-2.5 text-sm font-semibold text-[#9e7272] hover:text-primary transition-colors">
                    + Continue Shopping
                  </button>
                </Link>
              </div>
            </Motion.div>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CartPage;
