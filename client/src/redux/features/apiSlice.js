import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setLogout, selectTokenVersion } from "./authSlice";

const SERVER_URL = import.meta.env.VITE_BACKEND_SERVER_URL;

const baseQuery = fetchBaseQuery({
  baseUrl: `${SERVER_URL}/api`,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    // Add token version header for server validation
    const tokenVersion = selectTokenVersion(getState());
    headers.set("X-Token-Version", tokenVersion);
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // Handle token version mismatch (server should return 498)
  if (result?.error?.status === 498) {
    api.dispatch(setLogout("Security session revoked. Please login again."));
  }
  // Handle 401 Unauthorized
  else if (result?.error?.status === 401) {
    const refreshResult = await baseQuery("/auth/refresh", api, extraOptions);
    if (refreshResult?.data) {
      return await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(setLogout("Session expired. Please login again."));
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "appApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Department",
    "Statistics",
    "User",
    "Task",
    "RoutineTask",
    "Activity",
    "Report",
    "UserStat",
    "Notification",
  ],
  endpoints: () => ({}),
});
