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

      providesTags: (result) =>
        result?.users?.length
          ? [
              { type: "Users", id: "LIST" },
              ...result.users.map(({ _id }) => ({ type: "Users", id: _id })),
            ]
          : [{ type: "Users", id: "LIST" }],
    }),
  }),
});

export const { useGetUsersQuery } = userApiSlice;
