import { apiSlice } from "./apiSlice";

export const departmentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAllDepartments: builder.query({
      query: ({ page = 1, limit = 10 } = {}) => ({
        url: "/departments",
        params: { page, limit },
      }),

      transformResponse: (response) => ({
        departments: response.departments,
        pagination: response.pagination,
      }),

      providesTags: (result) => [
        { type: "Departments", id: "LIST" },
        ...(result?.departments?.map((department) => ({
          type: "Departments",
          id: department._id,
        })) || []),
      ],
    }),

    createDepartment: builder.mutation({
      query: ({ departmentData }) => ({
        url: "/departments",
        method: "POST",
        body: departmentData,
      }),
      invalidatesTags: [{ type: "Departments", id: "LIST" }],
    }),

    getDepartment: builder.query({
      query: ({ departmentId }) => `/departments/${departmentId}`,

      providesTags: (result, error, { departmentId }) => [
        { type: "Departments", id: departmentId },
      ],

      transformResponse: (response) => response.department,
    }),

    updateDepartment: builder.mutation({
      query: ({ departmentId, updateData }) => ({
        url: `/departments/${departmentId}`,
        method: "PUT",
        body: updateData,
      }),

      invalidatesTags: (result, error, { departmentId }) => [
        { type: "Departments", id: departmentId },
        { type: "Departments", id: "LIST" },
        { type: "Departments", id: "MANAGERS_" + departmentId },
      ],
    }),

    deleteDepartment: builder.mutation({
      query: ({ departmentId }) => ({
        url: `/departments/${departmentId}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, { departmentId }) => [
        { type: "Departments", id: departmentId },
        { type: "Departments", id: "LIST" },
        { type: "Departments", id: "MANAGERS_" + departmentId },
      ],
    }),

    getDepartmentManagers: builder.query({
      query: ({ departmentId }) => `/departments/${departmentId}/managers`,
      providesTags: (result, error, { departmentId }) => [
        { type: "Departments", id: "MANAGERS_" + departmentId },
      ],
    }),
  }),
});

export const {
  useGetAllDepartmentsQuery,
  useGetDepartmentQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetDepartmentManagersQuery,
} = departmentApiSlice;
