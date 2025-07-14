import { useCallback, useMemo, useState } from "react";
import { Navigate } from "react-router";
import PropTypes from "prop-types";

import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";

import { useSelector } from "react-redux";
import { useGetTaskReportsQuery } from "../redux/features/reportApiSlice";
import { selectFilters } from "../redux/features/filtersSlice";

import MuiDataGrid from "./MuiDataGrid";
import CustomDataGridToolbar from "./CustomDataGridToolbar";
import { TaskColumns } from "../utils/reportColumns";

const TaskReportGrid = ({ departmentId }) => {
  const filters = useSelector(selectFilters);
  const { selectedDate } = filters;

  const [paginationModel, setPaginationModel] = useState({
    page: 0, // MUI DataGrid is 0-indexed for page
    pageSize: 10,
  });

  const [selectionModel, setSelectionModel] = useState({
    type: "include",
    ids: [],
  });

  const {
    data: taskData,
    isError,
    error,
    isLoading,
    isFetching,
    // isSuccess,
  } = useGetTaskReportsQuery(
    {
      departmentId,
      page: paginationModel.page + 1, // API might be 1-indexed for page
      limit: paginationModel.pageSize,
      currentDate: selectedDate,
      // status: "",
      // taskType: "",
    },
    { refetchOnMountOrArgChange: true }
  );

  const handlePaginationModelChange = useCallback((newModel) => {
    setPaginationModel(newModel);
  }, []);

  const handleRowSelectionModelChange = useCallback((newSelectionModel) => {
    setSelectionModel(newSelectionModel);
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
            columns={TaskColumns}
            loading={isLoading || isFetching}
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            selectionModel={selectionModel}
            onRowSelectionModelChange={handleRowSelectionModelChange}
            onUpdate={() => {}}
            onDelete={() => {}}
            slug="task"
            components={{ toolbar: CustomDataGridToolbar }}
            componentsProps={{
              toolbar: {
                items: rows,
                selectedItemIds: selectionModel,
                slug: "Task",
                onCreate: () => null,
              },
            }}
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
