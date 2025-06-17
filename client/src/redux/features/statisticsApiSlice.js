import { apiSlice } from "./apiSlice";

export const statisticsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getStatistics: builder.query({
      query: ({ departmentId, currentDate }) => ({
        url: `/statistics/department/${departmentId}/dashboard`,
        params: { currentDate },
      }),
      providesTags: (result, error, { departmentId }) => [
        { type: "Statistics", id: `DEPARTMENT-${departmentId}` },
      ],
    }),
  }),
});

export const { useGetStatisticsQuery } = statisticsApiSlice;
