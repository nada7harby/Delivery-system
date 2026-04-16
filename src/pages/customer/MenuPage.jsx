import { useState, useMemo } from "react";
import { useCartStore, useAppStore, useWishlistStore } from "@/store";
import { MENU_ITEMS, CATEGORIES } from "@/constants";
import { CustomerLayout } from "@/layouts";
import { Button, Card, Badge, Modal, CustomSelect } from "@/components";
import clsx from "clsx";

const ProductCard = ({ product, onQuickView }) => {
  const { addItem, items } = useCartStore();
  const { addToast } = useAppStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  const cartItem = items.find((i) => i.id === product.id);
  const inCart = !!cartItem;
  const inWishlist = isInWishlist(product.id);

  const handleAdd = (e) => {
    e.stopPropagation();
    addItem(product);
    addToast({
      type: "success",
      title: `${product.name} added!`,
      message: "Item added to your cart 🛒",
    });
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    const added = toggleWishlist(product);
    addToast({
      type: added ? "success" : "info",
      title: added ? "Added to wishlist" : "Removed from wishlist",
      icon: added ? "❤️" : "🤍",
    });
  };

  return (
    <Card 
      hover 
      className="flex flex-col gap-4 group overflow-hidden cursor-pointer bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm border-gray-100 dark:border-gray-800"
      onClick={() => onQuickView(product)}
    >
      {/* Image area */}
      <div className="relative -mx-5 -mt-5 px-0 pt-0 bg-gray-50 dark:bg-gray-800/50 h-44 flex items-center justify-center rounded-t-xl overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500"; }}
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.popular && (
            <div className="bg-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              🔥 Popular
            </div>
          )}
        </div>

        {/* Wishlist button */}
        <button 
          onClick={handleWishlist}
          className={clsx(
            "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
            inWishlist 
              ? "bg-red-500 text-white scale-110" 
              : "bg-white/80 dark:bg-black/40 text-gray-400 dark:text-gray-300 hover:scale-110 hover:text-red-500"
          )}
        >
          {inWishlist ? "❤️" : "🤍"}
        </button>

        {/* Cart count badge */}
        {inCart && (
          <div className="absolute bottom-3 right-3 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white">
            {cartItem.quantity}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-[#1a0a0a] dark:text-[#fef9e1] leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <span className="text-primary font-bold text-lg flex-shrink-0">
            ${product.price.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-[#6b3030] dark:text-[#c9a97a] leading-relaxed line-clamp-2">
          {product.description}
        </p>
        <div className="flex items-center gap-3 text-xs text-gray-400 font-medium">
          <span className="flex items-center gap-1">⭐ <span className="text-[#1a0a0a] dark:text-[#fef9e1]">{product.rating}</span></span>
          <span>•</span>
          <span>{product.prepTime}</span>
        </div>
      </div>

      <Button variant="primary" size="sm" onClick={handleAdd} className="w-full shadow-md">
        {inCart ? "Add Another" : "Add to Cart"}
      </Button>
    </Card>
  );
};

const ProductDetailModal = ({ product, isOpen, onClose }) => {
  const { addItem, items, updateQuantity } = useCartStore();
  const { addToast } = useAppStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();

  if (!product) return null;

  const cartItem = items.find((i) => i.id === product.id);
  const quantity = cartItem?.quantity || 0;
  const inWishlist = isInWishlist(product.id);

  const handleAdd = () => {
    addItem(product);
    addToast({
      type: "success",
      title: "Success",
      message: `${product.name} added to cart!`,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={product.name} size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-gray-100 dark:bg-gray-900 rounded-2xl flex items-center justify-center overflow-hidden aspect-square relative shadow-inner">
           <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
           <button 
            onClick={() => toggleWishlist(product)}
            className={clsx(
              "absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-lg transition-all",
              inWishlist ? "bg-red-500 text-white" : "bg-white text-gray-400 hover:text-red-500"
            )}
           >
             {inWishlist ? "❤️" : "🤍"}
           </button>
        </div>
        <div className="flex flex-col py-2">
          <div className="flex justify-between items-center mb-4">
            <Badge status="info" className="text-sm">{product.category}</Badge>
            <div className="flex items-center gap-1 text-amber-500 font-bold">⭐ {product.rating}</div>
          </div>
          <h2 className="text-3xl font-black text-[#1a0a0a] dark:text-[#fef9e1] mb-4">{product.name}</h2>
          <p className="text-2xl font-bold text-primary mb-6">${product.price.toFixed(2)}</p>
          <p className="text-[#6b4040] dark:text-[#c9a97a] mb-8 leading-relaxed">{product.description}</p>
          <div className="mt-auto flex items-center gap-4">
            {quantity > 0 ? (
              <div className="flex items-center gap-4 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
                <button onClick={() => updateQuantity(product.id, quantity - 1)} className="w-10 h-10 flex items-center justify-center font-bold">−</button>
                <span className="w-8 text-center font-black">{quantity}</span>
                <button onClick={() => updateQuantity(product.id, quantity + 1)} className="w-10 h-10 bg-primary text-white flex items-center justify-center font-bold relative rounded-lg">+</button>
              </div>
            ) : (
              <Button variant="primary" size="lg" className="flex-1" onClick={handleAdd}>Add to Cart 🛒</Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

const MenuPage = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("popular");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const filteredAndSorted = useMemo(() => {
    let result = MENU_ITEMS.filter((item) => {
      const matchCat = activeCategory === "All" || item.category === activeCategory;
      const matchSearch = !search || 
        item.name.toLowerCase().includes(search.toLowerCase()) || 
        item.category.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
    switch (sortBy) {
      case "price-low": result.sort((a, b) => a.price - b.price); break;
      case "price-high": result.sort((a, b) => b.price - a.price); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      default: result.sort((a, b) => (b.popular ? 1 : 0) - (a.popular ? 1 : 0));
    }
    return result;
  }, [activeCategory, search, sortBy]);

  return (
    <CustomerLayout>
      {/* CREATIVE Hero Section with Take Away-cuate.png */}
      <section className="relative  bg-[#fafafa] dark:bg-[#0f0a0a] min-h-[580px] flex items-center">
        {/* Animated Blobs */}
        <div className="absolute top-20 right-[10%] w-[500px] h-[500px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute -bottom-20 -left-10 w-[400px] h-[400px] bg-amber-200/20 dark:bg-amber-500/10 rounded-full blur-[80px]" />
        
        <div className="max-w-7xl mx-auto px-6 lg:px-12 w-full grid lg:grid-cols-2 gap-8 items-center relative z-10">
          {/* Left: Text Content */}
          <div className="order-2 lg:order-1 pt-10 lg:pt-0">
            <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary font-black rounded-full text-[10px] tracking-[0.2em] uppercase mb-6 animate-bounce-slow">
              Craving something? 🍔
            </div>
            <h1 className="text-6xl lg:text-7xl xl:text-8xl font-black text-[#1a0a0a] dark:text-white leading-[0.9] mb-8 tracking-tighter">
              Fast <span className="text-primary italic">Flavor</span> <br />
              Right Away.
            </h1>
            <p className="text-[#6b4040] dark:text-gray-400 text-lg mb-12 max-w-md leading-relaxed">
              Order your favorite meals from top-rated restaurants and experience the fastest delivery service in town.
            </p>
            
            {/* Search Box - Premium Box Shadow style */}
            <div className="relative max-w-xl group">
              <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-amber-500/20 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-700"></div>
              <div className="relative flex items-center bg-white dark:bg-gray-900 rounded-[2rem] p-2 shadow-[0_20px_50px_rgba(0,0,0,0.06)] dark:shadow-none border border-gray-100 dark:border-gray-800">
                <div className="flex-1 flex items-center px-6">
                  <span className="text-2xl mr-4">🥡</span>
                  <input
                    type="text"
                    placeholder="Search for pizza, coffee, salads..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent border-none focus:ring-0 text-gray-800 dark:text-white placeholder-gray-400 font-bold py-4 text-lg"
                  />
                </div>
                <button className="bg-primary hover:bg-primary-dark text-white font-black px-10 py-5 rounded-[1.5rem] transition-all transform active:scale-95 shadow-xl">
                  GO
                </button>
              </div>
            </div>

            {/* Bottom mini stats */}
            <div className="mt-12 flex gap-10">
               <div>
                  <p className="text-2xl font-black text-[#1a0a0a] dark:text-white">50k+</p>
                  <p className="text-[10px] font-bold text-[#9e7272] uppercase tracking-widest mt-1">Daily Orders</p>
               </div>
               <div className="w-px h-10 bg-gray-200 dark:bg-gray-800 self-center" />
               <div>
                  <p className="text-2xl font-black text-[#1a0a0a] dark:text-white">4.9/5</p>
                  <p className="text-[10px] font-bold text-[#9e7272] uppercase tracking-widest mt-1">App Rating</p>
               </div>
            </div>
          </div>

          {/* Right: Illustration */}
          <div className="order-1 lg:order-2 relative flex items-center justify-center">
             <div className="relative w-full max-w-[600px] animate-float">
                {/* Background Shapes */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-white dark:bg-white/5 rounded-full shadow-2xl skew-x-3 -rotate-3 border border-gray-50 dark:border-transparent opacity-50 lg:opacity-100" />
                
                {/* Main Illustration */}
                <img 
                  src="/src/assets/Take Away-cuate.png" 
                  alt="Take Away Illustration" 
                  className="relative z-10 w-full h-auto drop-shadow-2xl"
                />

                {/* Floating Micro-UI elements */}
                <div className="absolute top-10 right-0 bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 animate-bounce-slow z-20">
                   <div className="flex items-center gap-2">
                       <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-black">✔</div>
                       <div className="text-[10px] font-black uppercase text-gray-500">Order Confirmed</div>
                   </div>
                </div>

                <div className="absolute bottom-20 -left-10 bg-primary text-white p-4 rounded-3xl shadow-2xl animate-float delay-1000 z-20">
                   <div className="flex items-center gap-2">
                       <span className="text-2xl">🔥</span>
                       <div>
                          <p className="text-[8px] font-black uppercase leading-none opacity-80">Flash Deal</p>
                          <p className="text-xs font-black">50% OFF</p>
                       </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Categories & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-16 px-2">
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide items-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={clsx(
                  "flex-shrink-0 px-8 py-4 rounded-[1.5rem] text-sm font-black transition-all duration-300 border-2",
                  activeCategory === cat
                    ? "bg-primary text-white border-primary shadow-2xl shadow-primary/20 scale-105"
                    : "bg-white dark:bg-gray-900 text-[#1a0a0a] dark:text-[#c9a97a] border-gray-100 dark:border-gray-800 hover:border-primary/50"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
             <span className="text-[10px] font-black text-[#9e7272] uppercase tracking-[0.2em] hidden sm:block">Sort Results</span>
             <CustomSelect
               value={sortBy}
               onChange={setSortBy}
               icon="🔃"
               className="w-52"
               options={[
                 { value: "popular", label: "Most Popular", icon: "🔥" },
                 { value: "rating", label: "Highest Rated", icon: "⭐" },
                 { value: "price-low", label: "Budget Friendly", icon: "📈" },
                 { value: "price-high", label: "Premium Selection", icon: "💎" },
               ]}
             />
          </div>
        </div>

        {/* Results Body */}
        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-32 bg-gray-50 dark:bg-gray-900/40 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
            <div className="text-8xl mb-8">🛰️</div>
            <h3 className="text-3xl font-black text-[#1a0a0a] dark:text-white mb-4">Nothing on the radar</h3>
            <p className="text-[#6b4040] dark:text-gray-400 max-w-md mx-auto mb-10 text-lg">We couldn't find any dishes matching your parameters. Try broadening your search.</p>
            <Button variant="outline" onClick={() => { setSearch(""); setActiveCategory("All"); }} className="px-10 py-4 text-sm font-black border-2">Reset ALL Filters</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredAndSorted.map((item) => (
              <ProductCard key={item.id} product={item} onQuickView={setSelectedProduct} />
            ))}
          </div>
        )}
      </div>

      <ProductDetailModal product={selectedProduct} isOpen={!!selectedProduct} onClose={() => setSelectedProduct(null)} />
    </CustomerLayout>
  );
};

export default MenuPage;
