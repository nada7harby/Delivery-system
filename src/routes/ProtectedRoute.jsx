import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/store";

// Guard that redirects to /login if not authenticated
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    // Redirect to home role route
    const roleHome = {
      customer: "/",
      driver: "/driver",
      admin: "/admin",
    };
    return <Navigate to={roleHome[user?.role] || "/"} replace />;
  }

  return children;
};

export default ProtectedRoute;
