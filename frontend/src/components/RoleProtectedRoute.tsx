import { ROUTES } from "@/lib/routes";
import tokenManager from "@/lib/tokenManager";
import { Navigate } from "react-router-dom";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: ("student" | "admin")[];
  fallbackRoute?: string;
}

const RoleProtectedRoute: React.FC<RoleProtectedRouteProps> = ({
  children,
  allowedRoles,
  fallbackRoute = ROUTES.HOME,
}) => {
  const isAuthenticated = tokenManager.isAuthenticated();
  const user = tokenManager.getUser();
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  if (!user) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }
  const hasRequiredRole = allowedRoles.includes(user.role);

  if (!hasRequiredRole) {
    if (user.role === "student") {
      return <Navigate to={ROUTES.CHAT} replace />;
    } else if (user.role === "admin") {
      return <Navigate to={ROUTES.ADMIN} replace />;
    } else {
      return <Navigate to={fallbackRoute} replace />;
    }
  }

  return <>{children}</>;
};

export default RoleProtectedRoute;
