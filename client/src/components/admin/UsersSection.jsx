import { useCallback, memo, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "react-toastify";

import Grid from "@mui/material/Grid";

import { useSelector } from "react-redux";
import { selectSelectedDepartmentId } from "../../redux/features/authSlice";
import {
  useDeleteUserMutation,
  useGetUsersQuery,
} from "../../redux/features/userApiSlice";
import { selectFilters } from "../../redux/features/filtersSlice";

import MuiDataGrid from "../../components/MuiDataGrid";
import CustomDataGridToolbar from "../../components/CustomDataGridToolbar";
import CreateUpdateUser from "./CreateUpdateUser";

import { UserColumns } from "../../utils/userColumns";

const UsersSection = memo(() => {
  const departmentId = useSelector(selectSelectedDepartmentId);
  const filters = useSelector(selectFilters);
  const { selectedDate } = filters;

  const [selectedUser, setSelectedUser] = useState(null);
  const [openForm, setOpenForm] = useState(false);

  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const {
    data: usersStatData,
    isError,
    error,
    isLoading,
    isFetching,
    // isSuccess,
  } = useGetUsersQuery(
    {
      departmentId,
      page: paginationModel.page + 1, // API might be 1-indexed for page
      limit: paginationModel.pageSize,
      currentDate: selectedDate,
    },
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const handlePaginationModelChange = useCallback((newModel) => {
    setPaginationModel(newModel);
  }, []);

  const handleDeptDelete = useCallback(
    async (user) => {
      if (!user) return;
      try {
        const { message } = await deleteUser({
          departmentId,
          userId: user._id,
        }).unwrap();
        toast.success(message);
      } catch (error) {
        toast.error(error?.data?.message || "Failed to delete department");
      } finally {
        setSelectedUser(null);
      }
    },
    [deleteUser, departmentId]
  );

  // Memoize rows and rowCount to prevent unnecessary re-renders of DataGrid
  const rows = useMemo(
    () => usersStatData?.users || [],
    [usersStatData?.users]
  );
  const rowCount = useMemo(
    () => usersStatData?.total || 0,
    [usersStatData?.total]
  );

  if (isError) return <Navigate to="/error" state={{ error }} replace />;

  return (
    <>
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12 }}>
          <MuiDataGrid
            rows={rows}
            columns={UserColumns}
            loading={isLoading || isFetching || isDeleting}
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            selectionModel={{ ids: [], type: "include" }}
            onRowSelectionModelChange={() => null}
            onUpdate={(user) => {
              setSelectedUser(user);
              setOpenForm(true);
            }}
            onDelete={(user) => {
              handleDeptDelete(user);
            }}
            slug="user"
            components={{ toolbar: CustomDataGridToolbar }}
            componentsProps={{
              toolbar: {
                items: rows,
                selectedItemIds: { ids: [], type: "include" },
                slug: "User",
                onCreate: () => setOpenForm(true),
              },
            }}
          />
        </Grid>
      </Grid>

      {openForm && (
        <CreateUpdateUser
          open={openForm}
          handleClose={() => {
            setSelectedUser(null);
            setOpenForm(false);
          }}
          title={selectedUser ? "Update User" : "Create New User"}
          selectedUser={selectedUser}
        />
      )}
    </>
  );
});

export default UsersSection;
