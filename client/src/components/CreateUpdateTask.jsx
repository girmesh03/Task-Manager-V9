import { useEffect } from "react";
import { Navigate } from "react-router";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import dayjs from "dayjs";

import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid2";

import { useSelector } from "react-redux";
import { useGetUsersQuery } from "../redux/features/userApiSlice";
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
} from "../redux/features/taskApiSlice";
import { selectSelectedDepartmentId } from "../redux/features/authSlice";

import MuiFormDialog from "./MuiFormDialog";
import MuiTextField from "./MuiTextField";
import DropdownMenu from "./DropdownMenu";
import MuiAutocomplete from "./MuiAutocomplete";
import MuiMobileDatePicker from "./MuiMobileDatePicker";
import { LoadingFallback } from "./LoadingFallback";

import { priorityTypes, statusTypes } from "../utils/constants";

// const validTransitions = {
//   "To Do": ["In Progress", "Pending"],
//   "In Progress": ["Completed", "Pending"],
//   Completed: ["Pending"],
//   Pending: ["In Progress", "Completed"],
// };

const CreateUpdateTask = ({ open, handleClose, title, taskToBeUpdated }) => {
  console.log("create update task");
  const departmentId = useSelector(selectSelectedDepartmentId);

  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();

  const isToUpdate = taskToBeUpdated && title === "Update Task";

  const {
    data = {},
    isError,
    error,
    isLoading,
    // isFetching,
    // isSuccess,
  } = useGetUsersQuery(
    {
      departmentId,
      role: "User",
      page: 1,
      limit: 10,
    },
    { skip: !open }
  );

  const { users = [] } = data;

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      location: "",
      dueDate: dayjs().format("YYYY-MM-DD"),
      priority: "Medium",
      assignedTo: [],
    },
  });

  const onSubmit = async (formData) => {
    try {
      let response = null;
      if (taskToBeUpdated && title === "Update Task") {
        response = await updateTask({
          departmentId,
          taskId: taskToBeUpdated._id,
          taskData: formData,
        }).unwrap();
      }

      if (!taskToBeUpdated && title === "Create Task") {
        response = await createTask({
          departmentId,
          taskData: formData,
        }).unwrap();
      }

      console.log("response", response);
      toast.success(response.message);
      reset();
      handleClose();
    } catch (error) {
      toast.error(error.data.message);
    }
  };

  useEffect(() => {
    if (!taskToBeUpdated) return;

    if (taskToBeUpdated) {
      reset({
        ...taskToBeUpdated,
        assignedTo: taskToBeUpdated.assignedTo.map((user) => user._id),
      });
    }
  }, [taskToBeUpdated, reset]);

  if (isError) return <Navigate to="/error" state={{ error }} replace />;

  return (
    <MuiFormDialog
      title={title}
      open={open}
      handleClose={handleClose}
      handleSubmit={() => handleSubmit(onSubmit)}
      isSubmitting={isSubmitting}
    >
      {isLoading ? (
        <LoadingFallback height="50vh" />
      ) : (
        <Grid container spacing={2} sx={{ my: 2 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <FormLabel htmlFor="title">Title</FormLabel>
              <MuiTextField
                name="title"
                control={control}
                rules={{ required: "Title is required" }}
                placeholder="Eg. Inspect Refrigerators"
              />
            </FormControl>
          </Grid>

          {/* dueDate */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Stack direction="column" justifyContent="center" spacing={1}>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Date
              </Typography>
              <MuiMobileDatePicker
                name="dueDate"
                type="date"
                control={control}
                rules={{ required: "Due date is required" }}
              />
            </Stack>
          </Grid>

          {/* assignedTo */}
          <Grid size={{ xs: 12, sm: isToUpdate ? 7 : 12 }}>
            <Stack direction="column" justifyContent="center" spacing={1}>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Assigned To
              </Typography>
              <MuiAutocomplete
                name="assignedTo"
                control={control}
                options={users}
                rules={{ required: "At least one user must be assigned" }}
                fullWidth
              />
            </Stack>
          </Grid>

          {/* status */}
          {isToUpdate && (
            <Grid size={{ xs: 12, sm: 5 }}>
              <Typography
                variant="body1"
                sx={{ mb: 1, color: "text.secondary" }}
              >
                Status To
              </Typography>
              <DropdownMenu
                name="status"
                control={control}
                options={statusTypes}
                // rules={{
                //   validate: {
                //     isValidTransition: (value) =>
                //       !value ||
                //       validTransitions[taskToBeUpdated?.status]?.includes(
                //         value
                //       ) ||
                //       "Invalid status transition",
                //     validStatus: (value) =>
                //       value !== taskToBeUpdated?.status ||
                //       "Cannot transition to the same status",
                //   },
                // }}
              />
            </Grid>
          )}

          {/* priority */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Stack direction="column" justifyContent="center" spacing={1}>
              <Typography variant="body1" sx={{ color: "text.secondary" }}>
                Priority
              </Typography>
              <DropdownMenu
                name="priority"
                control={control}
                options={priorityTypes}
                rules={{ required: "Priority is required" }}
              />
            </Stack>
          </Grid>

          {/* location */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth>
              <FormLabel htmlFor="location">Location</FormLabel>
              <MuiTextField
                name="location"
                control={control}
                rules={{ required: "Location is required" }}
                placeholder="Eg. Main Kitchen"
              />
            </FormControl>
          </Grid>

          {/* description */}
          <Grid size={{ xs: 12 }}>
            <FormControl fullWidth>
              <FormLabel htmlFor="description">Description</FormLabel>
              <MuiTextField
                name="description"
                placeholder="Eg. Check and repair refrigerators in the main kitchen."
                control={control}
                rules={{ required: "Description is required" }}
                multiline
                rows={3}
              />
            </FormControl>
          </Grid>
        </Grid>
      )}
    </MuiFormDialog>
  );
};

CreateUpdateTask.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  taskToBeUpdated: PropTypes.object,
};

export default CreateUpdateTask;
