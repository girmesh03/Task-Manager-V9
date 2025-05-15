import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setLogout } from "./authSlice";

const SERVER_URL = import.meta.env.VITE_BACKEND_SERVER_URL;

const baseQuery = fetchBaseQuery({
  baseUrl: `${SERVER_URL}/api`,
  credentials: "include",
  prepareHeaders: (headers) => {
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // If 401, try refresh token
  if (result?.error?.status === 401) {
    const refreshResult = await baseQuery("/auth/refresh", api, extraOptions);

    if (refreshResult?.data) {
      // Retry original request with new token
      result = await baseQuery(args, api, extraOptions);
    } else {
      // logout
      api.dispatch(setLogout());
    }
  }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "appApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Dashboard", "Tasks", "Users", "Departments", "Notifications"],
  endpoints: () => ({}),
});
