import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  useAuthStore,
  useCartStore,
  useAppStore,
  useTrackingStore,
  useWishlistStore,
} from "@/store";
import { motion as Motion } from "framer-motion";
import clsx from "clsx";
import {
  Bell,
  Heart,
  House,
  LogOut,
  MapPinned,
  Moon,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Sun,
} from "lucide-react";

const CustomerNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  const { isDarkMode, toggleDarkMode } = useAppStore();
  const { unreadCount } = useTrackingStore();
  const { items: wishlistItems } = useWishlistStore();

  const cartCount = getItemCount();

  const navLinks = [
    { to: "/", label: "Restaurants", icon: House },
    { to: "/menu", label: "Browse Menu", icon: ShoppingBag },
    { to: "/orders", label: "My Orders", icon: Package },
    { to: "/profile", label: "Profile", icon: Settings },
    {
      to: "/wishlist",
      label: "Favorites",
      icon: Heart,
      badge: wishlistItems.length,
    },
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActiveLink = (to) => {
    if (to === "/") {
      return (
        location.pathname === "/" ||
        location.pathname.startsWith("/restaurant/")
      );
    }
    return location.pathname === to;
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-[#fff9ef]/85 backdrop-blur-xl dark:border-[#20343f] dark:bg-[#11222b]/85">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <Motion.div
            whileHover={{ scale: 1.03 }}
            className="w-10 h-10 bg-white dark:bg-[#1e313c] rounded-2xl flex items-center justify-center shadow-md transition-shadow overflow-hidden"
          >
            <img
              src="/src/assets/img/logo/logo.png"
              alt="Logo"
              className="w-6 h-6 object-contain"
            />
          </Motion.div>
          <div>
            <span className="block font-display font-black text-lg text-[#10252f] dark:text-[#f4fbff] leading-none">
              QuickBite
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#67808d] dark:text-[#94b0be]">
              Fresh Delivery
            </span>
          </div>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-2xl bg-white/60 dark:bg-[#1d333d]">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={clsx(
                "relative flex items-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm transition-all duration-200",
                isActiveLink(link.to)
                  ? "bg-gradient-to-r from-[#ff6b2c] to-[#f2552c] text-white shadow-lg"
                  : "text-[#3d5969] dark:text-[#bdd5e0] hover:bg-[#eef4f7] dark:hover:bg-[#264551]",
              )}
            >
              <link.icon size={14} />
              {link.label}
              {link.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff3b30] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Dark mode */}
          <Motion.button
            whileTap={{ scale: 0.95 }}
            onClick={toggleDarkMode}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-[#3d5969] dark:text-[#bdd5e0] hover:bg-[#edf4f8] dark:hover:bg-[#264551] transition-colors"
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </Motion.button>

          {/* Cart */}
          <Link
            to="/cart"
            className="relative w-9 h-9 flex items-center justify-center rounded-xl text-[#3d5969] dark:text-[#bdd5e0] hover:bg-[#edf4f8] dark:hover:bg-[#264551] transition-colors"
          >
            <ShoppingCart size={17} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#f2552c] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <button className="relative w-9 h-9 flex items-center justify-center rounded-xl text-[#3d5969] dark:text-[#bdd5e0] hover:bg-[#edf4f8] dark:hover:bg-[#264551] transition-colors">
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff3b30] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User menu */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#dce8ee] dark:border-[#2e4a55]">
            <Link
              to="/profile"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-[#2cb6c9] to-[#199fb8] rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {user?.name?.[0] || "U"}
              </div>
              <span className="hidden sm:block text-sm font-medium text-[#153341] dark:text-[#f3fbff]">
                {user?.name?.split(" ")[0]}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs px-2 py-1 rounded-lg text-[#3d5969] dark:text-[#bdd5e0] hover:bg-[#edf4f8] dark:hover:bg-[#264551] transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden px-4 py-2 flex gap-1 border-t border-[#dce8ee] dark:border-[#2d4a55] bg-white/75 dark:bg-[#142933]">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={clsx(
              "relative flex items-center gap-1 px-2 py-2 rounded-xl text-xs font-semibold transition-all flex-1 justify-center",
              isActiveLink(link.to)
                ? "bg-gradient-to-r from-[#ff6b2c] to-[#f2552c] text-white"
                : "text-[#3d5969] dark:text-[#bdd5e0] hover:bg-[#edf4f8] dark:hover:bg-[#264551]",
            )}
          >
            <link.icon size={13} />
            <span className="truncate">{link.label}</span>
            {link.badge > 0 && (
              <span className="absolute -top-1 right-1 w-4 h-4 bg-[#ff3b30] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                {link.badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="md:hidden fixed bottom-4 right-4 z-40">
        <Link
          to="/orders"
          className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#19a9bf] to-[#0c8fa5] text-white shadow-2xl flex items-center justify-center"
        >
          <MapPinned size={18} />
        </Link>
      </div>
    </header>
  );
};

const CustomerLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-[#fff8ef] dark:bg-[#0d1b23]">
      <CustomerNav />
      <main className="flex-1 relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-[#ff9e5d]/20 blur-3xl dark:bg-[#2cb6c9]/15" />
          <div className="absolute top-1/3 -right-20 h-72 w-72 rounded-full bg-[#2cb6c9]/20 blur-3xl dark:bg-[#ff9e5d]/10" />
        </div>
        <div className="relative">{children}</div>
      </main>
    </div>
  );
};

export default CustomerLayout;
