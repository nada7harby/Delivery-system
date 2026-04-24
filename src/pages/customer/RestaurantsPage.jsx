import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCompass,
  faFilter,
  faFire,
  faSearch,
  faStar,
  faChartLine,
  faTimes,
  faSortAlphaDown,
  faUtensils,
  faArrowTrendUp as faTrendingUp
} from "@/utils/icons";
import { useMarketplaceStore, useCartStore, useAppStore } from "@/store";
import { CustomerLayout } from "@/layouts";
import { Card, EmptyState, RestaurantCard, CustomSelect, Button } from "@/components";
import { RESTAURANT_CATEGORIES } from "@/constants";

/* ─── Skeleton ───────────────────────────────────────── */
const RestaurantSkeleton = () => (
  <div className="rounded-3xl overflow-hidden border border-[#E5D0AC]/50 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] animate-pulse">
    <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-100 dark:from-gray-800 dark:to-gray-900" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded-full w-5/6" />
      <div className="flex gap-2 pt-1">
        <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800 rounded-full ml-auto" />
      </div>
    </div>
  </div>
);

/* ─── Category pill ──────────────────────────────────── */
const CategoryPill = ({ label, active, onClick }) => (
  <Motion.button
    whileTap={{ scale: 0.93 }}
    onClick={onClick}
    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all duration-250 border-2 ${
      active
        ? "bg-primary text-white border-primary shadow-glow"
        : "bg-white/80 dark:bg-[#1a0a0a]/80 text-[#6b4040] dark:text-[#c9a97a] border-[#E5D0AC] dark:border-[#3d1a1a] hover:border-primary/50"
    }`}
  >
    {label}
  </Motion.button>
);

/* ─── Stat bubble ────────────────────────────────────── */
const StatBubble = ({ value, label }) => (
  <div className="text-center">
    <p className="text-2xl lg:text-3xl font-black text-[#1a0a0a] dark:text-white">{value}</p>
    <p className="text-[10px] font-bold uppercase tracking-widest text-[#9e7272] mt-0.5">{label}</p>
  </div>
);

/* ─── Main page ──────────────────────────────────────── */
const RestaurantsPage = () => {
  const {
    restaurants,
    favoriteRestaurantIds,
    toggleFavoriteRestaurant,
  } = useMarketplaceStore();
  const { restaurantId: cartRestaurantId, getItemCount } = useCartStore();
  const { addToast } = useAppStore();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("rating");
  const [visibleCount, setVisibleCount] = useState(8);
  const [isLoading, setIsLoading] = useState(true);
  const searchRef = useRef(null);
  const loadMoreRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        setVisibleCount((c) => c + 6);
      },
      { threshold: 0.15 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const filteredRestaurants = useMemo(() => {
    return restaurants
      .filter((r) => {
        const q = search.toLowerCase();
        const matchSearch =
          !search ||
          r.name.toLowerCase().includes(q) ||
          (r.location || "").toLowerCase().includes(q);
        const matchCat = category === "All" || r.category === category;
        const isVisible = r.isActive ?? r.isOpen ?? true;
        return matchSearch && matchCat && isVisible;
      })
      .sort((a, b) => {
        if (sortBy === "delivery") return a.deliveryTime - b.deliveryTime;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return b.rating - a.rating;
      });
  }, [restaurants, search, category, sortBy]);

  const displayedRestaurants = filteredRestaurants.slice(0, visibleCount);
  const favoriteRestaurants = restaurants.filter((r) => favoriteRestaurantIds.includes(r.id));
  const topRated = useMemo(
    () => [...restaurants].filter(r => r.isActive ?? r.isOpen ?? true).sort((a, b) => b.rating - a.rating).slice(0, 3),
    [restaurants],
  );
  const showCartBanner = cartRestaurantId && getItemCount() > 0;
  const cartRestaurant = restaurants.find((r) => r.id === cartRestaurantId);

  const handleFavoriteToggle = (id) => {
    const added = toggleFavoriteRestaurant(id);
    addToast({ type: added ? "success" : "info", title: added ? "Added to favorites" : "Removed from favorites" });
  };

  return (
    <CustomerLayout>
      <section className="max-w-7xl mx-auto px-4 pt-6 pb-16 space-y-10">

        {/* ── Hero banner ── */}
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative overflow-hidden rounded-[2.5rem] p-8 lg:p-12"
          style={{
            background: "linear-gradient(135deg, #fff9ea 0%, #ffe6bb 40%, #ffd499 70%, #f6c786 100%)",
          }}
        >
          {/* Dark mode gradient */}
          <div className="absolute inset-0 dark:bg-gradient-to-br dark:from-[#2a1010] dark:via-[#3a1515] dark:to-[#4a1919] rounded-[2.5rem]" />

          {/* Decorative blobs */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-amber-400/20 blur-3xl" />

          <div className="relative z-10 grid lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <Motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-[11px] font-black uppercase tracking-widest mb-4"
              >
                <FontAwesomeIcon icon={faStar} className="text-[10px]" />
                Marketplace
              </Motion.div>

              <Motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="font-display text-4xl lg:text-6xl font-black text-[#1a0a0a] dark:text-white leading-[0.95] tracking-tight mb-4"
              >
                Your Next Meal,{" "}
                <span className="text-gradient">Curated</span>
              </Motion.h1>

              <Motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-[#6b4040] dark:text-[#c9a97a] text-base lg:text-lg mb-6 max-w-lg"
              >
                Discover local restaurants, compare delivery times, and get your order in minutes.
              </Motion.p>

              {/* Search */}
              <Motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="relative max-w-lg"
              >
                <FontAwesomeIcon
                  icon={faSearch}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9e7272] pointer-events-none"
                />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search restaurants or locations…"
                  className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-white/90 dark:bg-[#1a0a0a]/80 text-[#1a0a0a] dark:text-white placeholder-[#9e7272] border border-white/60 dark:border-[#3d1a1a] focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-lg backdrop-blur-sm font-medium"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9e7272] hover:text-primary transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} className="text-sm" />
                  </button>
                )}
              </Motion.div>
            </div>

            {/* Stats */}
            <Motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="hidden lg:flex flex-col gap-6 pl-10 border-l border-[#E5D0AC] dark:border-[#3d1a1a]"
            >
              <StatBubble value={`${restaurants.length}+`} label="Restaurants" />
              <div className="h-px bg-[#E5D0AC] dark:bg-[#3d1a1a]" />
              <StatBubble value="25 min" label="Avg Delivery" />
              <div className="h-px bg-[#E5D0AC] dark:bg-[#3d1a1a]" />
              <StatBubble value={<>4.8 <FontAwesomeIcon icon={faStar} className="text-amber-500 text-[10px] ml-0.5" /></>} label="Avg Rating" />
            </Motion.div>
          </div>
        </Motion.div>

        {/* ── Active cart banner ── */}
        <AnimatePresence>
          {showCartBanner && (
            <Motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Card className="flex items-center justify-between gap-3 p-4 border-primary/30 bg-primary/5">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#9e7272] font-semibold mb-0.5">
                    Active Cart
                  </p>
                  <p className="font-bold text-[#1a0a0a] dark:text-white text-sm">
                    {getItemCount()} item(s) from{" "}
                    <span className="text-primary">{cartRestaurant?.name || "a restaurant"}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link to={cartRestaurantId ? `/restaurant/${cartRestaurantId}` : "/cart"}>
                    <Button variant="outline" size="sm">Continue Order</Button>
                  </Link>
                  <Link to="/cart">
                    <Button variant="primary" size="sm">View Cart</Button>
                  </Link>
                </div>
              </Card>
            </Motion.div>
          )}
        </AnimatePresence>

        {/* ── Favorites ── */}
        <AnimatePresence>
          {favoriteRestaurants.length > 0 && (
            <Motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center gap-2 mb-4">
                <h2 className="font-display font-bold text-xl text-[#1a0a0a] dark:text-white flex items-center gap-2">
                  <FontAwesomeIcon icon={faCompass} className="text-primary" /> Favorites
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                  {favoriteRestaurants.length}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {favoriteRestaurants.slice(0, 4).map((r) => (
                  <RestaurantCard
                    key={r.id}
                    restaurant={r}
                    isFavorite
                    onToggleFavorite={handleFavoriteToggle}
                  />
                ))}
              </div>
            </Motion.section>
          )}
        </AnimatePresence>

        {/* ── Top rated strip ── */}
        {topRated.length > 0 && (
          <Motion.section
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <h2 className="font-display font-bold text-xl text-[#1a0a0a] dark:text-white flex items-center gap-2 mb-4">
              <FontAwesomeIcon icon={faTrendingUp} className="text-amber-500" /> Top Picks
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {topRated.map((r, i) => (
                <Motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                >
                  <Link to={`/restaurant/${r.id}`}>
                    <Card className="flex items-center gap-3 p-3.5 hover:border-primary/30 transition-all duration-250 hover:shadow-card-hover group">
                      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-[#E5D0AC] dark:ring-[#3d1a1a]">
                        {r.image && (
                          <img src={r.image} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1a0a0a] dark:text-white text-sm truncate group-hover:text-primary transition-colors">
                          {r.name}
                        </p>
                        <p className="text-xs text-[#9e7272]">{r.category}</p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                         <FontAwesomeIcon icon={faStar} className="text-amber-400" />
                         <span className="text-sm font-black text-[#1a0a0a] dark:text-white">{r.rating}</span>
                      </div>
                    </Card>
                  </Link>
                </Motion.div>
              ))}
            </div>
          </Motion.section>
        )}

        {/* ── All restaurants ── */}
        <section>
          {/* Filters header */}
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between mb-6">
            <h2 className="font-display font-bold text-xl text-[#1a0a0a] dark:text-white flex items-center gap-2">
              <FontAwesomeIcon icon={faFire} className="text-primary" /> All Restaurants
              {filteredRestaurants.length < restaurants.length && (
                <span className="text-sm font-normal text-[#9e7272]">
                  ({filteredRestaurants.length} results)
                </span>
              )}
            </h2>
            <CustomSelect
              value={sortBy}
              onChange={setSortBy}
              className="w-full lg:w-52"
              options={[
                { value: "rating", label: "Top Rated", icon: faStar },
                { value: "delivery", label: "Fast Delivery", icon: faFire },
                { value: "name", label: "Name A-Z", icon: faSortAlphaDown },
              ]}
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide mb-6">
            {RESTAURANT_CATEGORIES.map((cat) => (
              <CategoryPill
                key={cat}
                label={cat}
                active={category === cat}
                onClick={() => setCategory(cat)}
              />
            ))}
          </div>

          {/* Active filter chip */}
          <AnimatePresence>
            {(search || category !== "All") && (
              <Motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap gap-2 mb-4"
              >
                {search && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    <FontAwesomeIcon icon={faSearch} className="text-[11px]" /> "{search}"
                    <button onClick={() => setSearch("")} className="hover:text-primary-light">
                      <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                    </button>
                  </span>
                )}
                {category !== "All" && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
                    <FontAwesomeIcon icon={faFilter} className="text-[10px]" /> {category}
                    <button onClick={() => setCategory("All")} className="hover:text-primary-light">
                      <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                    </button>
                  </span>
                )}
              </Motion.div>
            )}
          </AnimatePresence>

          {/* Grid */}
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => <RestaurantSkeleton key={i} />)}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <EmptyState
              icon={faUtensils}
              title="No restaurants found"
              description="Try a different search or category filter."
              action={
                <Button
                  variant="outline"
                  onClick={() => { setSearch(""); setCategory("All"); }}
                >
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <>
              <Motion.div
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.06 } },
                }}
                className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
              >
                {displayedRestaurants.map((r) => (
                  <RestaurantCard
                    key={r.id}
                    restaurant={r}
                    isFavorite={favoriteRestaurantIds.includes(r.id)}
                    onToggleFavorite={handleFavoriteToggle}
                  />
                ))}
              </Motion.div>

              {displayedRestaurants.length < filteredRestaurants.length && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount((c) => c + 8)}
                  >
                    Load More
                  </Button>
                </div>
              )}
              <div ref={loadMoreRef} className="h-4" aria-hidden />
            </>
          )}
        </section>
      </section>
    </CustomerLayout>
  );
};

export default RestaurantsPage;
