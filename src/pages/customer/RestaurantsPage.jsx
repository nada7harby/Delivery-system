import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Compass, Filter, Search, Sparkles, Star } from "lucide-react";
import { useMarketplaceStore, useCartStore, useAppStore } from "@/store";
import { CustomerLayout } from "@/layouts";
import {
  Card,
  EmptyState,
  RestaurantCard,
  CustomSelect,
  Button,
} from "@/components";
import { RESTAURANT_CATEGORIES } from "@/constants";

const RestaurantSkeleton = () => (
  <div className="rounded-3xl overflow-hidden border border-[#E5D0AC]/70 dark:border-[#3d1a1a] bg-white dark:bg-[#1a0a0a] animate-pulse">
    <div className="h-44 bg-gray-200 dark:bg-gray-800" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
    </div>
  </div>
);

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.35 },
};

const RestaurantsPage = () => {
  const {
    restaurants,
    favoriteRestaurantIds,
    toggleFavoriteRestaurant,
    getRecentlyViewedRestaurants,
    getTopRatedRestaurants,
  } = useMarketplaceStore();
  const { restaurantId: cartRestaurantId, getItemCount } = useCartStore();
  const { addToast } = useAppStore();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("rating");
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoading, setIsLoading] = useState(true);

  const loadMoreRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        setVisibleCount((count) => count + 4);
      },
      { threshold: 0.15 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const filteredRestaurants = useMemo(() => {
    return restaurants
      .filter((restaurant) => {
        const normalizedSearch = search.toLowerCase();
        const matchesSearch =
          !search ||
          restaurant.name.toLowerCase().includes(normalizedSearch) ||
          (restaurant.location || "").toLowerCase().includes(normalizedSearch);

        const matchesCategory =
          category === "All" || restaurant.category === category;

        const isVisible = restaurant.isActive ?? true;
        return matchesSearch && matchesCategory && isVisible;
      })
      .sort((a, b) => {
        if (sortBy === "delivery") return a.deliveryTime - b.deliveryTime;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return b.rating - a.rating;
      });
  }, [restaurants, search, category, sortBy]);

  const displayedRestaurants = filteredRestaurants.slice(0, visibleCount);
  const favoriteRestaurants = restaurants.filter((restaurant) =>
    favoriteRestaurantIds.includes(restaurant.id),
  );
  const recentlyViewedRestaurants = getRecentlyViewedRestaurants();
  const topRatedRestaurants = getTopRatedRestaurants(3);

  const showRestaurantContext = cartRestaurantId && getItemCount() > 0;
  const cartRestaurant = restaurants.find(
    (restaurant) => restaurant.id === cartRestaurantId,
  );

  const handleFavoriteToggle = (restaurantId) => {
    const added = toggleFavoriteRestaurant(restaurantId);
    addToast({
      type: added ? "success" : "info",
      title: added ? "Added to favorites" : "Removed from favorites",
    });
  };

  return (
    <CustomerLayout>
      <section className="max-w-7xl mx-auto px-4 py-8 lg:py-10 space-y-8">
        <Motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-[2rem] p-6 lg:p-8 bg-gradient-to-br from-[#fff9ea] via-[#ffe6bb] to-[#f6c786] dark:from-[#2a1010] dark:via-[#3a1515] dark:to-[#4a1919]"
        >
          <div className="absolute -top-20 -right-12 h-56 w-56 rounded-full bg-white/30 blur-2xl" />
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#9e7272] dark:text-[#c9a97a]">
            <Sparkles size={14} /> Marketplace
          </p>
          <h1 className="font-display text-3xl lg:text-5xl font-black text-[#1a0a0a] dark:text-white mt-2">
            Your Next Meal, Curated
          </h1>
          <p className="text-sm lg:text-base mt-3 text-[#6b4040] dark:text-[#e3c9b0] max-w-2xl">
            Compare delivery time, discover local gems, and place your order in
            a few taps.
          </p>

          <div className="mt-6 grid md:grid-cols-[1fr_auto_auto] gap-3">
            <label className="input flex items-center gap-2">
              <Search size={16} className="text-[#9e7272]" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search restaurant or area"
                className="w-full bg-transparent outline-none"
              />
            </label>
            <label className="input flex items-center gap-2">
              <Filter size={15} className="text-[#9e7272]" />
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="w-full bg-transparent outline-none"
              >
                {RESTAURANT_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <CustomSelect
              value={sortBy}
              onChange={setSortBy}
              className="w-full md:w-52"
              options={[
                { value: "rating", label: "Top Rated", icon: "⭐" },
                { value: "delivery", label: "Fast Delivery", icon: "⚡" },
                { value: "name", label: "Name A-Z", icon: "🔤" },
              ]}
            />
          </div>
        </Motion.div>

        {showRestaurantContext && (
          <Motion.div {...fadeInUp}>
            <Card className="border-primary/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[#9e7272]">
                    Cart Active
                  </p>
                  <p className="font-semibold text-[#1a0a0a] dark:text-[#f8f8f8]">
                    You have {getItemCount()} item(s) from{" "}
                    {cartRestaurant?.name || "another restaurant"}
                  </p>
                </div>
                <Link
                  to={
                    cartRestaurantId
                      ? `/restaurant/${cartRestaurantId}`
                      : "/cart"
                  }
                >
                  <Button variant="primary" size="sm">
                    Continue order
                  </Button>
                </Link>
              </div>
            </Card>
          </Motion.div>
        )}

        {favoriteRestaurants.length > 0 && (
          <Motion.section {...fadeInUp}>
            <h2 className="inline-flex items-center gap-2 font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-3">
              <Compass size={16} /> Favorites
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {favoriteRestaurants.slice(0, 4).map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  isFavorite
                  onToggleFavorite={handleFavoriteToggle}
                />
              ))}
            </div>
          </Motion.section>
        )}

        {recentlyViewedRestaurants.length > 0 && (
          <Motion.section {...fadeInUp}>
            <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-3">
              Recently Viewed
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentlyViewedRestaurants.slice(0, 4).map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  isFavorite={favoriteRestaurantIds.includes(restaurant.id)}
                  onToggleFavorite={handleFavoriteToggle}
                />
              ))}
            </div>
          </Motion.section>
        )}

        <Motion.section {...fadeInUp}>
          <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-3">
            Top Rated Picks
          </h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {topRatedRestaurants.map((restaurant) => (
              <Card key={restaurant.id} className="border-primary/20">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#1a0a0a] dark:text-[#f8f8f8]">
                      {restaurant.name}
                    </p>
                    <p className="text-xs text-[#6b4040] dark:text-[#c9a97a]">
                      {restaurant.category}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-primary font-bold">
                    <Star size={14} className="fill-current" />{" "}
                    {restaurant.rating}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </Motion.section>

        <Motion.section {...fadeInUp}>
          <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-4">
            All Restaurants
          </h2>

          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <RestaurantSkeleton key={index} />
              ))}
            </div>
          ) : filteredRestaurants.length === 0 ? (
            <EmptyState
              icon="🍽️"
              title="No restaurants found"
              description="Try another search or category filter"
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSearch("");
                    setCategory("All");
                  }}
                >
                  Clear Filters
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayedRestaurants.map((restaurant) => (
                  <RestaurantCard
                    key={restaurant.id}
                    restaurant={restaurant}
                    isFavorite={favoriteRestaurantIds.includes(restaurant.id)}
                    onToggleFavorite={handleFavoriteToggle}
                  />
                ))}
              </div>
              {displayedRestaurants.length < filteredRestaurants.length && (
                <div className="mt-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setVisibleCount((count) => count + 6)}
                  >
                    Load More
                  </Button>
                </div>
              )}
              <div ref={loadMoreRef} className="h-4" aria-hidden />
            </>
          )}
        </Motion.section>
      </section>
    </CustomerLayout>
  );
};

export default RestaurantsPage;
