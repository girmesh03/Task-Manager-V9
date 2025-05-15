import { apiSlice } from "./apiSlice";

export const departmentApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Create Department (SuperAdmin)
    createDepartment: builder.mutation({
      query: (departmentData) => ({
        url: "/departments",
        method: "POST",
        body: departmentData,
      }),
      invalidatesTags: ["Departments"],
    }),

    // Get All Departments (Paginated), (SuperAdmin/Admin)
    getAllDepartments: builder.query({
      query: ({ page = 1, limit = 10 }) => ({
        url: "/departments",
        params: { page, limit },
      }),
      providesTags: ["Departments"],
      transformResponse: (response) => ({
        departments: response.departments,
        pagination: response.pagination,
      }),
    }),

    // Get Single Department by ID
    getDepartmentById: builder.query({
      query: (departmentId) => `/departments/${departmentId}`,
      providesTags: (result, error, id) => [{ type: "Department", id }],
      transformResponse: (response) => response.department,
    }),

    // Update Department (SuperAdmin)
    updateDepartment: builder.mutation({
      query: ({ departmentId, ...updateData }) => ({
        url: `/departments/${departmentId}`,
        method: "PUT",
        body: updateData,
      }),
      invalidatesTags: (result, error, { departmentId }) => [
        "Departments",
        { type: "Department", id: departmentId },
      ],
    }),

    // Delete Department (SuperAdmin)
    deleteDepartment: builder.mutation({
      query: (departmentId) => ({
        url: `/departments/${departmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Departments"],
    }),

    // Get Department Managers
    getDepartmentManagers: builder.query({
      query: (departmentId) => `/departments/${departmentId}/managers`,
      providesTags: (result, error, id) => [{ type: "DepartmentManagers", id }],
    }),
  }),
  // overrideExisting: false,
});

export const {
  useCreateDepartmentMutation,
  useGetAllDepartmentsQuery,
  useLazyGetAllDepartmentsQuery,
  useGetDepartmentByIdQuery,
  useLazyGetDepartmentByIdQuery,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
  useGetDepartmentManagersQuery,
} = departmentApiSlice;
