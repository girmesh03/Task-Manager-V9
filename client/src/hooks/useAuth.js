// redux
import { useSelector } from "react-redux";
import {
  selectCurrentUser,
  selectIsAuthenticated,
} from "../redux/features/authSlice";

const useAuth = () => {
  const currentUser = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const isSuperAdmin = currentUser?.role === "SuperAdmin";
  const isAdmin = currentUser?.role === "Admin";
  const isManager = currentUser?.role === "Manager";
  const isUser = currentUser?.role === "User"; // Basic user role

  return {
    currentUser, // The full user object
    isAuthenticated,
    currentUserId: currentUser?._id,
    currentUserRole: currentUser?.role,
    isSuperAdmin,
    isAdmin,
    isManager,
    isUser,
    // Combine roles for easier checks
    isAdminOrSuperAdmin: isAdmin || isSuperAdmin,
    isPrivilegedUser: isAdmin || isSuperAdmin || isManager, // Can manage something
  };
};

export default useAuth;
