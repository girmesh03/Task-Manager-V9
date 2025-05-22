// apiSlice.js
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setLogout, selectTokenVersion } from "./authSlice";
import { toast } from "react-toastify";

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
    api.dispatch(setLogout());
    toast.error("Security session revoked. Please login again.", {
      position: "bottom-right",
      autoClose: 5000,
    });
    return result;
  }

  // Handle 401 Unauthorized
  if (result?.error?.status === 401) {
    const refreshResult = await baseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult?.data) {
      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(setLogout());
      toast.error("Session expired. Please login again.", {
        position: "bottom-right",
        autoClose: 5000,
      });
    }
  }

  // Handle other errors
  // if (result?.error) {
  //   const errorMessage = result.error.data?.message || "Operation failed";
  //   if (![401, 498].includes(result.error.status)) {
  //     toast.error(errorMessage, {
  //       position: "bottom-right",
  //       autoClose: 5000,
  //     });
  //   }
  // }

  return result;
};

export const apiSlice = createApi({
  reducerPath: "appApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    "Dashboard",
    "Tasks",
    "Users",
    "Departments",
    "Notifications",
    "Activities",
  ],
  endpoints: () => ({}),
});
