import { useCallback, useMemo, useState } from "react";
import { Navigate } from "react-router";
import PropTypes from "prop-types";

import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";

import { useSelector } from "react-redux";
import { useGetRoutineTaskReportsQuery } from "../redux/features/reportApiSlice";
import { selectFilters } from "../redux/features/filtersSlice";

import MuiDataGrid from "./MuiDataGrid";
import CustomDataGridToolbar from "./CustomDataGridToolbar";
import { RoutineTaskColumns } from "../utils/reportColumns";

const RoutineTaskReportGrid = ({ departmentId }) => {
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
    data: routineData,
    isError,
    error,
    isLoading,
    isFetching,
    // isSuccess,
  } = useGetRoutineTaskReportsQuery({
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

  const handleRowSelectionModelChange = useCallback((newSelectionModel) => {
    setSelectionModel(newSelectionModel);
  }, []);

  // Memoize rows and rowCount to prevent unnecessary re-renders of DataGrid
  const rows = useMemo(() => routineData?.rows || [], [routineData?.rows]);
  const rowCount = useMemo(
    () => routineData?.rowCount || 0,
    [routineData?.rowCount]
  );

  if (isError) return <Navigate to="/error" state={{ error }} replace />;

  return (
    <Container maxWidth="lg" sx={{ px: { xs: 0.5, sm: 2 }, py: 2 }}>
      <Grid container spacing={2} columns={12}>
        <Grid size={{ xs: 12 }}>
          <MuiDataGrid
            rows={rows}
            columns={RoutineTaskColumns}
            loading={isLoading || isFetching}
            rowCount={rowCount}
            paginationModel={paginationModel}
            onPaginationModelChange={handlePaginationModelChange}
            selectionModel={selectionModel}
            onRowSelectionModelChange={handleRowSelectionModelChange}
            onUpdate={() => {}}
            onDelete={() => {}}
            slug="routine task"
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

RoutineTaskReportGrid.propTypes = {
  departmentId: PropTypes.string.isRequired,
};

export default RoutineTaskReportGrid;
