// react
import { createBrowserRouter, RouterProvider } from "react-router";

// mui
import CssBaseline from "@mui/material/CssBaseline";

// theme customizations
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

// layout imports
import RootLayout from "./layouts/RootLayout";
import AuthLayout from "./layouts/AuthLayout";
import AppLayout from "./layouts/AppLayout";

// public page imports
import Home from "./pages/Home";
import Login from "./pages/Login";

// protected page imports
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import TaskDetails from "./pages/TaskDetails";
import Users from "./pages/Users";
import UserProfile from "./pages/UserProfile";
import AdminPanel from "./pages/AdminPanel";

// themed components
import AppTheme from "./theme/AppTheme";

// protected route
import ProtectedRoute from "./routes/ProtectedRoute";

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
    ],
  },
]);

const App = () => {
  return (
    <AppTheme themeComponents={themeComponents}>
      <CssBaseline enableColorScheme />
      <RouterProvider router={router} />
    </AppTheme>
  );
};

export default App;
