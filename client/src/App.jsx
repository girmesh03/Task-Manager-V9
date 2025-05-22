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
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Tasks = lazy(() => import("./pages/Tasks"));
const TaskDetails = lazy(() => import("./pages/TaskDetails"));
const Users = lazy(() => import("./pages/Users"));
const UserProfile = lazy(() => import("./pages/UserProfile"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
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
              { path: "tasks/:taskId/details", Component: TaskDetails },
              { path: "users", Component: Users },
              { path: "users/:userId/profile", Component: UserProfile },
              { path: "admin-panel", Component: AdminPanel },
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
