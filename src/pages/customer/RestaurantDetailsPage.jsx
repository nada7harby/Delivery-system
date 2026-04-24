import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion as Motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faClock,
  faHeart,
  faMapMarkerAlt,
  faShoppingBag,
  faStar,
  faExclamationTriangle,
  faBolt,
  faTrophy,
  faInbox,
  faSearch,
  faShoppingCart,
  faPlus,
} from "@/utils/icons";
import { faHeart as faHeartRegular } from "@fortawesome/free-regular-svg-icons";
import { useMarketplaceStore, useCartStore, useAppStore } from "@/store";
import { CustomerLayout } from "@/layouts";
import { Button, CartSidebar, EmptyState, MenuItemCard, Modal } from "@/components";
import clsx from "clsx";

/* ─── Sticky category tabs ───────────────────────────── */
const StickyTabs = ({ categories, activeCategory, onChange }) => (
  <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
    {categories.map((cat) => (
      <Motion.button
        key={cat}
        whileTap={{ scale: 0.93 }}
        onClick={() => onChange(cat)}
        className={clsx(
          "flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-all duration-250",
          activeCategory === cat
            ? "bg-primary text-white shadow-md"
            : "bg-white/80 dark:bg-[#1a0a0a]/80 text-[#6b4040] dark:text-[#c9a97a] border border-[#E5D0AC] dark:border-[#3d1a1a] hover:border-primary/50",
        )}
      >
        {cat}
      </Motion.button>
    ))}
  </div>
);

/* ─── Main ───────────────────────────────────────────── */
const RestaurantDetailsPage = () => {
  const { id } = useParams();
  const {
    getRestaurantById,
    getProductsByRestaurant,
    setSelectedRestaurant,
    favoriteRestaurantIds,
    toggleFavoriteRestaurant,
  } = useMarketplaceStore();
  const { items, restaurantId, addItem, updateQuantity, clearCart, getTotal, getItemCount } = useCartStore();
  const { addToast } = useAppStore();

  const [activeCategory, setActiveCategory] = useState("All");
  const [pendingItem, setPendingItem] = useState(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(false);

  const heroRef = useRef(null);
  const tabsRef = useRef(null);

  const restaurant = getRestaurantById(id);
  const menuItems = getProductsByRestaurant(id);
  const isFavorite = favoriteRestaurantIds.includes(id);
  const isOpen = restaurant?.isActive ?? restaurant?.isOpen ?? true;

  useEffect(() => {
    if (restaurant?.id) setSelectedRestaurant(restaurant.id);
  }, [restaurant?.id, setSelectedRestaurant]);

  /* Sticky header on scroll */
  useEffect(() => {
    const handleScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect()?.bottom ?? 0;
      setIsHeaderVisible(heroBottom < 64);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!restaurant) return <Navigate to="/" replace />;

  const categories = ["All", ...new Set(menuItems.map((i) => i.category))];

  const displayedItems = menuItems.filter(
    (item) => activeCategory === "All" || item.category === activeCategory,
  );

  const groupedItems = displayedItems.reduce((acc, item) => {
    const key = item.category || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const cartItemsForRestaurant =
    restaurantId === restaurant.id
      ? items.filter((i) => i.restaurantId === restaurant.id)
      : [];

  const itemQuantityMap = new Map(cartItemsForRestaurant.map((i) => [i.id, i.quantity]));

  const handleAddItem = (item) => {
    if (!isOpen) {
      addToast({ type: "warning", title: "Restaurant is closed" });
      return;
    }
    const result = addItem(item);
    if (result?.conflict) { setPendingItem(item); return; }
    addToast({ type: "success", title: `${item.name} added to cart` });
  };

  const forceAddPendingItem = () => {
    if (!pendingItem) return;
    clearCart();
    addItem(pendingItem);
    addToast({ type: "success", title: "Cart updated", message: `${pendingItem.name} added` });
    setPendingItem(null);
  };

  return (
    <CustomerLayout>
      {/* ── Sticky mini-header on scroll ── */}
      <AnimatePresence>
        {isHeaderVisible && (
          <Motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#1a0a0a]/95 backdrop-blur-lg border-b border-[#E5D0AC] dark:border-[#3d1a1a] shadow-lg px-4 py-3"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Link to="/" className="text-[#6b4040] hover:text-primary transition-colors">
                  <FontAwesomeIcon icon={faArrowLeft} />
                </Link>
                {restaurant.image && (
                  <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
                    <img src={restaurant.image} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div>
                  <p className="font-bold text-[#1a0a0a] dark:text-white text-sm">{restaurant.name}</p>
                  <p className="text-xs text-[#9e7272]">{restaurant.category}</p>
                </div>
              </div>
              {restaurantId === restaurant.id && getItemCount() > 0 && (
                <Link to="/cart">
                  <Button variant="primary" size="sm" icon={<FontAwesomeIcon icon={faShoppingBag} className="text-[10px]" />}>
                    {getItemCount()} items · ${getTotal().toFixed(2)}
                  </Button>
                </Link>
              )}
            </div>
          </Motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 pt-4 pb-20">
        {/* ── Hero ── */}
        <Motion.div
          ref={heroRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative rounded-3xl overflow-hidden mb-6"
        >
          <div className="relative h-64 lg:h-96 overflow-hidden">
            <img
              src={restaurant.image}
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* Closed overlay */}
            {!isOpen && (
              <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center">
                <div className="bg-white/95 rounded-2xl px-6 py-3 text-center shadow-2xl">
                  <p className="font-black text-[#1a0a0a] text-xl">Currently Closed</p>
                  <p className="text-[#6b4040] text-sm mt-1">Check back later</p>
                </div>
              </div>
            )}

            {/* Top nav */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <Link
                to="/"
                className="w-10 h-10 bg-white/90 dark:bg-black/60 backdrop-blur-sm rounded-xl flex items-center justify-center text-[#1a0a0a] hover:bg-white transition-colors shadow-lg"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
              </Link>
              <Motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => {
                  const added = toggleFavoriteRestaurant(restaurant.id);
                  addToast({ type: added ? "success" : "info", title: added ? "Added to favorites" : "Removed" });
                }}
                className={clsx(
                  "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg backdrop-blur-sm transition-all duration-300",
                  isFavorite ? "bg-red-500 text-white" : "bg-white/90 dark:bg-black/60 text-[#1a0a0a]",
                )}
              >
                <FontAwesomeIcon icon={isFavorite ? faHeart : faHeartRegular} className={isFavorite ? "fill-current" : ""} />
              </Motion.button>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-5">
              <p className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-1">
                {restaurant.category}
              </p>
              <h1 className="text-white font-display text-3xl lg:text-5xl font-black leading-tight mb-2">
                {restaurant.name}
              </h1>
              <p className="text-white/80 text-sm max-w-xl line-clamp-2 mb-3">
                {restaurant.description}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-semibold">
                  <FontAwesomeIcon icon={faStar} className="text-[10px] text-amber-400" />
                  {restaurant.rating}
                </div>
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-semibold">
                  <FontAwesomeIcon icon={faBolt} className="text-xs" />
                  {restaurant.deliveryTime} min
                </div>
                <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-semibold">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />
                  {restaurant.location}
                </div>
                {restaurant.promotion && (
                  <div className="bg-primary/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-bold">
                    <FontAwesomeIcon icon={faTrophy} className="mr-2" /> {restaurant.promotion}
                  </div>
                )}
              </div>
            </div>
          </div>
        </Motion.div>

        {/* ── Cart conflict warning ── */}
        <AnimatePresence>
          {restaurantId && restaurantId !== restaurant.id && getItemCount() > 0 && (
            <Motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-300 text-sm"
            >
              <FontAwesomeIcon icon={faExclamationTriangle} className="text-xs" />
              Your cart has items from another restaurant. Adding items here will clear it.
            </Motion.div>
          )}
        </AnimatePresence>

        {/* ── Category tabs (sticky) ── */}
        <div
          ref={tabsRef}
          className="sticky top-16 z-30 py-3 -mx-4 px-4 bg-[#fff8ef]/90 dark:bg-[#0d1b23]/90 backdrop-blur-xl border-b border-[#E5D0AC]/40 dark:border-[#3d1a1a]/40 mb-6"
        >
          <StickyTabs categories={categories} activeCategory={activeCategory} onChange={setActiveCategory} />
        </div>

        {/* ── Menu + Cart layout ── */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
          {/* Menu */}
          <div>
            {menuItems.length === 0 ? (
              <EmptyState icon={faInbox} title="No menu items" description="This restaurant hasn't published items yet." />
            ) : Object.keys(groupedItems).length === 0 ? (
              <EmptyState icon={faSearch} title="No items in this category" description="Try a different category tab." />
            ) : (
              <Motion.div
                key={activeCategory}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {Object.entries(groupedItems).map(([group, groupItems], gIdx) => (
                  <section key={group}>
                    <Motion.h2
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: gIdx * 0.05 }}
                      className="font-display font-bold text-lg text-[#1a0a0a] dark:text-white mb-3 flex items-center gap-2"
                    >
                      {group}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {groupItems.length}
                      </span>
                    </Motion.h2>
                    <div className="space-y-3">
                      {groupItems.map((item, iIdx) => {
                        const quantity = itemQuantityMap.get(item.id) || 0;
                        return (
                          <Motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: gIdx * 0.04 + iIdx * 0.04 }}
                          >
                            <MenuItemCard
                              item={item}
                              quantity={quantity}
                              onAdd={() => handleAddItem(item)}
                              onIncrement={() => handleAddItem(item)}
                              onDecrement={() => updateQuantity(item.id, Math.max(0, quantity - 1))}
                            />
                          </Motion.div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </Motion.div>
            )}
          </div>

          {/* Cart sidebar (desktop) */}
          <div className="hidden lg:block">
            <CartSidebar
              items={cartItemsForRestaurant}
              restaurant={restaurant}
              subtotal={restaurantId === restaurant.id ? getTotal() : 0}
              itemCount={restaurantId === restaurant.id ? getItemCount() : 0}
              onIncrement={(id, qty) => updateQuantity(id, qty + 1)}
              onDecrement={(id, qty) => updateQuantity(id, Math.max(0, qty - 1))}
              onClear={clearCart}
            />
          </div>
        </div>
      </div>

      {/* ── Mobile sticky cart button ── */}
      <AnimatePresence>
        {restaurantId === restaurant.id && getItemCount() > 0 && (
          <Motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="lg:hidden fixed bottom-4 left-4 right-4 z-40"
          >
            <Link
              to="/cart"
              className="flex items-center justify-between w-full px-5 py-4 bg-primary text-white rounded-2xl shadow-2xl font-bold text-sm"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center font-black">
                  {getItemCount()}
                </span>
                <span>View Cart</span>
              </div>
              <span className="font-black text-base">${getTotal().toFixed(2)}</span>
            </Link>
          </Motion.div>
        )}
      </AnimatePresence>

      {/* ── Cart conflict modal ── */}
      <Modal
        isOpen={Boolean(pendingItem)}
        onClose={() => setPendingItem(null)}
        title="Start a new cart?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingItem(null)}>Keep Current Cart</Button>
            <Button variant="danger" onClick={forceAddPendingItem}>Clear & Add Item</Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center gap-3 py-2">
          <div className="text-5xl text-primary/30"><FontAwesomeIcon icon={faShoppingCart} /></div>
          <p className="text-[#6b4040] dark:text-[#c9a97a] text-sm">
            You already have items from another restaurant. Adding{" "}
            <span className="font-bold text-[#1a0a0a] dark:text-white">{pendingItem?.name}</span>{" "}
            will clear your current cart.
          </p>
        </div>
      </Modal>
    </CustomerLayout>
  );
};

export default RestaurantDetailsPage;
