// src/hooks/useNotificationSocket.js
import { useEffect } from "react";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";

import useAuth from "./useAuth";
import { connectSocket, disconnectSocket, socket } from "../socket";
import { notificationApiSlice } from "../redux/features/notificationApiSlice";

export const useNotificationSocket = () => {
  const { isAuthenticated } = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    // only connect once user is authenticated
    if (!isAuthenticated) return;

    connectSocket();

    const handleReconnect = () => {
      console.log("Socket re-connected, fetching stats...");
      dispatch(
        notificationApiSlice.util.invalidateTags([
          { type: "Notification", id: "UNREAD_COUNT" },
        ])
      );
    };
    const handleNewNotification = (notification) => {
      console.log("RT: New notification received", notification);
      toast.info(notification.message);
      dispatch(
        notificationApiSlice.util.invalidateTags([
          { type: "Notification", id: "UNREAD_COUNT" },
        ])
      );
    };
    const invalidateAll = () =>
      dispatch(
        notificationApiSlice.util.invalidateTags([{ type: "Notification" }])
      );

    socket.on("connect", handleReconnect);
    socket.on("new_notification", handleNewNotification);
    socket.on("notifications-read", invalidateAll);
    socket.on("notifications-all-read", invalidateAll);

    return () => {
      if (socket) {
        socket.off("connect", handleReconnect);
        socket.off("new_notification", handleNewNotification);
        socket.off("notifications-read", invalidateAll);
        socket.off("notifications-all-read", invalidateAll);
      }
      disconnectSocket();
    };
  }, [isAuthenticated, dispatch]);
};
