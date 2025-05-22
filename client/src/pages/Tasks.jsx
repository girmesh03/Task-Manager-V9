import { useState, useEffect, useCallback } from "react";
// import { Navigate } from "react-router";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Pagination from "@mui/material/Pagination";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid2";
import AddIcon from "@mui/icons-material/Add";

import { useSelector } from "react-redux";
import { useGetTasksQuery } from "../redux/features/taskApiSlice";
import { selectSelectedDepartmentId } from "../redux/features/authSlice";

import useAuth from "../hooks/useAuth";

import TaskList from "../components/TaskList";
import FilterMenuSelect from "../components/FilterMenuSelect";
import CreateUpdateTask from "../components/CreateUpdateTask";
import {
  LoadingBackdrop,
  LoadingFallback,
} from "../components/LoadingFallback";

import { statusTypes } from "../utils/constants";

const Tasks = () => {
  const departmentId = useSelector(selectSelectedDepartmentId);
  const { isPrivilegedUser } = useAuth();

  const [state, setState] = useState({
    isDialogOpen: false,
    selectedTask: null,
    page: 1,
    status: "",
  });

  const {
    data = {},
    // isError,
    // error,
    isLoading,
    isFetching,
    isSuccess,
  } = useGetTasksQuery(
    {
      departmentId,
      page: state.page,
      status: state.status,
      limit: 10,
    },
    { refetchOnMountOrArgChange: true }
  );

  const { tasks = [], pagination: { totalPages = 1 } = {} } = data;

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      page: 1,
      status: "",
    }));
  }, [departmentId]);

  const handlePageChange = (_, value) => {
    setState((prev) => ({ ...prev, page: value }));
  };

  const handleStatusSelect = useCallback((newStatus) => {
    setState((prev) => ({
      ...prev,
      status: newStatus,
      page: 1,
    }));
  }, []);

  if (isLoading) return <LoadingFallback />;
  // if (isError) return <Navigate to="/error" state={{ error }} replace />;

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
          disabled={!isPrivilegedUser}
          startIcon={<AddIcon />}
          onClick={() => setState((prev) => ({ ...prev, isDialogOpen: true }))}
          sx={{
            minWidth: 140,
            bgcolor: "success.main",
            "&:disabled": { bgcolor: "action.disabledBackground" },
          }}
        >
          Add Task
        </Button>

        <FilterMenuSelect
          options={statusTypes}
          onSelect={handleStatusSelect}
          selectedItem={state.status}
          buttonLabel="Status"
        />
      </Stack>

      {isSuccess && tasks.length > 0 ? (
        <>
          <TaskList
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
        <Stack
          justifyContent="center"
          alignItems="center"
          sx={{ height: "75vh" }}
        >
          <Typography variant="h6" color="text.secondary">
            No tasks found
          </Typography>
        </Stack>
      )}

      {isFetching && <LoadingBackdrop open={isFetching} />}

      {state.isDialogOpen && (
        <CreateUpdateTask
          open={state.isDialogOpen}
          handleClose={() =>
            setState((prev) => ({
              ...prev,
              isDialogOpen: false,
              selectedTask: null,
            }))
          }
          title={state.selectedTask ? "Update Task" : "Create Task"}
          taskToBeUpdated={state.selectedTask}
        />
      )}
    </Container>
  );
};

export default Tasks;
