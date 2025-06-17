import { io } from "socket.io-client";
import { store } from "./redux/app/store";

// Retrieve Socket URL from environment variables
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

let socket = null;

export const connectSocket = () => {
  // Prevent multiple connections
  if (socket && socket.connected) {
    console.log("Socket already connected.");
    return socket;
  }

  // The server's socket middleware will verify the httpOnly cookie sent by the browser.
  const isAuthenticated = store.getState().auth.isAuthenticated;

  if (!isAuthenticated) {
    console.log("User not authenticated, socket connection not initiated.");
    return null;
  }

  console.log(`Attempting to connect socket to ${SOCKET_URL}`);

  // Connect, ensuring cookies are sent
  socket = io(SOCKET_URL, {
    withCredentials: true, // IMPORTANT: This sends cookies with the connection request
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
  });

  // These generic listeners are useful for debugging the connection itself.
  // Specific application event listeners are handled in AppLayout.jsx.
  socket.on("connect", () => {
    console.log(`Socket connected successfully with ID: ${socket.id}`);
  });

  socket.on("disconnect", (reason) => {
    console.log(`Socket disconnected: ${reason}`);
    if (reason === "io server disconnect") {
      console.warn("Socket disconnected by server, potential auth issue.");
    }
  });

  socket.on("connect_error", (error) => {
    console.error(`Socket connection error: ${error.message}`, error);
    if (error.message.includes("Authentication error")) {
      console.error("Socket authentication failed. Check credentials/cookie.");
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    console.log("Disconnecting socket...");
    // Remove all listeners before disconnecting to prevent memory leaks
    socket.off();
    socket.disconnect();
  }
  socket = null; // Clear the instance
};

// A general utility to emit an event from the client, if ever needed.
export const emitSocketEvent = (eventName, data) => {
  if (socket && socket.connected) {
    socket.emit(eventName, data);
  } else {
    console.warn("Socket not connected, cannot emit event:", eventName);
  }
};

// Export the socket instance directly for use in the AppLayout listeners.
export { socket };
