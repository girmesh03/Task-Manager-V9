import { useCallback, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";

import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

import { useSelector } from "react-redux";
import { selectSelectedDepartmentId } from "../redux/features/authSlice";
import { useGetUsersStatQuery } from "../redux/features/userApiSlice";
import { selectFilters } from "../redux/features/filtersSlice";

import MuiDataGrid from "../components/MuiDataGrid";
import CustomDataGridToolbar from "../components/CustomDataGridToolbar";
import { LeaderboardColumns } from "../utils/userColumns";

const Users = () => {
  const departmentId = useSelector(selectSelectedDepartmentId);
  const filters = useSelector(selectFilters);
  const { selectedDate } = filters;

  const [paginationModel, setPaginationModel] = useState({
    page: 0, // MUI DataGrid is 0-indexed for page
    pageSize: 10,
  });

  const {
    data: usersStatData,
    isError,
    error,
    isLoading,
    isFetching,
    // isSuccess,
  } = useGetUsersStatQuery({
    departmentId,
    page: paginationModel.page + 1, // API might be 1-indexed for page
    limit: paginationModel.pageSize,
    currentDate: selectedDate,
  });

  const handlePaginationModelChange = useCallback((newModel) => {
    setPaginationModel(newModel);
  }, []);

  // Memoize rows and rowCount to prevent unnecessary re-renders of DataGrid
  const rows = useMemo(() => usersStatData?.rows || [], [usersStatData?.rows]);
  const rowCount = useMemo(
    () => usersStatData?.rowCount || 0,
    [usersStatData?.rowCount]
  );

  if (isError) return <Navigate to="/error" state={{ error }} replace />;

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 0.5, sm: 2 }, my: 2 }}>
      <Typography component="h4" variant="h6">
        Users Leaderboard
      </Typography>
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12 }}>
          <MuiDataGrid
            rows={rows}
            columns={LeaderboardColumns}
            loading={isLoading || isFetching}
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            selectionModel={{ type: "include", ids: [] }}
            onRowSelectionModelChange={() => null}
            onUpdate={() => {}}
            onDelete={() => {}}
            slug="leaderboard"
            components={{ toolbar: CustomDataGridToolbar }}
            componentsProps={{
              toolbar: {
                items: rows,
                selectedItemIds: { type: "include", ids: [] },
                slug: "Leaderboard",
                onCreate: () => null,
              },
            }}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default Users;
