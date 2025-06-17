import { useEffect, Suspense } from "react";
import { Outlet } from "react-router";
import { toast } from "react-toastify";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import { useDispatch } from "react-redux";
import { connectSocket, disconnectSocket, socket } from "../socket";
import { notificationApiSlice } from "../redux/features/notificationApiSlice";

import AppNavbar from "../components/AppNavbar";
import Header from "../components/Header";
import SideMenu from "../components/SideMenu";
import { LoadingFallback } from "../components/LoadingFallback";

import { drawerWidth } from "../utils/constants";

const AppLayout = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Connect socket on layout mount
    connectSocket();

    // Setup listeners
    if (socket) {
      socket.on("connect", () => {
        console.log("Socket re-connected, fetching stats...");
        // Invalidate stats on reconnect to ensure sync
        dispatch(
          notificationApiSlice.util.invalidateTags([
            { type: "Notification", id: "UNREAD_COUNT" },
          ])
        );
      });

      socket.on("new_notification", (notification) => {
        console.log("RT: New notification received", notification);
        toast.info(notification.message);
        // Invalidate stats to update the badge count
        dispatch(
          notificationApiSlice.util.invalidateTags([
            { type: "Notification", id: "UNREAD_COUNT" },
          ])
        );
      });

      // Listener to sync UI if notifications are read in another tab/window
      socket.on("notifications-read", () => {
        dispatch(
          notificationApiSlice.util.invalidateTags([{ type: "Notification" }])
        );
      });

      socket.on("notifications-all-read", () => {
        dispatch(
          notificationApiSlice.util.invalidateTags([{ type: "Notification" }])
        );
      });
    }

    // Disconnect on layout unmount
    return () => {
      if (socket) {
        // Clean up listeners to prevent memory leaks
        socket.off("connect");
        socket.off("new_notification");
        socket.off("notifications-read");
        socket.off("notifications-all-read");
      }
      disconnectSocket();
    };
  }, [dispatch]);

  return (
    <Box
      width="100%"
      height="100%"
      sx={{ display: { xs: "block", md: "flex" } }}
    >
      <SideMenu />
      <AppNavbar />
      <Stack
        direction="column"
        sx={{
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          height: "100%",
          flexGrow: 1,
        }}
      >
        <Header />
        {/* Main content */}
        <Stack
          direction="column"
          component="main"
          sx={{ width: "100%", height: "100%", overflow: "auto", flexGrow: 1 }}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </Stack>
      </Stack>
    </Box>
  );
};

export default AppLayout;
