import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore, useAppStore } from "@/store";
import clsx from "clsx";

const DRIVER_NAV = [
  { to: "/driver", label: "Dashboard", icon: "📊", exact: true },
  { to: "/driver/orders", label: "My Orders", icon: "📋" },
  { to: "/driver/earnings", label: "Earnings", icon: "💰" },
];

const DashboardLayout = ({ children, role = "driver" }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { isDarkMode, toggleDarkMode, sidebarOpen, toggleSidebar } =
    useAppStore();

  const adminNav = [
    { to: "/admin", label: "Dashboard", icon: "📊", exact: true },
    { to: "/admin/orders", label: "All Orders", icon: "📋" },
    { to: "/admin/drivers", label: "Drivers", icon: "🚴" },
    { to: "/admin/customers", label: "Customers", icon: "👥" },
  ];

  const nav = role === "admin" ? adminNav : DRIVER_NAV;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (link) => {
    if (link.exact) return location.pathname === link.to;
    return location.pathname.startsWith(link.to);
  };

  return (
    <div className="min-h-screen flex bg-[#f8f8f8] dark:bg-[#0f0505]">
      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-30 flex flex-col transition-all duration-300 bg-white dark:bg-[#120606] border-r border-[#E5D0AC] dark:border-[#3d1a1a] shadow-lg",
          sidebarOpen ? "w-60" : "w-16"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-[#E5D0AC] dark:border-[#3d1a1a]">
          <div className="w-9 h-9 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
            <img src="/src/assets/img/logo/logo.png" alt="Logo" className="w-6 h-6 object-contain" />
          </div>
          {sidebarOpen && (
            <span className="ml-2.5 font-display font-bold text-lg text-gradient truncate">
              QuickBite
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-hidden">
          {nav.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={clsx(
                "sidebar-link",
                isActive(link) && "active",
                !sidebarOpen && "justify-center px-2"
              )}
              title={!sidebarOpen ? link.label : undefined}
            >
              <span className="text-lg flex-shrink-0">{link.icon}</span>
              {sidebarOpen && (
                <span className="truncate">{link.label}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-[#E5D0AC] dark:border-[#3d1a1a]">
          <div
            className={clsx(
              "flex items-center gap-3",
              !sidebarOpen && "justify-center"
            )}
          >
            <div className="w-9 h-9 bg-gradient-brand rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
              {user?.name?.[0] || "?"}
            </div>
            {sidebarOpen && (
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[#1a0a0a] dark:text-[#f8f8f8] truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-[#6b4040] dark:text-[#c9a97a] capitalize">
                  {user?.role}
                </p>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="mt-3 w-full btn btn-ghost text-sm text-[#6b4040] dark:text-[#c9a97a]"
            >
              Logout
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div
        className={clsx(
          "flex-1 flex flex-col transition-all duration-300",
          sidebarOpen ? "ml-60" : "ml-16"
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-20 h-16 bg-white/90 dark:bg-[#430000]/90 backdrop-blur-md border-b border-[#E5D0AC] dark:border-[#3d1a1a] flex items-center justify-between px-6">
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[#6b4040] dark:text-[#c9a97a] hover:bg-[#E5D0AC]/50 dark:hover:bg-[#3d1a1a]/50 transition-colors"
          >
            {sidebarOpen ? "◀" : "▶"}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-[#6b4040] dark:text-[#c9a97a] hover:bg-[#E5D0AC]/50 dark:hover:bg-[#3d1a1a]/50 transition-colors"
            >
              {isDarkMode ? "☀️" : "🌙"}
            </button>
            <span className="text-sm text-[#6b4040] dark:text-[#c9a97a] hidden sm:block capitalize">
              {role === "admin" ? "Admin Panel" : "Driver Dashboard"}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
