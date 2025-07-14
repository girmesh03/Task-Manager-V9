import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import dayjs from "dayjs";

import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";

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

import { priorityTypes } from "../utils/constants";
import { customDayjs } from "../utils/customDayjs";

const CreateUpdateTask = ({
  open,
  handleClose,
  title,
  taskToBeUpdated,
  selectedTaskType,
}) => {
  const departmentId = useSelector(selectSelectedDepartmentId);

  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();

  const isToUpdate = taskToBeUpdated && title === "Update Task" ? true : false;
  const isProjectTask =
    selectedTaskType === "ProjectTask" ||
    taskToBeUpdated?.taskType === "ProjectTask"
      ? true
      : false;

  const {
    data = {},
    isError,
    error,
    isLoading,
  } = useGetUsersQuery(
    {
      departmentId,
      role: "User",
      page: 1,
      limit: 10,
    },
    {
      skip:
        !open &&
        (selectedTaskType === "ProjectTask" ||
          taskToBeUpdated?.taskType === "ProjectTask"),
    }
  );

  const { users = [] } = data;

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm();

  const onSubmit = async (formData) => {
    try {
      let response;
      const taskData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        dueDate: formData.dueDate,
        priority: formData.priority,
        taskType: formData.taskType,
      };

      if (formData.taskType === "AssignedTask") {
        taskData.assignedTo = formData.assignedTo;
      } else {
        taskData.companyInfo = {
          name: formData.companyName,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
        };
      }

      if (taskToBeUpdated && title === "Update Task") {
        response = await updateTask({
          departmentId,
          taskId: taskToBeUpdated._id,
          taskData,
        }).unwrap();
      }

      if (!taskToBeUpdated && title === "Create Task") {
        response = await createTask({
          departmentId,
          taskData,
        }).unwrap();
      }

      // console.log("response", response);
      toast.success(response.message);
      reset();
      handleClose();
    } catch (error) {
      toast.error(error.data.message);
    }
  };

  useEffect(() => {
    const commonFields = {
      title: "taks title",
      description: "task desc",
      location: "main kitchen",
      dueDate: customDayjs().format("YYYY-MM-DD"),
      priority: "Medium",
      taskType: selectedTaskType,
    };
    if (isToUpdate) {
      if (isProjectTask) {
        reset({
          ...taskToBeUpdated,
          dueDate: customDayjs(taskToBeUpdated.dueDate).format("YYYY-MM-DD"),
          companyName: taskToBeUpdated.companyInfo?.name,
          phoneNumber: taskToBeUpdated.companyInfo?.phoneNumber,
          address: taskToBeUpdated.companyInfo?.address,
        });
      } else {
        reset({
          ...taskToBeUpdated,
          dueDate: customDayjs(taskToBeUpdated.dueDate).format("YYYY-MM-DD"),
          assignedTo: taskToBeUpdated?.assignedTo?.map((user) => user._id),
        });
      }
    } else {
      if (isProjectTask) {
        reset({
          ...commonFields,
          companyName: "",
          phoneNumber: "",
          address: "",
        });
      } else {
        reset({
          ...commonFields,
          assignedTo: [],
        });
      }
    }
  }, [taskToBeUpdated, isProjectTask, isToUpdate, selectedTaskType, reset]);

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
          {/* title */}
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
                rules={{
                  required: "Due date is required",
                  validate: (value) => {
                    if (value <= dayjs().format("YYYY-MM-DD")) {
                      return "Due date must be in the future";
                    } else {
                      return true;
                    }
                  },
                }}
              />
            </Stack>
          </Grid>

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

          {isProjectTask ? (
            <>
              {/* companyName */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="companyName">Company Name</FormLabel>
                  <MuiTextField
                    name="companyName"
                    control={control}
                    rules={{ required: "Company name is required" }}
                    placeholder="Eg. Ries Engineering"
                  />
                </FormControl>
              </Grid>

              {/* phoneNumber */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="phoneNumber">
                    Company Phone Number
                  </FormLabel>
                  <MuiTextField
                    name="phoneNumber"
                    control={control}
                    rules={{
                      required: "Phone number is required",
                      minLength: {
                        value: 10,
                        message: "Phone number must be at least 10 digits",
                      },
                      maxLength: {
                        value: 13,
                        message: "Phone number must be at most 13 digits",
                      },
                    }}
                    placeholder="Eg. +25199999999"
                  />
                </FormControl>
              </Grid>

              {/* address optional */}
              <Grid size={{ xs: 12 }}>
                <FormControl fullWidth>
                  <FormLabel htmlFor="address">Company Address</FormLabel>
                  <MuiTextField
                    name="address"
                    control={control}
                    placeholder="Eg. Addis Ababa, Ethiopia"
                  />
                </FormControl>
              </Grid>
            </>
          ) : (
            <Grid size={{ xs: 12 }}>
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
          )}

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
  selectedTaskType: PropTypes.string.isRequired,
};

export default CreateUpdateTask;
