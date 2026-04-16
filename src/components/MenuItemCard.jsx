import QuantitySelector from "@/components/QuantitySelector";

const MenuItemCard = ({
  item,
  quantity = 0,
  onAdd,
  onDecrement,
  onIncrement,
}) => {
  return (
    <div className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1a0a0a] flex items-center gap-4">
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
              className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary-light transition-colors"
            >
              Add to cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
