import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";

import { useCreateTaskActivityMutation } from "../redux/features/taskApiSlice";

import MuiTextField from "./MuiTextField";
import DropdownMenu from "./DropdownMenu";
import { statusTypes } from "../utils/constants";

// import { socket } from "../socket";

const validTransitions = {
  "To Do": ["In Progress", "Pending"],
  "In Progress": ["In Progress", "Completed", "Pending"],
  Completed: ["Pending", "In Progress"],
  Pending: ["In Progress", "Completed"],
};

const TaskActivityForm = ({ taskId, taskStatus, taskType, setTabIndex }) => {
  const [createActivity, { isLoading }] = useCreateTaskActivityMutation();

  const { handleSubmit, control, reset } = useForm({
    defaultValues: {
      description: "",
      currentStatus: taskStatus,
      statusChange: validTransitions[taskStatus][0],
      attachments: [],
    },
  });

  const onSubmit = async (data) => {
    try {
      const { message } = await createActivity({
        taskId,
        activityData: {
          description: data.description,
          attachments: data.attachments || [],
          statusChange: {
            from: data.currentStatus,
            to: data.statusChange,
          },
        },
      }).unwrap();

      // socket.on("new-activity", (activity) => {
      //   console.log("New activity received:", activity);
      // });

      toast.success(message || "Activity created successfully");
      reset();
      setTabIndex("2");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to create activity");
    }
  };

  return (
    <Card variant="outlined" sx={{ maxWidth: 500, m: "auto" }}>
      <Stack
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        autoComplete="off"
        spacing={2}
      >
        <Typography
          variant="h6"
          textAlign="center"
          sx={{ pb: 1, borderBottom: "1px solid", borderColor: "divider" }}
        >
          {`${taskType} Activity Form`}
        </Typography>
        <FormControl fullWidth>
          <FormLabel htmlFor="description">Description</FormLabel>
          <MuiTextField
            name="description"
            control={control}
            multiline
            rows={3}
            rules={{
              required: "Description is required",
              maxLength: {
                value: 300,
                message: "Description should not exceed 300 characters",
              },
            }}
          />
        </FormControl>

        <Divider textAlign="left">
          <Typography variant="caption">Optional Status Update</Typography>
        </Divider>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body1" sx={{ mb: 1, color: "text.secondary" }}>
              Status From
            </Typography>
            <MuiTextField name="currentStatus" control={control} disabled />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="body1" sx={{ mb: 1, color: "text.secondary" }}>
              Status To
            </Typography>
            <DropdownMenu
              name="statusChange"
              control={control}
              options={statusTypes.filter((option) =>
                validTransitions[taskStatus].includes(option.label)
              )}
              rules={{
                validate: {
                  isValidTransition: (value) =>
                    !value ||
                    validTransitions[taskStatus]?.includes(value) ||
                    "Invalid status transition",
                },
              }}
            />
          </Grid>
        </Grid>

        <Divider textAlign="left">
          <Typography variant="caption">Optional Upload Attachments</Typography>
        </Divider>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="secondary"
          size="small"
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={20} sx={{ color: "white" }} />
          ) : (
            "Create Activity"
          )}
        </Button>
      </Stack>
    </Card>
  );
};

TaskActivityForm.propTypes = {
  taskId: PropTypes.string.isRequired,
  taskStatus: PropTypes.string.isRequired,
  taskType: PropTypes.string.isRequired,
  setTabIndex: PropTypes.func.isRequired,
};

export default TaskActivityForm;
