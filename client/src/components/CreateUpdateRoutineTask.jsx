import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useForm, useFieldArray } from "react-hook-form";
import { toast } from "react-toastify";

import dayjs from "dayjs";

import Grid from "@mui/material/Grid2";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { useSelector } from "react-redux";
import { selectSelectedDepartmentId } from "../redux/features/authSlice";
import {
  useCreateRoutineTaskMutation,
  useUpdateRoutineTaskMutation,
} from "../redux/features/routineTaskApiSlice";

import MuiFormDialog from "./MuiFormDialog";
import MuiTextField from "./MuiTextField";
import MuiMobileDatePicker from "./MuiMobileDatePicker";

const CreateUpdateRoutineTask = ({
  open,
  handleClose,
  title,
  taskToBeUpdated,
}) => {
  const [editingIndex, setEditingIndex] = useState(-1);
  const departmentId = useSelector(selectSelectedDepartmentId);

  const [createRoutineTask, { isLoading: isSubmitting }] =
    useCreateRoutineTaskMutation();
  const [updateRoutineTask, { isLoading: isUpdating }] =
    useUpdateRoutineTaskMutation();

  const isToUpdate = !!taskToBeUpdated && title === "Update Routine Task";

  const {
    handleSubmit,
    control,
    reset,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    defaultValues: {
      date: dayjs().format("YYYY-MM-DD"),
      performedTasks: [],
      description: "",
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control,
    name: "performedTasks",
  });

  useEffect(() => {
    if (isToUpdate && taskToBeUpdated.performedTasks) {
      reset({
        date: taskToBeUpdated.date,
        performedTasks: taskToBeUpdated.performedTasks,
        description: "",
      });
    } else if (!isToUpdate) {
      reset({
        date: dayjs().format("YYYY-MM-DD"),
        performedTasks: [],
        description: "",
      });
    }
    setEditingIndex(-1);
  }, [taskToBeUpdated, isToUpdate, reset]);

  const allCompleted = fields.length > 0 && fields.every((t) => t.isCompleted);
  const someCompleted = fields.some((t) => t.isCompleted);

  const handleAddOrUpdateTask = () => {
    const desc = getValues("description").trim();
    if (!desc) return;

    if (editingIndex !== -1) {
      update(editingIndex, {
        ...fields[editingIndex],
        description: desc,
      });
    } else {
      append({ description: desc, isCompleted: false });
    }

    // Clear description errors when an item is added
    if (fields.length >= 0) {
      clearErrors("description");
    }

    setValue("description", "");
    setEditingIndex(-1);
  };

  const onSubmit = async (formData) => {
    if (fields.length === 0) {
      // Set a validation error on the description field
      setError("description", {
        type: "manual",
        message: "At least one task is required",
      });
      return;
    }

    try {
      const payload = isToUpdate
        ? {
            performedTasks: fields,
          }
        : {
            performedTasks: fields,
            date: formData.date,
          };

      const { message } = isToUpdate
        ? await updateRoutineTask({
            departmentId,
            taskId: taskToBeUpdated._id,
            task: payload,
          }).unwrap()
        : await createRoutineTask({ departmentId, task: payload }).unwrap();

      toast.success(message);
      reset();
      handleClose();
    } catch (error) {
      toast.error(error?.data?.message || "Something went wrong!");
    }
  };

  return (
    <MuiFormDialog
      title={title}
      open={open}
      handleClose={handleClose}
      handleSubmit={() => handleSubmit(onSubmit)}
      isSubmitting={isSubmitting || isUpdating}
    >
      <Grid container spacing={1} sx={{ my: 2 }}>
        <Grid size={{ xs: 6 }} sx={{ ml: "auto" }}>
          <MuiMobileDatePicker
            name="date"
            type="date"
            control={control}
            rules={{
              required: "Due date is required",
              validate: (value) =>
                value > dayjs().format("YYYY-MM-DD")
                  ? "Date cannot be in the future"
                  : true,
            }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Stack spacing={1}>
            <FormControl fullWidth>
              <FormLabel htmlFor="description">Task Description</FormLabel>
              <MuiTextField
                name="description"
                placeholder="Enter task description"
                control={control}
                rules={{
                  validate: () =>
                    fields.length > 0 || "At least one task is required",
                }}
                error={!!errors.description}
                helperText={errors.description?.message}
                multiline
                rows={3}
              />
            </FormControl>

            <Button
              size="small"
              color={editingIndex !== -1 ? "warning" : "success"}
              variant="contained"
              startIcon={editingIndex !== -1 ? <EditIcon /> : <AddIcon />}
              onClick={handleAddOrUpdateTask}
              sx={{ alignSelf: "flex-end" }}
            >
              {editingIndex !== -1 ? "Update Task" : "Add Task"}
            </Button>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12 }}>
          <Divider textAlign="left">
            <Typography variant="caption">Performed Tasks</Typography>
          </Divider>
        </Grid>

        {fields.length > 1 && (
          <Grid size={{ xs: 12 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Checkbox
                checked={allCompleted}
                indeterminate={!allCompleted && someCompleted}
                onChange={(e) =>
                  fields.forEach((_, idx) =>
                    update(idx, {
                      ...fields[idx],
                      isCompleted: e.target.checked,
                    })
                  )
                }
                size="small"
              />
              <Typography variant="caption">Set All Completed</Typography>
            </Stack>
          </Grid>
        )}

        <Grid container size={{ xs: 12 }} spacing={2}>
          {fields.length > 0 ? (
            fields.map((item, index) => (
              <Grid size={{ xs: 12 }} key={item.id}>
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    flexGrow: 1,
                    overflow: "hidden",
                    whiteSpace: "break-spaces",
                    textOverflow: "break-all",
                    wordWrap: "anywhere",
                  }}
                >
                  <Checkbox
                    checked={item.isCompleted}
                    onChange={(e) =>
                      update(index, {
                        ...item,
                        isCompleted: e.target.checked,
                      })
                    }
                    size="small"
                  />
                  <Typography variant="body2" sx={{ flexGrow: 1 }}>
                    {item.description}
                  </Typography>
                  <DeleteIcon
                    fontSize="small"
                    onClick={() => remove(index)}
                    sx={{ color: "error.main", cursor: "pointer" }}
                  />
                  <EditIcon
                    fontSize="small"
                    onClick={() => {
                      setValue("description", item.description);
                      setEditingIndex(index);
                    }}
                    sx={{ color: "primary.main", cursor: "pointer" }}
                  />
                </Stack>
              </Grid>
            ))
          ) : (
            <Grid
              size={{ xs: 12 }}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: 100,
              }}
            >
              <Typography variant="body2">No tasks added yet</Typography>
            </Grid>
          )}
        </Grid>
      </Grid>
    </MuiFormDialog>
  );
};

CreateUpdateRoutineTask.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  taskToBeUpdated: PropTypes.object,
};

export default CreateUpdateRoutineTask;
