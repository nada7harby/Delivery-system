import { Link } from "react-router-dom";
import clsx from "clsx";
import { motion as Motion } from "framer-motion";
import { Clock3, Heart, Star } from "lucide-react";

const RestaurantCard = ({
  restaurant,
  isFavorite = false,
  onToggleFavorite,
}) => {
  return (
    <Motion.div whileHover={{ y: -6 }} transition={{ duration: 0.25 }}>
      <Link
        to={`/restaurant/${restaurant.id}`}
        className={clsx(
          "group block rounded-3xl overflow-hidden border border-[#E5D0AC]/70 dark:border-[#3d1a1a] bg-white/95 dark:bg-[#1a0a0a] shadow-sm",
          "hover:shadow-xl transition-all duration-300",
        )}
      >
        <div className="relative h-44 overflow-hidden">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {restaurant.promotion && (
            <span className="absolute left-3 top-3 text-[10px] font-semibold px-2 py-1 rounded-full bg-primary text-white">
              Promo
            </span>
          )}
          <button
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onToggleFavorite?.(restaurant.id);
            }}
            className="absolute right-3 top-3 w-8 h-8 rounded-full bg-white/90 dark:bg-black/60 flex items-center justify-center"
            aria-label="Toggle favorite restaurant"
          >
            <Heart
              size={15}
              className={
                isFavorite ? "fill-red-500 text-red-500" : "text-slate-700"
              }
            />
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] leading-tight">
              {restaurant.name}
            </h3>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
              <Star size={14} className="fill-current" /> {restaurant.rating}
            </span>
          </div>

          <p className="text-xs text-[#6b4040] dark:text-[#c9a97a] line-clamp-2">
            {restaurant.description}
          </p>

          <div className="flex items-center justify-between text-xs">
            <span className="px-2 py-1 rounded-full bg-[#f8f3e8] dark:bg-[#3d1a1a] text-[#6b4040] dark:text-[#c9a97a]">
              {restaurant.category}
            </span>
            <span className="inline-flex items-center gap-1 text-[#6b4040] dark:text-[#c9a97a]">
              <Clock3 size={12} />
              {restaurant.deliveryTime} min
            </span>
          </div>
        </div>
      </Link>
    </Motion.div>
  );
};

export default RestaurantCard;
