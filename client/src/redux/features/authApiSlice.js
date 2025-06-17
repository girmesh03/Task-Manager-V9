// import { apiSlice } from "./apiSlice";

// export const authApiSlice = apiSlice.injectEndpoints({
//   endpoints: (builder) => ({
//     login: builder.mutation({
//       query: (credentials) => ({
//         url: "/auth/login",
//         method: "POST",
//         body: credentials,
//       }),
//       // On successful login, invalidate all cached data for these types
//       invalidatesTags: [
//         { type: "User" },
//         { type: "Department" },
//         { type: "Task" },
//       ],
//     }),
//     logout: builder.mutation({
//       query: () => ({
//         url: "/auth/logout",
//         method: "POST",
//       }),
//       // Clear the entire API cache on logout
//       onQueryStarted: async (arg, { dispatch, queryFulfilled }) => {
//         try {
//           await queryFulfilled;
//           dispatch(apiSlice.util.resetApiState());
//         } catch (err) {
//           // Handle potential errors
//           console.error("Logout failed:", err);
//         }
//       },
//     }),
//     getMe: builder.query({
//       query: () => "/auth/me",
//       providesTags: (result) =>
//         result?.user?._id ? [{ type: "User", id: result.user._id }] : [],
//     }),
//     verifyEmail: builder.mutation({
//       query: ({ token }) => ({
//         url: "/auth/verify-email",
//         method: "POST",
//         body: { token },
//       }),
//     }),
//     forgotPassword: builder.mutation({
//       query: ({ email }) => ({
//         url: "/auth/forgot-password",
//         method: "POST",
//         body: { email },
//       }),
//     }),
//     resetPassword: builder.mutation({
//       query: ({ resetToken, password }) => ({
//         url: `/auth/reset-password/${resetToken}`,
//         method: "POST",
//         body: { password },
//       }),
//     }),
//   }),
// });

// export const {
//   useLoginMutation,
//   useLogoutMutation,
//   useGetMeQuery,
//   useVerifyEmailMutation,
//   useForgotPasswordMutation,
//   useResetPasswordMutation,
// } = authApiSlice;
