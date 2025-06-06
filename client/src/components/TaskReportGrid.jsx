import { useCallback, useMemo, useState } from "react";
import { Navigate } from "react-router";
import PropTypes from "prop-types";

import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";

import { useSelector } from "react-redux";
import { useGetTaskReportsQuery } from "../redux/features/reportApiSlice";
import { selectFilters } from "../redux/features/filtersSlice";

import MuiDataGrid from "./MuiDataGrid";
import { TasksColumns } from "../utils/reportColumns";

const TaskReportGrid = ({ departmentId }) => {
  const filters = useSelector(selectFilters);
  const { selectedDate } = filters;

  const [paginationModel, setPaginationModel] = useState({
    page: 0, // MUI DataGrid is 0-indexed for page
    pageSize: 10,
  });

  const {
    data: taskData,
    isError,
    error,
    isLoading,
    isFetching,
    // isSuccess,
  } = useGetTaskReportsQuery({
    departmentId,
    page: paginationModel.page + 1, // API might be 1-indexed for page
    limit: paginationModel.pageSize,
    currentDate: selectedDate,
    // status: "",
    // taskType: "",
  });

  const handlePaginationModelChange = useCallback((newModel) => {
    setPaginationModel(newModel);
  }, []);

  // Memoize rows and rowCount to prevent unnecessary re-renders of DataGrid
  const rows = useMemo(() => taskData?.rows || [], [taskData?.rows]);
  const rowCount = useMemo(() => taskData?.rowCount || 0, [taskData?.rowCount]);

  if (isError) return <Navigate to="/error" state={{ error }} replace />;

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 0.5, sm: 2 }, py: 2 }}>
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12 }}>
          <MuiDataGrid
            rows={rows}
            columns={TasksColumns}
            loading={isLoading || isFetching}
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
          />
        </Grid>
      </Grid>
    </Container>
  );
};

TaskReportGrid.propTypes = {
  departmentId: PropTypes.string.isRequired,
};

export default TaskReportGrid;
