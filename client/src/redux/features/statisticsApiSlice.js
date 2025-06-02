import { apiSlice } from "./apiSlice";

export const statisticsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStatistics: builder.query({
      query: ({ departmentId, currentDate, limit }) => ({
        url: `/statistics/department/${departmentId}/dashboard`,
        params: { currentDate, limit },
      }),
      providesTags: ["Dashboard"],
    }),
  }),
});

export const { useGetStatisticsQuery } = statisticsApiSlice;
