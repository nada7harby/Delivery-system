import { Link } from "react-router-dom";
import clsx from "clsx";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faHeart, 
  faStar, 
  faBolt, 
  faMapMarkerAlt 
} from "@/utils/icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";

const RestaurantCard = ({ restaurant, isFavorite = false, onToggleFavorite }) => {
  const isOpen = restaurant.isActive ?? restaurant.isOpen ?? true;

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group"
    >
      <Link
        to={`/restaurant/${restaurant.id}`}
        className={clsx(
          "block rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-400",
          "bg-white dark:bg-[#1a0a0a]",
          "border border-white/60 dark:border-[#3d1a1a]/60",
        )}
      >
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <Motion.img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            whileHover={{ scale: 1.08 }}
            transition={{ duration: 0.5 }}
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {restaurant.promotion && (
              <Motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-[10px] font-black px-2.5 py-1 rounded-full bg-primary text-white uppercase tracking-wide shadow-lg"
              >
                {restaurant.promotion}
              </Motion.span>
            )}
            {(restaurant.tags || []).map((tag) => (
              <span
                key={tag}
                className={clsx(
                  "text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-lg",
                  tag === "Popular" && "bg-amber-400 text-black",
                  tag === "New" && "bg-emerald-500 text-white",
                  tag === "Top Rated" && "bg-blue-500 text-white",
                  !["Popular", "New", "Top Rated"].includes(tag) && "bg-white/90 text-[#1a0a0a]",
                )}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Closed overlay */}
          {!isOpen && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[2px]">
              <span className="bg-white/95 text-[#1a0a0a] px-4 py-1.5 rounded-full font-bold text-sm shadow-lg">
                Closed
              </span>
            </div>
          )}

          {/* Favorite button */}
          <Motion.button
            whileTap={{ scale: 0.85 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.(restaurant.id);
            }}
            className={clsx(
              "absolute right-3 top-3 w-9 h-9 rounded-full flex items-center justify-center shadow-lg transition-all duration-300",
              isFavorite
                ? "bg-red-500 text-white"
                : "bg-white/90 dark:bg-black/60 text-slate-600 hover:bg-red-50",
            )}
            aria-label="Toggle favorite"
          >
            <FontAwesomeIcon 
              icon={isFavorite ? faHeart : faHeartRegular} 
              className={clsx("text-sm", isFavorite ? "text-white" : "")} 
            />
          </Motion.button>

          {/* Bottom info overlay */}
          <div className="absolute bottom-3 left-3 right-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 bg-white/95 dark:bg-black/80 px-2.5 py-1 rounded-full shadow">
                <FontAwesomeIcon icon={faStar} className="text-[10px] text-amber-400" />
                <span className="text-xs font-black text-[#1a0a0a] dark:text-white">
                  {restaurant.rating}
                </span>
              </div>
              <div className="flex items-center gap-1 bg-white/95 dark:bg-black/80 px-2.5 py-1 rounded-full shadow text-xs font-semibold text-[#1a0a0a] dark:text-white">
                <FontAwesomeIcon icon={faBolt} className="text-[10px] text-primary" />
                {restaurant.deliveryTime} min
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-display font-bold text-[#1a0a0a] dark:text-white leading-tight group-hover:text-primary transition-colors duration-200">
              {restaurant.name}
            </h3>
          </div>

          <p className="text-xs text-[#6b4040] dark:text-[#c9a97a] line-clamp-2 leading-relaxed mb-3">
            {restaurant.description}
          </p>

          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#f8f3e8] dark:bg-[#3d1a1a] text-xs font-semibold text-[#6b4040] dark:text-[#c9a97a]">
              {restaurant.category}
            </span>
            <span className="inline-flex items-center gap-1 text-xs text-[#9e7272]">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-[10px]" />
              {restaurant.location || "City"}
            </span>
          </div>
        </div>
      </Link>
    </Motion.div>
  );
};

export default RestaurantCard;
