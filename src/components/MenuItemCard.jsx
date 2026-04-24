import { useState } from "react";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus, faUtensils, faCheck } from "@/utils/icons";
import clsx from "clsx";

const MenuItemCard = ({ item, quantity = 0, onAdd, onDecrement, onIncrement }) => {
  const [adding, setAdding] = useState(false);
  const isUnavailable = item.isAvailable === false;

  const handleAdd = () => {
    if (isUnavailable) return;
    setAdding(true);
    onAdd?.();
    setTimeout(() => setAdding(false), 600);
  };

  return (
    <Motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        "group flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-300",
        "bg-white dark:bg-[#1a0a0a]",
        isUnavailable
          ? "border-gray-200 dark:border-[#3d1a1a]/40 opacity-60"
          : "border-[#E5D0AC]/70 dark:border-[#3d1a1a] hover:border-primary/30 hover:shadow-card",
      )}
    >
      {/* Image */}
      <div className="relative w-[88px] h-[88px] flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900">
        {item.image ? (
          <Motion.img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.4 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl text-primary/20"><FontAwesomeIcon icon={faUtensils} /></div>
        )}
        {isUnavailable && (
          <div className="absolute inset-0 bg-white/60 dark:bg-black/60 flex items-center justify-center">
            <span className="text-[10px] font-bold text-gray-500 bg-white/90 px-2 py-0.5 rounded-full">
              Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-[#1a0a0a] dark:text-white leading-tight mb-1 group-hover:text-primary transition-colors duration-200">
          {item.name}
        </h4>
        {item.description && (
          <p className="text-xs text-[#6b4040] dark:text-[#c9a97a] line-clamp-2 leading-relaxed mb-2">
            {item.description}
          </p>
        )}
        <p className="font-black text-primary text-base">${Number(item.price).toFixed(2)}</p>
      </div>

      {/* Action */}
      <div className="flex-shrink-0">
        <AnimatePresence mode="wait">
          {quantity > 0 ? (
            <Motion.div
              key="qty"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="flex items-center gap-2 bg-[#f8f3e8] dark:bg-[#2a1010] rounded-xl p-1"
            >
              <Motion.button
                whileTap={{ scale: 0.85 }}
                onClick={onDecrement}
                className="w-7 h-7 rounded-lg bg-white dark:bg-[#3d1a1a] flex items-center justify-center text-primary font-bold shadow-sm hover:bg-primary hover:text-white transition-colors"
              >
                <FontAwesomeIcon icon={faMinus} className="text-[10px]" />
              </Motion.button>
              <span className="w-5 text-center font-black text-[#1a0a0a] dark:text-white text-sm">
                {quantity}
              </span>
              <Motion.button
                whileTap={{ scale: 0.85 }}
                onClick={onIncrement}
                className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold shadow-sm hover:bg-primary-light transition-colors"
              >
                <FontAwesomeIcon icon={faPlus} className="text-[10px]" />
              </Motion.button>
            </Motion.div>
          ) : (
            <Motion.button
              key="add"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleAdd}
              disabled={isUnavailable}
              className={clsx(
                "flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all duration-200 shadow-sm",
                adding
                  ? "bg-emerald-500 text-white scale-95"
                  : isUnavailable
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-primary text-white hover:bg-primary-light hover:shadow-glow",
              )}
            >
              {adding ? (
                <Motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-base"
                >
                  <FontAwesomeIcon icon={faCheck} />
                </Motion.span>
              ) : (
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
              )}
              {adding ? "Added!" : "Add"}
            </Motion.button>
          )}
        </AnimatePresence>
      </div>
    </Motion.div>
  );
};

export default MenuItemCard;
