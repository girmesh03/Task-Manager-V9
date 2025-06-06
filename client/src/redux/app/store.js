import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, createTransform } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { apiSlice } from "../features/apiSlice";
import authReducer from "../features/authSlice";
import filtersReducer from "../features/filtersSlice";

// Transform to safely persist only necessary auth state
const authTransform = createTransform(
  (inboundState) => ({
    currentUser: inboundState?.currentUser,
    isAuthenticated: inboundState?.isAuthenticated,
  }),
  (outboundState) => outboundState,
  { whitelist: ["auth"] }
);

// Persistence config for auth state
const authPersistConfig = {
  key: "auth",
  storage,
  transforms: [authTransform],
  version: 1,
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: persistedAuthReducer,
    filters: filtersReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          "persist/PERSIST",
          "persist/REHYDRATE",
          "auth/login/fulfilled",
        ],
      },
    }).concat(apiSlice.middleware),
  devTools: import.meta.env.VITE_MODE === "development",
});

export const persistor = persistStore(store);
