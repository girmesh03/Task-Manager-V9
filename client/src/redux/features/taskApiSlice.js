import { apiSlice } from "./apiSlice";

export const taskApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query({
      query: ({ departmentId, page, status, limit }) => ({
        url: `/tasks/department/${departmentId}`,
        params: { page, limit, status },
      }),

      transformResponse: (response) => ({
        tasks: response.tasks,
        pagination: response.pagination,
      }),

      providesTags: (result, error, { departmentId }) =>
        result?.tasks?.length
          ? [
              { type: "Tasks", id: `LIST-${departmentId}` },
              ...result.tasks.map(({ _id }) => ({ type: "Tasks", id: _id })),
            ]
          : [{ type: "Tasks", id: `LIST-${departmentId}` }],
    }),

    deleteTask: builder.mutation({
      query: ({ departmentId, taskId }) => ({
        url: `/tasks/department/${departmentId}/task/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { departmentId, taskId }) => [
        { type: "Tasks", id: taskId },
        { type: "Tasks", id: `LIST-${departmentId}` },
      ],
    }),

    updateTask: builder.mutation({
      query: ({ departmentId, taskId, taskData }) => ({
        url: `/tasks/department/${departmentId}/task/${taskId}`,
        method: "PUT",
        body: taskData,
      }),
      invalidatesTags: (result, error, { departmentId, taskId }) => [
        { type: "Tasks", id: taskId },
        { type: "Tasks", id: `LIST-${departmentId}` },
      ],
    }),

    createTask: builder.mutation({
      query: ({ departmentId, taskData }) => ({
        url: `/tasks/department/${departmentId}`,
        method: "POST",
        body: taskData,
      }),

      invalidatesTags: (result, error, { departmentId }) => {
        console.log("departmentId:", departmentId);
        return [{ type: "Tasks", id: `LIST-${departmentId}` }];
      },
    }),
  }),
});

export const {
  useGetTasksQuery,
  useDeleteTaskMutation,
  useUpdateTaskMutation,
  useCreateTaskMutation,
} = taskApiSlice;
