import { useCallback, useMemo, useState } from "react";
import { Navigate } from "react-router";
import { toast } from "react-toastify";

import Grid from "@mui/material/Grid2";

import {
  useGetAllDepartmentsQuery,
  useDeleteDepartmentMutation,
} from "../../redux/features/departmentApiSlice";

import MuiDataGrid from "../MuiDataGrid";
import CustomDataGridToolbar from "../CustomDataGridToolbar";
import CreateUpdateDepartmentForm from "./CreateUpdateDepartmentForm";
import ConfirmDialog from "../ConfirmDialog";

import { DepartmentColumns } from "../../utils/departmentColumns";

const DepartmentsSection = () => {
  const [selectedDept, setSelectedDept] = useState(null);
  const [openForm, setOpenForm] = useState(false);

  const [deleteDepartment, { isLoading: isDeleting }] =
    useDeleteDepartmentMutation();

  const [paginationModel, setPaginationModel] = useState({
    page: 0, // MUI DataGrid is 0-indexed for page
    pageSize: 10,
  });

  const [selectionModel, setSelectionModel] = useState({
    type: "include",
    ids: [],
  });

  const {
    data: deptData,
    isError,
    error,
    isLoading,
    isFetching,
    // isSuccess,
  } = useGetAllDepartmentsQuery({
    page: paginationModel.page + 1, // API might be 1-indexed for page
    limit: paginationModel.pageSize,
  });

  const handlePaginationModelChange = useCallback((newModel) => {
    setPaginationModel(newModel);
  }, []);

  const handleRowSelectionModelChange = useCallback((newSelectionModel) => {
    setSelectionModel(newSelectionModel);
  }, []);

  const handleDeptDelete = useCallback(
    async (dept) => {
      if (!dept) return;
      try {
        const { message } = await deleteDepartment({
          departmentId: dept._id,
        }).unwrap();
        toast.success(message);
      } catch (error) {
        toast.error(error?.data?.message || "Failed to delete department");
      } finally {
        setSelectedDept(null);
      }
    },
    [deleteDepartment]
  );

  // Memoize rows and rowCount to prevent unnecessary re-renders of DataGrid
  const rows = useMemo(
    () => deptData?.departments || [],
    [deptData?.departments]
  );
  const rowCount = useMemo(
    () => deptData?.pagination?.total || 0,
    [deptData?.pagination?.total]
  );

  if (isError) return <Navigate to="/error" state={{ error }} replace />;

  return (
    <>
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12 }}>
          <MuiDataGrid
            rows={rows}
            columns={DepartmentColumns}
            loading={isLoading || isFetching || isDeleting}
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            selectionModel={selectionModel}
            onRowSelectionModelChange={handleRowSelectionModelChange}
            onUpdate={(dept) => {
              setSelectedDept(dept);
              setOpenForm(true);
            }}
            onDelete={(dept) => {
              handleDeptDelete(dept);
            }}
            slug="department"
            components={{ toolbar: CustomDataGridToolbar }}
            componentsProps={{
              toolbar: {
                items: rows,
                selectedItemIds: selectionModel,
                slug: "Department",
                onCreate: () => setOpenForm(true),
              },
            }}
          />
        </Grid>
      </Grid>

      {openForm && (
        <CreateUpdateDepartmentForm
          open={openForm}
          handleClose={() => {
            setSelectedDept(null);
            setOpenForm(false);
          }}
          title={selectedDept ? "Update Department" : "Create Department"}
          selectedDept={selectedDept}
        />
      )}
    </>
  );
};

export default DepartmentsSection;
