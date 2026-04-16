import { Link, NavLink, Outlet } from "react-router-dom";
import { APP_NAME, ROUTES } from "@/constants/appConstants";
import { classNames } from "@/utils";

function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <Link
            to={ROUTES.home}
            className="text-lg font-semibold text-slate-900"
          >
            {APP_NAME}
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            <NavLink
              to={ROUTES.home}
              className={({ isActive }) =>
                classNames(
                  isActive
                    ? "text-primary"
                    : "text-slate-600 hover:text-slate-900",
                )
              }
            >
              Home
            </NavLink>
            <NavLink
              to={ROUTES.dashboard}
              className={({ isActive }) =>
                classNames(
                  isActive
                    ? "text-primary"
                    : "text-slate-600 hover:text-slate-900",
                )
              }
            >
              Dashboard
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
