import { useEffect, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useMarketplaceStore, useCartStore, useAppStore } from "@/store";
import { CustomerLayout } from "@/layouts";
import {
  Badge,
  Button,
  CartSidebar,
  CategoryTabs,
  EmptyState,
  MenuItemCard,
  Modal,
} from "@/components";

const RestaurantDetailsPage = () => {
  const { id } = useParams();
  const {
    getRestaurantById,
    getProductsByRestaurant,
    setSelectedRestaurant,
    favoriteRestaurantIds,
    toggleFavoriteRestaurant,
  } = useMarketplaceStore();
  const {
    items,
    restaurantId,
    addItem,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount,
  } = useCartStore();
  const { addToast } = useAppStore();

  const [activeCategory, setActiveCategory] = useState("All");
  const [pendingItem, setPendingItem] = useState(null);

  const restaurant = getRestaurantById(id);
  const menuItems = getProductsByRestaurant(id);

  useEffect(() => {
    if (restaurant?.id) {
      setSelectedRestaurant(restaurant.id);
    }
  }, [restaurant?.id]);

  if (!restaurant) {
    return <Navigate to="/" replace />;
  }

  const categories = [
    "All",
    ...new Set(menuItems.map((item) => item.category)),
  ];

  const displayedItems = menuItems.filter(
    (item) => activeCategory === "All" || item.category === activeCategory,
  );

  const groupedItems = displayedItems.reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
    return groups;
  }, {});

  const cartItemsForRestaurant =
    restaurantId === restaurant.id
      ? items.filter((item) => item.restaurantId === restaurant.id)
      : [];

  const handleAddItem = (item) => {
    if (!restaurant.isOpen) {
      addToast({ type: "warning", title: "Restaurant is closed" });
      return;
    }

    const result = addItem(item);
    if (result?.conflict) {
      setPendingItem(item);
      return;
    }

    addToast({ type: "success", title: `${item.name} added to cart` });
  };

  const forceAddPendingItem = () => {
    if (!pendingItem) return;
    clearCart();
    const result = addItem(pendingItem);
    if (result?.success) {
      addToast({
        type: "success",
        title: "Cart updated",
        message: `${pendingItem.name} added`,
      });
    }
    setPendingItem(null);
  };

  const itemQuantityMap = new Map(
    cartItemsForRestaurant.map((item) => [item.id, item.quantity]),
  );

  return (
    <CustomerLayout>
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="relative rounded-3xl overflow-hidden mb-6">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-64 lg:h-80 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="absolute left-5 right-5 bottom-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-white/80 text-xs uppercase tracking-widest">
                  {restaurant.category}
                </p>
                <h1 className="text-white font-display text-3xl lg:text-4xl font-black mt-1">
                  {restaurant.name}
                </h1>
                <p className="text-white/90 text-sm mt-2 max-w-2xl">
                  {restaurant.description}
                </p>
                <p className="text-white/90 text-xs mt-2">
                  ⭐ {restaurant.rating} • {restaurant.deliveryTime} min •{" "}
                  {restaurant.location}
                </p>
              </div>
              <button
                onClick={() => toggleFavoriteRestaurant(restaurant.id)}
                className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center"
              >
                {favoriteRestaurantIds.includes(restaurant.id) ? "❤️" : "🤍"}
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {!restaurant.isOpen && <Badge status="cancelled" />}
          {restaurant.promotion && (
            <Badge
              label={restaurant.promotion}
              className="bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300"
            />
          )}
          {restaurantId &&
            restaurantId !== restaurant.id &&
            getItemCount() > 0 && (
              <div className="text-xs px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                Your cart currently has items from another restaurant.
              </div>
            )}
        </div>

        <CategoryTabs
          categories={categories}
          activeCategory={activeCategory}
          onChange={setActiveCategory}
        />

        <div className="mt-6 grid lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div>
            {menuItems.length === 0 ? (
              <EmptyState
                icon="📭"
                title="No menu items"
                description="This restaurant has not published items yet"
              />
            ) : (
              <div className="space-y-7">
                {Object.entries(groupedItems).map(([group, itemsList]) => (
                  <section key={group}>
                    <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-3">
                      {group}
                    </h2>
                    <div className="space-y-3">
                      {itemsList.map((item) => {
                        const quantity = itemQuantityMap.get(item.id) || 0;
                        return (
                          <MenuItemCard
                            key={item.id}
                            item={item}
                            quantity={quantity}
                            onAdd={() => handleAddItem(item)}
                            onIncrement={() => handleAddItem(item)}
                            onDecrement={() =>
                              updateQuantity(item.id, Math.max(0, quantity - 1))
                            }
                          />
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block">
            <CartSidebar
              items={cartItemsForRestaurant}
              restaurant={restaurant}
              subtotal={restaurantId === restaurant.id ? getTotal() : 0}
              itemCount={restaurantId === restaurant.id ? getItemCount() : 0}
              onIncrement={(itemId, quantity) =>
                updateQuantity(itemId, quantity + 1)
              }
              onDecrement={(itemId, quantity) =>
                updateQuantity(itemId, Math.max(0, quantity - 1))
              }
              onClear={clearCart}
            />
          </div>
        </div>

        {restaurantId === restaurant.id && getItemCount() > 0 && (
          <div className="lg:hidden fixed bottom-4 left-4 right-4 z-30">
            <Link
              to="/cart"
              className="block rounded-2xl bg-primary text-white px-4 py-3 shadow-2xl"
            >
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>{getItemCount()} item(s)</span>
                <span>View Cart • ${getTotal().toFixed(2)}</span>
              </div>
            </Link>
          </div>
        )}
      </section>

      <Modal
        isOpen={Boolean(pendingItem)}
        onClose={() => setPendingItem(null)}
        title="Clear current cart?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPendingItem(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={forceAddPendingItem}>
              Clear Cart
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
          You already have items from another restaurant. Clear cart and add{" "}
          {pendingItem?.name}?
        </p>
      </Modal>
    </CustomerLayout>
  );
};

export default RestaurantDetailsPage;
