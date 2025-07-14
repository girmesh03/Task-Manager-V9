import { apiSlice } from "./apiSlice";

export const taskApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTasks: builder.query({
      query: ({ departmentId, page = 1, limit = 10, status, currentDate }) => ({
        url: `/tasks/department/${departmentId}`,
        params: { page, limit, status, currentDate },
      }),
      transformResponse: (response) => ({
        tasks: response.tasks,
        pagination: response.pagination,
      }),
      providesTags: (result, error, { departmentId }) => [
        { type: "Task", id: `DEPARTMENT-${departmentId}` },
        ...(result?.tasks?.map((task) => ({ type: "Task", id: task._id })) ||
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
        { type: "Task", id: taskId },
        { type: "Activity", id: `LIST-${taskId}` }, // List tag for this task's activities
        ...(result?.activities?.map((act) => ({
          type: "Activity",
          id: act._id,
        })) || []),
      ],
    }),

    createTask: builder.mutation({
      query: ({ departmentId, taskData }) => ({
        url: `/tasks/department/${departmentId}`,
        method: "POST",
        body: taskData,
      }),
      invalidatesTags: (result, error, { departmentId }) => [
        { type: "Department", id: departmentId },
        { type: "Task", id: `DEPARTMENT-${departmentId}` },
        { type: "Statistics", id: `DEPARTMENT-${departmentId}` },
        // { type: "Activity", id: `LIST-${result?._id}` }, // Assuming result contains the new task ID
      ],
    }),

    updateTask: builder.mutation({
      query: ({ departmentId, taskId, taskData }) => ({
        url: `/tasks/department/${departmentId}/task/${taskId}`,
        method: "PUT",
        body: taskData,
      }),
      invalidatesTags: (result, error, { departmentId, taskId }) => [
        { type: "Task", id: `DEPARTMENT-${departmentId}` },
        { type: "Task", id: taskId },
        { type: "Statistics", id: `DEPARTMENT-${departmentId}` },
        // { type: "Activity", id: `LIST-${result?._id}` }, // Assuming result contains the new task ID
      ],
    }),

    deleteTask: builder.mutation({
      query: ({ departmentId, taskId }) => ({
        url: `/tasks/department/${departmentId}/task/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { departmentId, taskId }) => [
        { type: "Task", id: `DEPARTMENT-${departmentId}` },
        { type: "Task", id: taskId },
        { type: "Statistics", id: `DEPARTMENT-${departmentId}` },
        // { type: "Activity", id: `LIST-${result?._id}` }, // Assuming result contains the new task ID
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
      invalidatesTags: (result, error, { departmentId, taskId }) => [
        { type: "Task", id: taskId },
        { type: "Activity", id: `LIST-${taskId}` },
        { type: "Statistics", id: `DEPARTMENT-${departmentId}` },
        // { type: "Activity", id: `LIST-${result?._id}` }, // Assuming result contains the new task ID
      ],
      // Optimistic update removed for simplicity and to rely on invalidation
    }),

    deleteTaskActivity: builder.mutation({
      query: ({ taskId, activityId }) => ({
        url: `/tasks/${taskId}/activities/${activityId}`,
        method: "DELETE",
      }),
      invalidatesTags: (
        result,
        error,
        { departmentId, taskId, activityId }
      ) => [
        { type: "Task", id: taskId },
        { type: "Activity", id: `LIST-${taskId}` },
        { type: "Activity", id: activityId },
        { type: "Statistics", id: `DEPARTMENT-${departmentId}` },
        // { type: "Activity", id: `LIST-${result?._id}` }, // Assuming result contains the new task ID
      ],
      // Optimistic update removed for simplicity and to rely on invalidation
    }),
  }),
  // overrideExisting: true,
});

export const {
  useGetTasksQuery,
  useGetTaskDetailsQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useCreateTaskActivityMutation,
  useDeleteTaskActivityMutation,
} = taskApiSlice;
