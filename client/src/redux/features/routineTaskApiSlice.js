import { apiSlice } from "./apiSlice";

export const routineTaskApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getRoutineTasks: builder.query({
      query: ({ departmentId, page = 1, limit = 10 }) => ({
        url: `/routine-tasks/department/${departmentId}`,
        params: { page, limit },
      }),
      transformResponse: (response) => ({
        tasks: response.tasks,
        pagination: response.pagination,
      }),
      providesTags: (result, error, { departmentId }) => [
        { type: "RoutineTasks", id: `DEPARTMENT-${departmentId}` },
        ...(result?.tasks?.map((task) => ({
          type: "RoutineTasks",
          id: task._id,
        })) || []),
      ],
    }),
    getRoutineTask: builder.query({
      query: ({ departmentId, taskId }) => ({
        url: `/routine-tasks/department/${departmentId}/task/${taskId}`,
      }),
      transformResponse: (response) => ({
        task: response.task,
      }),
      providesTags: (result, error, { taskId }) => [
        { type: "RoutineTasks", id: taskId },
      ],
    }),
    createRoutineTask: builder.mutation({
      query: ({ departmentId, task }) => ({
        url: `/routine-tasks/department/${departmentId}`,
        method: "POST",
        body: task,
      }),
      invalidatesTags: (result, error, { departmentId }) => [
        { type: "RoutineTasks", id: `DEPARTMENT-${departmentId}` },
        "Dashboard",
      ],
    }),
    updateRoutineTask: builder.mutation({
      query: ({ departmentId, taskId, task }) => ({
        url: `/routine-tasks/department/${departmentId}/task/${taskId}`,
        method: "PUT",
        body: task,
      }),
      invalidatesTags: (result, error, { departmentId, taskId }) => [
        { type: "RoutineTasks", id: `DEPARTMENT-${departmentId}` },
        { type: "RoutineTasks", id: taskId },
        "Dashboard",
      ],
    }),
    deleteRoutineTask: builder.mutation({
      query: ({ departmentId, taskId }) => ({
        url: `/routine-tasks/department/${departmentId}/task/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { departmentId, taskId }) => [
        { type: "RoutineTasks", id: `DEPARTMENT-${departmentId}` },
        { type: "RoutineTasks", id: taskId },
        "Dashboard",
      ],
      async onQueryStarted(
        { departmentId, taskId },
        { dispatch, queryFulfilled }
      ) {
        try {
          await queryFulfilled;

          dispatch(
            routineTaskApiSlice.util.updateQueryData(
              "getRoutineTasks",
              { departmentId },
              (draft) => {
                draft.tasks = draft.tasks.filter((task) => task._id !== taskId);
              }
            )
          );
        } catch (error) {
          // console.log(error);
          return error;
        }
      },
    }),
  }),
});

export const {
  useGetRoutineTasksQuery,
  useGetRoutineTaskQuery,
  useCreateRoutineTaskMutation,
  useUpdateRoutineTaskMutation,
  useDeleteRoutineTaskMutation,
} = routineTaskApiSlice;
