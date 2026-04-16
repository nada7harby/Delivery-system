import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import { useAuthStore, useAppStore } from "@/store";
import ProtectedRoute from "./ProtectedRoute";
import { ToastContainer } from "@/components";

// Auth pages
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";

// Customer pages
import MenuPage from "@/pages/customer/MenuPage";
import CartPage from "@/pages/customer/CartPage";
import CheckoutPage from "@/pages/customer/CheckoutPage";
import OrderTrackingPage from "@/pages/customer/OrderTrackingPage";
import CustomerOrdersPage from "@/pages/customer/CustomerOrdersPage";
import WishlistPage from "@/pages/customer/WishlistPage";
import ProfilePage from "@/pages/customer/ProfilePage";

// Driver pages
import DriverDashboard from "@/pages/driver/DriverDashboard";
import DriverOrdersPage from "@/pages/driver/DriverOrdersPage";
import DriverOrderDetailPage from "@/pages/driver/DriverOrderDetailPage";
import DriverEarningsPage from "@/pages/driver/DriverEarningsPage";

// Admin pages
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminOrdersPage from "@/pages/admin/AdminOrdersPage";
import AdminOrderDetailPage from "@/pages/admin/AdminOrderDetailPage";
import AdminDriversPage from "@/pages/admin/AdminDriversPage";
import AdminCustomersPage from "@/pages/admin/AdminCustomersPage";

// 404
const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f8f8] dark:bg-[#0f0505]">
    <div className="text-8xl mb-4 animate-bounce">🛵</div>
    <h1 className="font-display text-4xl font-black text-gradient mb-2">404</h1>
    <p className="text-[#6b4040] dark:text-[#c9a97a] mb-6">This page doesn't exist!</p>
    <a
      href="/"
      className="btn-primary text-sm px-5 py-2.5 rounded-xl font-semibold text-white bg-primary hover:bg-primary-light"
    >
      Go Home
    </a>
  </div>
);

const AppRouter = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { isDarkMode, initDarkMode } = useAppStore();

  useEffect(() => {
    initDarkMode(isDarkMode);
  }, []);

  return (
    <BrowserRouter>
      <ToastContainer />
      <Routes>
        {/* Auth routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate
                to={
                  user?.role === "admin"
                    ? "/admin"
                    : user?.role === "driver"
                    ? "/driver"
                    : "/"
                }
                replace
              />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/" replace />
            ) : (
              <RegisterPage />
            )
          }
        />

        {/* Customer routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <MenuPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order/:id"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <OrderTrackingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerOrdersPage />
            </ProtectedRoute>
          }
        />

        {/* Driver routes */}
        <Route
          path="/driver"
          element={
            <ProtectedRoute allowedRoles={["driver"]}>
              <DriverDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/orders"
          element={
            <ProtectedRoute allowedRoles={["driver"]}>
              <DriverOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/order/:id"
          element={
            <ProtectedRoute allowedRoles={["driver"]}>
              <DriverOrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver/earnings"
          element={
            <ProtectedRoute allowedRoles={["driver"]}>
              <DriverEarningsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/order/:id"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminOrderDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/drivers"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDriversPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/customers"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCustomersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/wishlist"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <WishlistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
