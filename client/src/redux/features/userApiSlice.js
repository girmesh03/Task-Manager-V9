import { apiSlice } from "./apiSlice"; // Assuming apiSlice.js is in the same directory or adjust path

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: ({ departmentId, page, limit, role }) => ({
        url: `/users/department/${departmentId}`,
        params: { page, limit, role },
      }),
      transformResponse: (response) => {
        return {
          users: response.data?.users || response.users || [],
          pagination: response.data?.pagination || response.pagination || {},
        };
      },
      providesTags: (result, error, { departmentId }) => [
        { type: "Users", id: `DEPARTMENT-${departmentId}` }, // Tag for department-wide user list
        ...(result?.users?.map(({ _id, id }) => ({
          type: "User",
          id: _id || id,
        })) || []),
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

    createUser: builder.mutation({
      query: ({ departmentId, userData }) => ({
        url: `/users/department/${departmentId}`,
        method: "POST",
        body: userData,
      }),
      invalidatesTags: (result, error, { departmentId }) => [
        "Users",
        { type: "Users", id: `DEPARTMENT-${departmentId}` },
      ],
    }),

    updateUser: builder.mutation({
      query: ({ departmentId, userId, userData }) => ({
        url: `/users/department/${departmentId}/user/${userId}`,
        method: "PUT",
        body: userData,
      }),
      invalidatesTags: (result, error, { departmentId, userId }) => [
        { type: "User", id: userId },
        { type: "Users", id: `DEPARTMENT-${departmentId}` },
        { type: "UserStats", id: userId },
        { type: "Department", id: "LIST" },
      ],
    }),

    deleteUser: builder.mutation({
      query: ({ departmentId, userId }) => ({
        url: `/users/department/${departmentId}/user/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
        { type: "UserStats", id: userId },
        { type: "Department", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUsersStatQuery,
  useGetUserProfileQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApiSlice;
