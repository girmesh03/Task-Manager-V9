// src/socket.js
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

let socket = null;

/**
 * Initialize the singleton Socket.IO client (but don’t connect yet).
 */
function initSocket() {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    autoConnect: false,
    withCredentials: true,
    transports: ["polling", "websocket"], // try polling first, then websocket
    reconnectionAttempts: 5,
    reconnectionDelay: 3000,
    path: "http://localhost:4000/api/socket.io", // adjust if your server uses a custom path
  });

  // debug listeners
  socket.on("connect", () =>
    console.log(`⚡ Socket connected (id=${socket.id})`)
  );
  socket.on("disconnect", (reason) =>
    console.log(`⚡ Socket disconnected (${reason})`)
  );
  socket.on("connect_error", (err) =>
    console.error("⚡ Socket connection error:", err.message)
  );

  return socket;
}

/**
 * Actually open the connection (if not already).
 */
export function connectSocket() {
  const s = initSocket();
  if (s.connected) {
    console.log("Socket already connected.");
  } else {
    console.log("⚡ connecting socket…");
    s.connect();
  }
  return s;
}

/**
 * Cleanly tear it down.
 */
export function disconnectSocket() {
  if (!socket) return;
  console.log("⚡ disconnecting socket…");
  socket.off(); // remove all listeners
  socket.disconnect();
  socket = null;
}

/**
 * Helper to emit custom events.
 */
export function emitSocketEvent(eventName, data) {
  if (socket && socket.connected) {
    socket.emit(eventName, data);
  } else {
    console.warn("Socket not connected:", eventName);
  }
}

export { socket };
