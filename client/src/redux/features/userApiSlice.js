import { apiSlice } from "./apiSlice"; // Assuming apiSlice.js is in the same directory or adjust path

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: ({ departmentId, page, limit, role }) => ({
        url: `/users/department/${departmentId}`, // Ensure this is the correct endpoint for general user listing
        params: { page, limit, role },
      }),
      transformResponse: (response) => {
        // Assuming the backend for `/users/department/:departmentId` returns { users: [], pagination: {} }
        return {
          users: response.data?.users || response.users || [], // Adapt based on actual response structure
          pagination: response.data?.pagination || response.pagination || {},
        };
      },
      providesTags: (result, error, { departmentId }) => [
        { type: "Users", id: `DEPARTMENT-${departmentId}` }, // Tag for department-wide user list
        ...(result?.users?.map(({ _id, id }) => ({
          type: "User",
          id: _id || id,
        })) || []), // Individual user tags
        { type: "User", id: "LIST" }, // General list tag
      ],
    }),

    getUsersStat: builder.query({
      query: ({ departmentId, page, limit, currentDate }) => ({
        url: `/users/department/${departmentId}/statistics`, // Corrected URL for the statistics endpoint
        params: { page, limit, currentDate }, // These params are consumed by your getUsersWithStat controller
      }),
      transformResponse: (response) => {
        // The backend for /statistics returns { rows: [], page: X, pageSize: Y, rowCount: Z }
        // We want to make this consistent for easier consumption if needed, or just pass through
        return {
          rows: response.rows || [],
          page: response.page,
          pageSize: response.pageSize,
          rowCount: response.rowCount,
          // You could also structure it as:
          // data: response.rows || [],
          // meta: {
          //   currentPage: response.page,
          //   itemsPerPage: response.pageSize,
          //   totalItems: response.rowCount,
          //   // totalPages: Math.ceil(response.rowCount / response.pageSize) // if needed
          // }
        };
      },
      providesTags: (result, error, { departmentId, currentDate }) => {
        const tags = [
          {
            type: "UserStats",
            id: `DEPARTMENT-${departmentId}-${currentDate || "allTime"}`,
          },
        ];
        if (result && result.rows) {
          result.rows.forEach((userStat) => {
            // userStat.id should be the user's actual ID string
            tags.push({ type: "UserStats", id: userStat.id });
            tags.push({ type: "User", id: userStat.id }); // Also tag the underlying User
          });
        }
        tags.push({ type: "UserStats", id: "LIST" });
        return tags;
      },
      // keepUnusedDataFor: 5, // Optional: time in seconds to keep data in cache after unsubscription
    }),

    getUserProfile: builder.query({
      query: ({ departmentId, userId, currentDate }) => ({
        url: `/users/department/${departmentId}/user/${userId}/profile`,
        params: { currentDate },
      }),
      // Assuming the profile endpoint returns the user object directly or nested under a 'data' or 'user' key
      transformResponse: (response) =>
        response.data || response.user || response,
      providesTags: (result, error, { userId }) => [
        { type: "User", id: userId }, // Specific user profile
        { type: "UserProfile", id: userId },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUsersStatQuery,
  useGetUserProfileQuery,
} = userApiSlice;
