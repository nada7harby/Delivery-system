import QuantitySelector from "@/components/QuantitySelector";
import { motion as Motion } from "framer-motion";
import { Plus } from "lucide-react";

const MenuItemCard = ({
  item,
  quantity = 0,
  onAdd,
  onDecrement,
  onIncrement,
}) => {
  return (
    <Motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="p-4 rounded-2xl border border-[#E5D0AC]/70 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] flex items-center gap-4"
    >
      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-gray-900">
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h4 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] leading-tight">
            {item.name}
          </h4>
          <span className="font-semibold text-primary">
            ${item.price.toFixed(2)}
          </span>
        </div>
        <p className="text-xs mt-1 text-[#6b4040] dark:text-[#c9a97a] line-clamp-2">
          {item.description}
        </p>

        <div className="mt-3">
          {quantity > 0 ? (
            <QuantitySelector
              value={quantity}
              onDecrement={onDecrement}
              onIncrement={onIncrement}
              compact
            />
          ) : (
            <button
              onClick={onAdd}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary-light transition-colors"
            >
              <Plus size={14} />
              Add to cart
            </button>
          )}
        </div>
      </div>
    </Motion.div>
  );
};

export default MenuItemCard;
