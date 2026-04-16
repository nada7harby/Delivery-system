import { useWishlistStore, useCartStore, useAppStore } from "@/store";
import { CustomerLayout } from "@/layouts";
import { Button, Card, EmptyState } from "@/components";
import { Link } from "react-router-dom";

const WishlistItem = ({ items }) => {
  const { toggleWishlist } = useWishlistStore();
  const { addItem } = useCartStore();
  const { addToast } = useAppStore();

  const handleAddToCart = (product) => {
    addItem(product);
    addToast({
      type: "success",
      title: "Added to cart!",
      message: `${product.name} is ready for checkout 🛒`,
    });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <Card key={item.id} hover className="flex flex-col h-full group">
          <div className="relative -mx-5 -mt-5 h-44 bg-gray-100 dark:bg-gray-900 flex items-center justify-center rounded-t-xl group-hover:scale-105 transition-transform duration-500 overflow-hidden">
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
            <button 
              onClick={() => toggleWishlist(item)}
              className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg"
            >
              ❤️
            </button>
          </div>
          <div className="flex flex-col flex-1 py-4">
             <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">{item.name}</h3>
                <span className="text-primary font-bold">${item.price.toFixed(2)}</span>
             </div>
             <p className="text-xs text-[#6b4040] dark:text-[#c9a97a] line-clamp-2 mb-4 italic truncate">
               {item.description}
             </p>
             <div className="mt-auto flex flex-col gap-2">
                <Button variant="primary" size="sm" onClick={() => handleAddToCart(item)} className="w-full">
                  Add to Cart 🛒
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleWishlist(item)} className="w-full text-red-500 hover:text-red-600">
                   Remove
                </Button>
             </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const WishlistPage = () => {
  const { items, clearWishlist } = useWishlistStore();

  return (
    <CustomerLayout>
      <div className="max-w-6xl mx-auto py-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-black text-[#1a0a0a] dark:text-[#f8f8f8]">My Saved Items ❤️</h1>
            <p className="text-sm text-[#6b4040] dark:text-[#c9a97a] mt-1">Your personal collection of favorites</p>
          </div>
          {items.length > 0 && (
             <Button variant="ghost" size="sm" onClick={clearWishlist} className="text-[#9e7272]">
                Clear All
             </Button>
          )}
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon="❤️"
            title="Your wishlist is empty"
            description="Save your favorite dishes here to order them later quickly!"
            action={
              <Link to="/">
                <Button variant="primary" size="lg" icon="🍔">
                  Explore Menu
                </Button>
              </Link>
            }
          />
        ) : (
          <WishlistItem items={items} />
        )}
      </div>
    </CustomerLayout>
  );
};

export default WishlistPage;
