import { Suspense } from "react";
import { Navigate, Outlet, useLocation } from "react-router";

import { useSelector } from "react-redux";
import { selectIsAuthenticated } from "../redux/features/authSlice";

import { LoadingFallback } from "../components/LoadingFallback";

const ProtectedRoute = () => {
  // console.log("ProtectedRoute");
  const location = useLocation();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Outlet />
    </Suspense>
  );
};

export default ProtectedRoute;
