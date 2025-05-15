// react
import { Navigate, Outlet, useLocation } from "react-router";

// redux
import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../redux/features/authSlice";

const ProtectedRoute = () => {
  console.log("ProtectedRoute");
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
