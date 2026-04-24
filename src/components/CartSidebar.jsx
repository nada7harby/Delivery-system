import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faShoppingBag, 
  faMinus, 
  faPlus, 
  faChevronRight, 
  faTrash,
  faShoppingCart
} from "@/utils/icons";

const CartSidebar = ({ items = [], restaurant, subtotal = 0, itemCount = 0, onIncrement, onDecrement, onClear }) => {
  return (
    <aside className="sticky top-24 rounded-3xl overflow-hidden border border-[#E5D0AC]/60 dark:border-[#3d1a1a] shadow-card">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary-light p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <FontAwesomeIcon icon={faShoppingBag} className="text-lg" />
            <h3 className="font-bold">Your Cart</h3>
          </div>
          {itemCount > 0 && (
            <span className="w-6 h-6 bg-white text-primary rounded-full flex items-center justify-center text-xs font-black">
              {itemCount}
            </span>
          )}
        </div>
        {restaurant && (
          <p className="text-white/70 text-xs mt-1">{restaurant.name}</p>
        )}
      </div>

      <div className="bg-white/95 dark:bg-[#1a0a0a] backdrop-blur-sm">
        {items.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3 text-primary/30">
              <FontAwesomeIcon icon={faShoppingCart} />
            </div>
            <p className="text-sm font-semibold text-[#6b4040] dark:text-[#c9a97a]">Your cart is empty</p>
            <p className="text-xs text-[#9e7272] mt-1">Add items from the menu</p>
          </div>
        ) : (
          <>
            <div className="max-h-72 overflow-y-auto p-3 space-y-2.5 scrollbar-hide">
              <AnimatePresence>
                {items.map((item) => (
                  <Motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    className="flex items-center gap-3 bg-[#faf5eb] dark:bg-[#2a1010] rounded-xl p-2.5"
                  >
                    {item.image && (
                      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#1a0a0a] dark:text-white line-clamp-1">{item.name}</p>
                      <p className="text-xs text-primary font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => onDecrement(item.id, item.quantity)}
                        className="w-6 h-6 rounded-lg bg-white dark:bg-[#3d1a1a] flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors text-sm font-bold"
                      >
                        <FontAwesomeIcon icon={faMinus} className="text-[10px]" />
                      </button>
                      <span className="w-5 text-center text-xs font-black text-[#1a0a0a] dark:text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onIncrement(item.id, item.quantity)}
                        className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center text-white hover:bg-primary-light transition-colors"
                      >
                        <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
                      </button>
                    </div>
                  </Motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="p-4 border-t border-[#E5D0AC]/60 dark:border-[#3d1a1a]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
                  {itemCount} items
                </span>
                <span className="font-black text-lg text-[#1a0a0a] dark:text-white">
                  ${subtotal.toFixed(2)}
                </span>
              </div>

              <Link
                to="/cart"
                className="flex items-center justify-between w-full px-4 py-3 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-light transition-colors shadow-md hover:shadow-glow"
              >
                <span>View Cart & Checkout</span>
                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </Link>

              <button
                onClick={onClear}
                className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#9e7272] hover:text-red-500 transition-colors py-1.5"
              >
                <FontAwesomeIcon icon={faTrash} className="text-[10px]" />
                Clear Cart
              </button>
            </div>
          </>
        )}
      </div>
    </aside>
  );
};

export default CartSidebar;
