import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

import { useAuthStore, useAppStore, useTrackingStore } from "@/store";
import ProtectedRoute from "./ProtectedRoute";
import { ToastContainer } from "@/components";
import { socket } from "@/services";

// Auth pages
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";

// Customer pages
import RestaurantsPage from "@/pages/customer/RestaurantsPage";
import RestaurantDetailsPage from "@/pages/customer/RestaurantDetailsPage";
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
import AdminLiveTrackingPage from "@/pages/admin/AdminLiveTrackingPage";
import AdminHeatmapPage from "@/pages/admin/AdminHeatmapPage";
import AdminRestaurantsPage from "@/pages/admin/AdminRestaurantsPage";
import AdminRestaurantFormPage from "@/pages/admin/AdminRestaurantFormPage";
import AdminRestaurantMenuPage from "@/pages/admin/AdminRestaurantMenuPage";

// 404
const NotFoundPage = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8f8f8] dark:bg-[#0f0505]">
    <div className="text-8xl mb-4 animate-bounce">🛵</div>
    <h1 className="font-display text-4xl font-black text-gradient mb-2">404</h1>
    <p className="text-[#6b4040] dark:text-[#c9a97a] mb-6">
      This page doesn't exist!
    </p>
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
  const { isDarkMode, initDarkMode, addToast } = useAppStore();
  const {
    bindRealtimeListeners,
    unbindRealtimeListeners,
    startDelayMonitoring,
    stopDelayMonitoring,
  } = useTrackingStore();

  useEffect(() => {
    initDarkMode(isDarkMode);
  }, [initDarkMode, isDarkMode]);

  useEffect(() => {
    socket.connect();
    bindRealtimeListeners();
    startDelayMonitoring();

    return () => {
      stopDelayMonitoring();
      unbindRealtimeListeners();
      socket.disconnect();
    };
  }, [
    bindRealtimeListeners,
    startDelayMonitoring,
    stopDelayMonitoring,
    unbindRealtimeListeners,
  ]);

  useEffect(() => {
    const onOrderDelayed = (payload) => {
      if (user?.role !== "admin") return;
      addToast({
        type: "warning",
        title: `Delayed order ${payload.orderId}`,
        message: "Attention required in live tracking center.",
      });
    };

    const onOrderCancelled = (payload) => {
      if (user?.role === "admin") {
        addToast({
          type: "info",
          title: `Order cancelled ${payload.orderId}`,
          message:
            payload.cancelReason || "Cancellation detected in operations.",
        });
      }
    };

    const onHeatmapUpdated = () => {
      if (user?.role !== "admin") return;
      addToast({
        type: "info",
        title: "Heatmap refreshed",
        message: "Demand visualization has new activity.",
        duration: 2200,
      });
    };

    socket.on("order-delayed", onOrderDelayed);
    socket.on("order-cancelled", onOrderCancelled);
    socket.on("heatmap-updated", onHeatmapUpdated);
    return () => {
      socket.off("order-delayed", onOrderDelayed);
      socket.off("order-cancelled", onOrderCancelled);
      socket.off("heatmap-updated", onHeatmapUpdated);
    };
  }, [addToast, user?.role]);

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
            isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
          }
        />

        {/* Customer routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <RestaurantsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/restaurant/:id"
          element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <RestaurantDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/menu"
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
          path="/admin/restaurants"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminRestaurantsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/restaurants/create"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminRestaurantFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/restaurants/:id/edit"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminRestaurantFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/restaurants/:id/menu"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminRestaurantMenuPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/live-tracking"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLiveTrackingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/heatmap"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminHeatmapPage />
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
