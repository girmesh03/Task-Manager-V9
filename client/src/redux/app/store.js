import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer, createTransform } from "redux-persist";
import storage from "redux-persist/lib/storage";
import { apiSlice } from "../features/apiSlice";
import authReducer from "../features/authSlice";

const authTransform = createTransform(
  (inboundState) => ({
    currentUser: inboundState?.currentUser,
    isAuthenticated: inboundState?.isAuthenticated,
  }),
  (outboundState) => outboundState,
  { whitelist: ["auth"] }
);

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
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(apiSlice.middleware),
});

export const persistor = persistStore(store);
