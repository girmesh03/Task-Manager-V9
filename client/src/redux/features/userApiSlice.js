import { apiSlice } from "./apiSlice";

export const userApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: ({ departmentId, page, limit, role }) => ({
        url: `/users/department/${departmentId}`,
        params: { page, limit, role },
      }),

      transformResponse: (response) => ({
        users: response.users,
        pagination: response.pagination,
      }),

      providesTags: (result, error, { departmentId }) => [
        { type: "Users", id: `DEPARTMENT-${departmentId}` },
        ...(result?.users?.map((user) => ({ type: "Users", id: user._id })) ||
          []),
      ],
    }),
    getUserProfile: builder.query({
      query: ({ departmentId, userId, currentDate }) => ({
        url: `/users/department/${departmentId}/user/${userId}/profile`,
        params: { currentDate },
      }),
      providesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
      ],
    }),
  }),
});

export const { useGetUsersQuery, useGetUserProfileQuery } = userApiSlice;
