import { apiSlice } from "./apiSlice";

export const taskApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query({
      query: ({ departmentId, page = 1, limit = 10, status }) => ({
        url: `/tasks/department/${departmentId}`,
        params: { page, limit, status },
      }),
      transformResponse: (response) => ({
        tasks: response.tasks,
        pagination: response.pagination,
      }),
      providesTags: (result, error, { departmentId }) => [
        { type: "Tasks", id: `DEPARTMENT-${departmentId}` },
        ...(result?.tasks?.map((task) => ({ type: "Tasks", id: task._id })) ||
          []),
      ],
    }),

    getTaskDetails: builder.query({
      query: ({ departmentId, taskId }) => ({
        url: `/tasks/department/${departmentId}/task/${taskId}`,
      }),
      transformResponse: (response) => ({
        task: response.task,
        activities: response.activities,
      }),
      providesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
      ],
    }),

    createTask: builder.mutation({
      query: ({ departmentId, taskData }) => ({
        url: `/tasks/department/${departmentId}`,
        method: "POST",
        body: taskData,
      }),
      invalidatesTags: (result, error, { departmentId }) => [
        { type: "Tasks", id: `DEPARTMENT-${departmentId}` },
        "Dashboard",
      ],
    }),

    updateTask: builder.mutation({
      query: ({ departmentId, taskId, taskData }) => ({
        url: `/tasks/department/${departmentId}/task/${taskId}`,
        method: "PUT",
        body: taskData,
      }),
      invalidatesTags: (result, error, { departmentId, taskId }) => [
        { type: "Tasks", id: `DEPARTMENT-${departmentId}` },
        { type: "Tasks", id: taskId },
        "Dashboard",
      ],
    }),

    deleteTask: builder.mutation({
      query: ({ departmentId, taskId }) => ({
        url: `/tasks/department/${departmentId}/task/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { departmentId, taskId }) => [
        { type: "Tasks", id: `DEPARTMENT-${departmentId}` },
        { type: "Tasks", id: taskId },
        "Dashboard",
      ],
      async onQueryStarted(
        { departmentId, taskId },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          taskApiSlice.util.updateQueryData(
            "getTasks",
            { departmentId },
            (draft) => {
              draft.tasks = draft.tasks.filter((task) => task._id !== taskId);
            }
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    createTaskActivity: builder.mutation({
      query: ({ taskId, activityData }) => ({
        url: `/tasks/${taskId}/activities`,
        method: "POST",
        body: activityData,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
        "Dashboard",
      ],

      async onQueryStarted(
        { taskId, activityData },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          taskApiSlice.util.updateQueryData(
            "getTaskDetails",
            { taskId },
            (draft) => {
              draft.activities.push(activityData);
            }
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    deleteTaskActivity: builder.mutation({
      query: ({ taskId, activityId }) => ({
        url: `/tasks/${taskId}/activities/${activityId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
        "Dashboard",
      ],
      async onQueryStarted(
        { taskId, activityId },
        { dispatch, queryFulfilled }
      ) {
        const patchResult = dispatch(
          taskApiSlice.util.updateQueryData(
            "getTaskDetails",
            { taskId },
            (draft) => {
              draft.activities = draft.activities.filter(
                (activity) => activity._id !== activityId
              );
            }
          )
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useGetTasksQuery,
  useLazyGetTasksQuery,
  useGetTaskDetailsQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useCreateTaskActivityMutation,
  useDeleteTaskActivityMutation,
} = taskApiSlice;
