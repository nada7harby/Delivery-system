import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
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
  <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#1a0a0a] animate-pulse">
    <div className="h-44 bg-gray-200 dark:bg-gray-800" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-full" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-5/6" />
      <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
    </div>
  </div>
);

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
    const timer = setTimeout(() => setIsLoading(false), 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setVisibleCount((count) => count + 4);
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMoreRef.current]);

  const filteredRestaurants = useMemo(() => {
    const list = restaurants
      .filter((restaurant) => {
        const matchesSearch =
          !search ||
          restaurant.name.toLowerCase().includes(search.toLowerCase()) ||
          restaurant.location.toLowerCase().includes(search.toLowerCase());
        const matchesCategory =
          category === "All" || restaurant.category === category;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        if (sortBy === "delivery") return a.deliveryTime - b.deliveryTime;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        return b.rating - a.rating;
      });

    return list;
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

  return (
    <CustomerLayout>
      <section className="max-w-7xl mx-auto px-4 py-8 lg:py-10">
        <div className="rounded-3xl p-6 lg:p-8 bg-gradient-to-br from-[#fff7e8] via-[#fbe5c1] to-[#f2d39f] dark:from-[#2e1010] dark:via-[#3a1515] dark:to-[#4a1919]">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9e7272] dark:text-[#c9a97a]">
            Marketplace
          </p>
          <h1 className="font-display text-3xl lg:text-5xl font-black text-[#1a0a0a] dark:text-white mt-2">
            Discover Restaurants Near You
          </h1>
          <p className="text-sm lg:text-base mt-3 text-[#6b4040] dark:text-[#e3c9b0] max-w-2xl">
            Browse local favorites, compare ratings and delivery time, and order
            from the restaurant you love.
          </p>

          <div className="mt-6 grid md:grid-cols-[1fr_auto_auto] gap-3">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search restaurant or area"
              className="input"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="input"
            >
              {RESTAURANT_CATEGORIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
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
        </div>

        {showRestaurantContext && (
          <Card className="mt-5 border-primary/20">
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
                  cartRestaurantId ? `/restaurant/${cartRestaurantId}` : "/cart"
                }
              >
                <Button variant="primary" size="sm">
                  Continue order
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {favoriteRestaurants.length > 0 && (
          <section className="mt-8">
            <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-3">
              Favorites ❤️
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {favoriteRestaurants.slice(0, 4).map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  isFavorite
                  onToggleFavorite={(restaurantId) => {
                    toggleFavoriteRestaurant(restaurantId);
                    addToast({ type: "info", title: "Removed from favorites" });
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {recentlyViewedRestaurants.length > 0 && (
          <section className="mt-8">
            <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-3">
              Recently Viewed
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentlyViewedRestaurants.slice(0, 4).map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  isFavorite={favoriteRestaurantIds.includes(restaurant.id)}
                  onToggleFavorite={(restaurantId) => {
                    const added = toggleFavoriteRestaurant(restaurantId);
                    addToast({
                      type: added ? "success" : "info",
                      title: added
                        ? "Added to favorites"
                        : "Removed from favorites",
                    });
                  }}
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-3">
            Top Rated
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
                  <span className="text-primary font-bold">
                    ⭐ {restaurant.rating}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-10">
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
                    onToggleFavorite={(restaurantId) => {
                      const added = toggleFavoriteRestaurant(restaurantId);
                      addToast({
                        type: added ? "success" : "info",
                        title: added
                          ? "Added to favorites"
                          : "Removed from favorites",
                      });
                    }}
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
        </section>
      </section>
    </CustomerLayout>
  );
};

export default RestaurantsPage;
