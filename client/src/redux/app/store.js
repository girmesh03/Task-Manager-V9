import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, createTransform } from "redux-persist";
import storage from "redux-persist/lib/storage"; // Use localStorage for web
import { apiSlice } from "../features/apiSlice";
import authReducer from "../features/authSlice";
import filtersReducer from "../features/filtersSlice";

// Define a transform to filter sensitive data from auth state
const authTransform = createTransform(
  // inbound: save only these fields
  (inboundState) => ({
    currentUser: inboundState.currentUser,
    isAuthenticated: inboundState.isAuthenticated,
  }),
  // outbound: return state as is
  (outboundState) => outboundState,
  { whitelist: ["auth"] }
);

// Redux Persist config for auth
const authPersistConfig = {
  key: "auth",
  storage,
  transforms: [authTransform], // Apply the transform
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer, // Add API reducer
    auth: persistedAuthReducer, // Persisted authentication reducer
    filters: filtersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Required for Redux Persist
    }).concat(apiSlice.middleware),
  devTools: import.meta.env.VITE_MODE === "development",
});

export const persistor = persistStore(store);
