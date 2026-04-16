import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  useAuthStore,
  useCartStore,
  useAppStore,
  useTrackingStore,
  useWishlistStore,
} from "@/store";
import clsx from "clsx";

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
    { to: "/", label: "Restaurants", icon: "🏪" },
    { to: "/menu", label: "Browse Menu", icon: "🍔" },
    { to: "/orders", label: "My Orders", icon: "📦" },
    {
      to: "/wishlist",
      label: "Favorites",
      icon: "❤️",
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
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-[#430000]/90 backdrop-blur-md border-b border-[#E5D0AC] dark:border-[#3d1a1a] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-white dark:bg-gray-900 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-glow transition-shadow overflow-hidden">
            <img
              src="/src/assets/img/logo/logo.png"
              alt="Logo"
              className="w-6 h-6 object-contain"
            />
          </div>
          <span className="font-display font-bold text-xl text-gradient">
            QuickBite
          </span>
        </Link>

        {/* Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={clsx(
                "relative flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200",
                isActiveLink(link.to)
                  ? "bg-primary text-white"
                  : "text-[#6b4040] dark:text-[#c9a97a] hover:bg-[#E5D0AC]/50 dark:hover:bg-[#3d1a1a]/50",
              )}
            >
              <span>{link.icon}</span>
              {link.label}
              {link.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Dark mode */}
          <button
            onClick={toggleDarkMode}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-[#6b4040] dark:text-[#c9a97a] hover:bg-[#E5D0AC]/50 dark:hover:bg-[#3d1a1a]/50 transition-colors"
          >
            {isDarkMode ? "☀️" : "🌙"}
          </button>

          {/* Cart */}
          <Link
            to="/cart"
            className="relative w-9 h-9 flex items-center justify-center rounded-lg text-[#6b4040] dark:text-[#c9a97a] hover:bg-[#E5D0AC]/50 dark:hover:bg-[#3d1a1a]/50 transition-colors"
          >
            🛒
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Notifications */}
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg text-[#6b4040] dark:text-[#c9a97a] hover:bg-[#E5D0AC]/50 dark:hover:bg-[#3d1a1a]/50 transition-colors">
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User menu */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#E5D0AC] dark:border-[#3d1a1a]">
            <Link
              to="/profile"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-brand rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {user?.name?.[0] || "U"}
              </div>
              <span className="hidden sm:block text-sm font-medium text-[#1a0a0a] dark:text-[#f8f8f8]">
                {user?.name?.split(" ")[0]}
              </span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-xs px-2 py-1 rounded-lg text-[#6b4040] dark:text-[#c9a97a] hover:bg-[#E5D0AC]/50 dark:hover:bg-[#3d1a1a]/50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="md:hidden px-4 pb-2 flex gap-1">
        {navLinks.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={clsx(
              "relative flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex-1 justify-center",
              isActiveLink(link.to)
                ? "bg-primary text-white"
                : "text-[#6b4040] dark:text-[#c9a97a] hover:bg-[#E5D0AC]/50 dark:hover:bg-[#3d1a1a]/50",
            )}
          >
            <span>{link.icon}</span>
            <span className="hidden xs:inline">{link.label}</span>
            {link.badge > 0 && (
              <span className="absolute -top-1 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                {link.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </header>
  );
};

const CustomerLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#0f0505] flex flex-col">
      <CustomerNav />
      <main className="flex-1">{children}</main>
    </div>
  );
};

export default CustomerLayout;
