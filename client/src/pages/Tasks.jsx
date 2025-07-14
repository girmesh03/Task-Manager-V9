import { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useForm } from "react-hook-form";

import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Pagination from "@mui/material/Pagination";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import AddIcon from "@mui/icons-material/Add";

import { useSelector } from "react-redux";
import { useGetTasksQuery } from "../redux/features/taskApiSlice";
import { selectSelectedDepartmentId } from "../redux/features/authSlice";

import TaskList from "../components/TaskList";
import FilterMenuSelect from "../components/FilterMenuSelect";
import ConfirmDialog from "../components/ConfirmDialog";
import CreateUpdateTask from "../components/CreateUpdateTask";
import DropdownMenu from "../components/DropdownMenu";
import {
  LoadingBackdrop,
  LoadingFallback,
} from "../components/LoadingFallback";

import { statusTypes, taskCategoryTypes } from "../utils/constants";
import { selectFilters } from "../redux/features/filtersSlice";

const Tasks = () => {
  const departmentId = useSelector(selectSelectedDepartmentId);
  const filters = useSelector(selectFilters);
  const { selectedDate } = filters;

  const [state, setState] = useState({
    isDialogOpen: false,
    isConfirmOpen: false,
    selectedTask: null,
    selectedTaskType: "",
    page: 1,
    status: "",
  });

  const { handleSubmit, control, reset } = useForm({
    defaultValues: { taskType: "" },
  });

  const onSubmit = (data) => {
    setState((prev) => ({
      ...prev,
      isConfirmOpen: false,
      isDialogOpen: true,
      selectedTaskType: data.taskType,
    }));
    reset();
  };

  const {
    data = {},
    isError,
    error,
    isLoading,
    isFetching,
    isSuccess,
  } = useGetTasksQuery(
    {
      departmentId,
      page: state.page,
      status: state.status,
      limit: 10,
      currentDate: selectedDate,
    },
    { refetchOnMountOrArgChange: true }
  );

  const { tasks = [], pagination: { totalPages = 1 } = {} } = data;

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      page: 1,
      status: "",
      selectedTaskType: "",
    }));
    reset();
  }, [departmentId, reset]);

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
          onClick={() => {
            reset();
            setState((prev) => ({ ...prev, isConfirmOpen: true }));
          }}
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

      {/* Confirm Dialog for Selecting Task Type */}
      <ConfirmDialog
        open={state.isConfirmOpen}
        title="Select Task Type"
        onClose={() => {
          setState((prev) => ({
            ...prev,
            isConfirmOpen: false,
            selectedTaskType: "",
          }));
        }}
        onConfirm={handleSubmit(onSubmit)}
        confirmText="Confirm"
        cancelText="Cancel"
      >
        <Box
          component="form"
          noValidate
          autoComplete="off"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ p: 1 }}
        >
          <DropdownMenu
            name="taskType"
            control={control}
            options={taskCategoryTypes}
            rules={{ required: "Task type is required" }}
          />
        </Box>
      </ConfirmDialog>

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
          selectedTaskType={state.selectedTaskType}
        />
      )}
    </Container>
  );
};

export default Tasks;
