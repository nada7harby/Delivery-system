import { Link } from "react-router-dom";
import clsx from "clsx";

const RestaurantCard = ({
  restaurant,
  isFavorite = false,
  onToggleFavorite,
}) => {
  return (
    <Link
      to={`/restaurant/${restaurant.id}`}
      className={clsx(
        "group block rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1a0a0a] shadow-sm",
        "hover:-translate-y-1 hover:shadow-xl transition-all duration-300",
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
          {isFavorite ? "❤️" : "🤍"}
        </button>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] leading-tight">
            {restaurant.name}
          </h3>
          <span className="text-sm font-semibold text-primary">
            ⭐ {restaurant.rating}
          </span>
        </div>

        <p className="text-xs text-[#6b4040] dark:text-[#c9a97a] line-clamp-2">
          {restaurant.description}
        </p>

        <div className="flex items-center justify-between text-xs">
          <span className="px-2 py-1 rounded-full bg-[#f8f3e8] dark:bg-[#3d1a1a] text-[#6b4040] dark:text-[#c9a97a]">
            {restaurant.category}
          </span>
          <span className="text-[#6b4040] dark:text-[#c9a97a]">
            {restaurant.deliveryTime} min
          </span>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
