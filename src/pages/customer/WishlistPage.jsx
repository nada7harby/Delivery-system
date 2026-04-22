import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useWishlistStore, useCartStore, useAppStore } from "@/store";
import { CustomerLayout } from "@/layouts";
import { Button, Card, EmptyState } from "@/components";

const WishlistItem = ({ item, onRemove, onAddToCart }) => {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.25 }}
    >
      <Card className="flex flex-col h-full group rounded-3xl border-white/60 bg-white/85 shadow-lg backdrop-blur-sm dark:border-[#284754] dark:bg-[#17303b]/80">
        <div className="relative -mx-5 -mt-5 h-48 rounded-t-3xl overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <button
            onClick={() => onRemove(item)}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 text-[#ff4f45] flex items-center justify-center"
            aria-label="Remove from wishlist"
          >
            <Heart size={16} className="fill-current" />
          </button>
        </div>

        <div className="pt-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-display font-bold text-[#0f2a35] dark:text-[#f2fbff]">
              {item.name}
            </h3>
            <span className="font-black text-[#f2552c]">
              ${item.price.toFixed(2)}
            </span>
          </div>

          <p className="text-sm text-[#5f7a88] dark:text-[#9bb5c2] line-clamp-2 mb-4">
            {item.description}
          </p>

          <div className="mt-auto grid grid-cols-2 gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onAddToCart(item)}
            >
              <span className="inline-flex items-center gap-1">
                Add <ShoppingCart size={14} />
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(item)}
              className="text-[#ff4f45] hover:text-[#f2552c]"
            >
              <span className="inline-flex items-center gap-1">
                Remove <Trash2 size={14} />
              </span>
            </Button>
          </div>
        </div>
      </Card>
    </Motion.div>
  );
};

const WishlistPage = () => {
  const { items, toggleWishlist, clearWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { addToast } = useAppStore();

  const handleAddToCart = (product) => {
    addItem(product);
    addToast({
      type: "success",
      title: "Added to cart",
      message: `${product.name} is now in your cart.`,
    });
  };

  const handleRemove = (product) => {
    toggleWishlist(product);
    addToast({
      type: "info",
      title: "Removed from wishlist",
      message: `${product.name} was removed from favorites.`,
    });
  };

  return (
    <CustomerLayout>
      <section className="max-w-6xl mx-auto px-4 py-8">
        <Motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] p-6 bg-gradient-to-r from-[#261531] via-[#3c1f4c] to-[#5b2a72] text-white shadow-2xl"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-white/70">
            Wishlist
          </p>
          <h1 className="font-display text-3xl font-black mt-2">
            Saved For Later
          </h1>
          <p className="text-sm text-white/80 mt-2">
            Keep your favorite meals here and add them to cart anytime.
          </p>
          <div className="mt-5 inline-flex px-3 py-1 rounded-xl bg-white/15 text-sm font-semibold">
            {items.length} saved item{items.length === 1 ? "" : "s"}
          </div>
        </Motion.div>

        <div className="mt-6">
          {items.length === 0 ? (
            <EmptyState
              icon="❤️"
              title="Your wishlist is empty"
              description="Save dishes you love and come back to them later."
              action={
                <Link to="/">
                  <Button variant="primary" size="lg">
                    Discover Restaurants
                  </Button>
                </Link>
              }
            />
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearWishlist}
                  className="text-[#7a93a0]"
                >
                  Clear all
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => (
                  <WishlistItem
                    key={item.id}
                    item={item}
                    onRemove={handleRemove}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </CustomerLayout>
  );
};

export default WishlistPage;
