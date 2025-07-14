import { useState } from "react";
import { Navigate } from "react-router-dom";

import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Pagination from "@mui/material/Pagination";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";

import { useSelector } from "react-redux";
import { useGetRoutineTasksQuery } from "../redux/features/routineTaskApiSlice";
import { selectSelectedDepartmentId } from "../redux/features/authSlice";
import { selectFilters } from "../redux/features/filtersSlice";

import RoutineTaskList from "../components/RoutineTaskList";
import CreateUpdateRoutineTask from "../components/CreateUpdateRoutineTask";
import {
  LoadingBackdrop,
  LoadingFallback,
} from "../components/LoadingFallback";

const RoutineTasks = () => {
  const departmentId = useSelector(selectSelectedDepartmentId);
  const filters = useSelector(selectFilters);
  const { selectedDate } = filters;

  const [state, setState] = useState({
    isDialogOpen: false,
    selectedTask: null,
    page: 1,
  });

  const {
    data = {},
    isError,
    error,
    isLoading,
    isFetching,
    isSuccess,
  } = useGetRoutineTasksQuery(
    {
      departmentId,
      page: state.page,
      limit: 10,
      currentDate: selectedDate,
    },
    { refetchOnMountOrArgChange: true }
  );

  const { tasks = [], pagination: { totalPages = 1 } = {} } = data;

  const handlePageChange = (_, value) => {
    setState((prev) => ({ ...prev, page: value }));
  };

  if (isLoading) return <LoadingFallback />;
  if (isError) return <Navigate to="/error" state={{ error }} replace />;

  return (
    <Container maxWidth="lg" disableGutters sx={{ p: 2, flexGrow: 1 }}>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2, px: { xs: 0, sm: 1, md: 2 } }}
      >
        <Button
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setState((prev) => ({ ...prev, isDialogOpen: true }))}
          sx={{
            minWidth: 140,
            bgcolor: "success.main",
            "&:disabled": { bgcolor: "action.disabledBackground" },
          }}
        >
          Routine
        </Button>
      </Stack>
      {isSuccess && tasks.length > 0 ? (
        <>
          <RoutineTaskList
            tasks={tasks}
            onEdit={(task) =>
              setState((prev) => ({
                ...prev,
                selectedTask: task,
                isDialogOpen: true,
              }))
            }
          />

          {totalPages > 1 && (
            <Grid container justifyContent="center" sx={{ py: 3 }}>
              <Pagination
                count={totalPages}
                page={state.page}
                onChange={handlePageChange}
                color="primary"
                variant="outlined"
                shape="rounded"
              />
            </Grid>
          )}
        </>
      ) : (
        !isFetching && (
          <Stack
            justifyContent="center"
            alignItems="center"
            sx={{ height: "75vh" }}
          >
            <Typography variant="h6" color="text.secondary">
              No tasks found
            </Typography>
          </Stack>
        )
      )}

      {isFetching && <LoadingBackdrop open={isFetching} />}

      {state.isDialogOpen && (
        <CreateUpdateRoutineTask
          open={state.isDialogOpen}
          handleClose={() =>
            setState((prev) => ({
              ...prev,
              isDialogOpen: false,
              selectedTask: null,
            }))
          }
          title={
            state.selectedTask ? "Update Routine Task" : "Create Routine Task"
          }
          taskToBeUpdated={state.selectedTask}
        />
      )}
    </Container>
  );
};

export default RoutineTasks;
