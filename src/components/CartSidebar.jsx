import { Link } from "react-router-dom";
import QuantitySelector from "@/components/QuantitySelector";

const CartSidebar = ({
  items = [],
  restaurant,
  subtotal = 0,
  itemCount = 0,
  onIncrement,
  onDecrement,
  onClear,
}) => {
  return (
    <aside className="rounded-2xl border border-[#E5D0AC] dark:border-[#3d1a1a] bg-white/90 dark:bg-[#1a0a0a] backdrop-blur-sm p-4 sticky top-24">
      <h3 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
        Your Cart
      </h3>
      <p className="text-xs mt-1 text-[#6b4040] dark:text-[#c9a97a]">
        {restaurant?.name || "Selected restaurant"}
      </p>

      {items.length === 0 ? (
        <p className="text-sm mt-6 text-[#6b4040] dark:text-[#c9a97a]">
          No items yet.
        </p>
      ) : (
        <>
          <div className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl bg-[#faf5eb] dark:bg-[#2a1010] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[#1a0a0a] dark:text-[#f8f8f8] line-clamp-1">
                    {item.name}
                  </p>
                  <span className="text-xs font-semibold text-primary">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
                <div className="mt-2">
                  <QuantitySelector
                    value={item.quantity}
                    onIncrement={() => onIncrement(item.id, item.quantity)}
                    onDecrement={() => onDecrement(item.id, item.quantity)}
                    compact
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5D0AC] dark:border-[#3d1a1a]">
            <div className="flex justify-between text-sm">
              <span className="text-[#6b4040] dark:text-[#c9a97a]">
                {itemCount} items
              </span>
              <span className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
                ${subtotal.toFixed(2)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={onClear}
                className="px-3 py-2 rounded-lg border border-[#E5D0AC] dark:border-[#3d1a1a] text-xs font-semibold text-[#6b4040] dark:text-[#c9a97a]"
              >
                Clear
              </button>
              <Link
                to="/cart"
                className="px-3 py-2 rounded-lg text-center text-xs font-semibold bg-primary text-white"
              >
                View Cart
              </Link>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};

export default CartSidebar;
