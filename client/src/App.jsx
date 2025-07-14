import { lazy } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
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
    element: <RootLayout />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { index: true, element: <Home /> },
          { path: "login", element: <Login /> },
          { path: "verify-email", element: <VerifyEmail /> },
          { path: "reset-password/:resetToken", element: <ResetPassword /> },
          { path: "forgot-password", element: <ForgotPassword /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: "dashboard", element: <Dashboard /> },
              { path: "tasks", element: <Tasks /> },
              { path: "routine-tasks", element: <RoutineTasks /> },
              { path: "tasks/:taskId/details", element: <TaskDetails /> },
              {
                path: "routine-tasks/:taskId/details",
                element: <RoutineTaskDetails />,
              },
              { path: "users", element: <Users /> },
              { path: "users/:userId/profile", element: <UserProfile /> },
              { path: "users/:userId/account", element: <UserAccount /> },
              { path: "admin-panel", element: <AdminPanel /> },
              { path: "reports", element: <Reports /> },
            ],
          },
        ],
      },
      {
        path: "error",
        element: <ErrorPage />,
      },
      {
        path: "*",
        element: <NotFound />,
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
