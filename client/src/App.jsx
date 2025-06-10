import { lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router";
import { ToastContainer } from "react-toastify";
import CssBaseline from "@mui/material/CssBaseline";
import "react-toastify/dist/ReactToastify.css";

import {
  chartsCustomizations,
  dataGridCustomizations,
  datePickersCustomizations,
  treeViewCustomizations,
} from "./theme/customizations";

const themeComponents = {
  ...chartsCustomizations,
  ...dataGridCustomizations,
  ...datePickersCustomizations,
  ...treeViewCustomizations,
};

import AppTheme from "./theme/AppTheme";
import RootLayout from "./layouts/RootLayout";

const AuthLayout = lazy(() => import("./layouts/AuthLayout"));
const AppLayout = lazy(() => import("./layouts/AppLayout"));
const ProtectedRoute = lazy(() => import("./routes/ProtectedRoute"));

const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const RoutineTasks = lazy(() => import("./pages/RoutineTasks"));
const TaskDetails = lazy(() => import("./pages/TaskDetails"));
const RoutineTaskDetails = lazy(() => import("./pages/RoutineTaskDetails"));
const Users = lazy(() => import("./pages/Users"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const UserAccount = lazy(() => import("./pages/UserAccount"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Reports = lazy(() => import("./pages/Reports"));
const ErrorPage = lazy(() => import("./pages/ErrorPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        Component: AuthLayout,
        children: [
          { index: true, Component: Home },
          { path: "login", Component: Login },
          { path: "verify-email", Component: VerifyEmail },
          { path: "reset-password/:resetToken", Component: ResetPassword },
          { path: "forgot-password", Component: ForgotPassword },
        ],
      },
      {
        Component: ProtectedRoute,
        children: [
          {
            Component: AppLayout,
            children: [
              { path: "dashboard", Component: Dashboard },
              { path: "tasks", Component: Tasks },
              { path: "routine-tasks", Component: RoutineTasks },
              { path: "tasks/:taskId/details", Component: TaskDetails },
              {
                path: "routine-tasks/:taskId/details",
                Component: RoutineTaskDetails,
              },
              { path: "users", Component: Users },
              { path: "users/:userId/profile", Component: UserProfile },
              { path: "users/:userId/account", Component: UserAccount },
              { path: "admin-panel", Component: AdminPanel },
              { path: "reports", Component: Reports },
            ],
          },
        ],
      },
      {
        path: "error",
        Component: ErrorPage,
      },
      {
        path: "*",
        Component: NotFound,
      },
    ],
  },
]);

const App = () => {
  const theme = localStorage.getItem("mui-mode") || "dark";

  return (
    <AppTheme themeComponents={themeComponents}>
      <CssBaseline enableColorScheme />

      {/* Router */}
      <RouterProvider router={router} />

      {/* Global Toast Container */}
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme === "system" ? "dark" : "light"}
        toastStyle={{
          fontFamily: "'Inter', sans-serif",
          fontSize: "0.875rem",
          borderRadius: "4px",
        }}
      />
    </AppTheme>
  );
};

export default App;
