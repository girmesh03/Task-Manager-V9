import { apiSlice } from "./apiSlice";

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
        { type: "User", id: `DEPARTMENT-${departmentId}` },
        ...(result?.users?.map(({ _id }) => ({ type: "User", id: _id })) || []),
      ],
    }),

    getUsersStat: builder.query({
      query: ({ departmentId, page, limit, currentDate }) => ({
        url: `/users/department/${departmentId}/statistics`,
        params: { page, limit, currentDate },
      }),
      transformResponse: (response) => {
        return {
          rows: response.rows || [],
          page: response.page,
          pageSize: response.pageSize,
          rowCount: response.rowCount,
        };
      },
      providesTags: (result, error, { departmentId }) => [
        { type: "UserStat", id: `DEPARTMENT-${departmentId}` },
        ...(result?.rows?.map((stat) => ({
          type: "UserStat",
          id: stat?.id || stat?._id,
        })) || []),
      ],
    }),

    getUserProfile: builder.query({
      query: ({ departmentId, userId, currentDate }) => ({
        url: `/users/department/${departmentId}/user/${userId}/profile`,
        params: { currentDate },
      }),
      transformResponse: (response) =>
        response.data || response.user || response,
      providesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
      ],
    }),

    createUser: builder.mutation({
      query: ({ departmentId, userData }) => ({
        url: `/users/department/${departmentId}`,
        method: "POST",
        body: userData,
      }),
      invalidatesTags: (result, error, { departmentId }) => [
        { type: "User", id: `DEPARTMENT-${departmentId}` },
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
        { type: "User", id: `DEPARTMENT-${departmentId}` },
        { type: "UserStat", id: userId },
        { type: "Department", id: "LIST" },
      ],
    }),

    deleteUser: builder.mutation({
      query: ({ departmentId, userId }) => ({
        url: `/users/department/${departmentId}/user/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { departmentId, userId }) => [
        { type: "User", id: userId },
        { type: "User", id: `DEPARTMENT-${departmentId}` },
        { type: "UserStat", id: userId },
        { type: "Department", id: "LIST" },
      ],
    }),

    // user account management
    updateMyDetails: builder.mutation({
      query: ({ userId, userData }) => ({
        url: `/users/${userId}/details`,
        method: "PUT",
        body: userData,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
      ],
    }),

    changeMyPassword: builder.mutation({
      query: ({ userId, passwordData }) => ({
        url: `/users/${userId}/password`,
        method: "PUT",
        body: passwordData,
      }),
    }),

    updateMyProfilePicture: builder.mutation({
      query: ({ userId, pictureData }) => ({
        url: `/users/${userId}/profile-picture`,
        method: "PUT",
        body: pictureData,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
      ],
    }),

    initiateEmailChange: builder.mutation({
      query: ({ userId, emailData }) => ({
        url: `/users/${userId}/initiate-email-change`,
        method: "POST",
        body: emailData,
      }),
    }),

    verifyEmailChange: builder.mutation({
      query: ({ userId, tokenData }) => ({
        url: `/users/${userId}/verify-email-change`,
        method: "POST",
        body: tokenData,
      }),
      invalidatesTags: (result, error, { userId }) => [
        { type: "User", id: userId },
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

  // user account management
  useUpdateMyDetailsMutation,
  useChangeMyPasswordMutation,
  useUpdateMyProfilePictureMutation,
  useInitiateEmailChangeMutation,
  useVerifyEmailChangeMutation,
} = userApiSlice;
