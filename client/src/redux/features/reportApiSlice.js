import { apiSlice } from "./apiSlice";

export const reportApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTaskReports: builder.query({
      query: ({
        departmentId,
        page = 1,
        limit = 10,
        status,
        taskType,
        currentDate,
      }) => ({
        url: `/reports/department/${departmentId}/tasks`,
        params: {
          page,
          limit,
          status,
          taskType,
          currentDate,
        },
      }),
      providesTags: (result, error, args) => [
        { type: "Report", id: `TASK-${JSON.stringify(args)}` },
      ],
    }),
    getRoutineTaskReports: builder.query({
      query: ({ departmentId, page = 1, limit = 10, currentDate }) => ({
        url: `/reports/department/${departmentId}/routines`,
        params: {
          page,
          limit,
          currentDate,
        },
      }),
      providesTags: (result, error, args) => [
        { type: "Report", id: `ROUTINE-${JSON.stringify(args)}` },
      ],
    }),
  }),
});

export const { useGetTaskReportsQuery, useGetRoutineTaskReportsQuery } =
  reportApiSlice;
