import { apiSlice } from "./apiSlice";

export const notificationApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getNotificationStats: builder.query({
      query: () => "/notifications/stats",
      providesTags: [{ type: "Notification", id: "UNREAD_COUNT" }],
    }),

    getNotifications: builder.query({
      query: ({ page = 1, limit = 10, unread }) => ({
        url: "/notifications",
        params: { page, limit, unread },
      }),

      transformResponse: (response) => ({
        notifications: response.notifications,
        pagination: response.pagination,
      }),

      providesTags: (result) => [
        { type: "Notification", id: "LIST" },
        ...(result?.notifications?.map(({ _id }) => ({
          type: "Notification",
          id: _id,
        })) || []),
      ],
    }),

    markAsRead: builder.mutation({
      query: ({ notificationIds }) => ({
        url: "/notifications/read",
        method: "PATCH",
        body: { notificationIds },
      }),
      invalidatesTags: (result, error, { notificationIds }) => [
        ...notificationIds.map((id) => ({ type: "Notification", id })),
        { type: "Notification", id: "LIST" },
        { type: "Notification", id: "UNREAD_COUNT" },
      ],
    }),

    markAllAsRead: builder.mutation({
      query: () => ({
        url: "/notifications/read-all",
        method: "POST",
      }),
      invalidatesTags: [{ type: "Notification" }],
    }),
  }),
});

export const {
  useGetNotificationStatsQuery,
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} = notificationApiSlice;
