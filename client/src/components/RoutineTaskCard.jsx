import { useState } from "react";
import { useNavigate } from "react-router";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import dayjs from "dayjs";

import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import CardActions from "@mui/material/CardActions";
import Avatar from "@mui/material/Avatar";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";

import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import Tooltip from "@mui/material/Tooltip";
import EditIcon from "@mui/icons-material/Edit";

import { useDeleteRoutineTaskMutation } from "../redux/features/routineTaskApiSlice";

import ConfirmDialog from "./ConfirmDialog";

const RoutineTaskCard = ({ task, onEdit }) => {
  const navigate = useNavigate();

  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [deleteRoutineTask, { isLoading: isDeleting }] =
    useDeleteRoutineTaskMutation();

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    try {
      const { message } = await deleteRoutineTask({
        departmentId: selectedTask.department._id,
        taskId: selectedTask._id,
      }).unwrap();
      toast.success(message || "Task deleted successfully");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete task");
    }
  };

  return (
    <>
      <Card variant="outlined" sx={{ height: "100%" }}>
        <CardHeader
          avatar={
            <Avatar src={task.performedBy?.profilePicture?.url}>
              {task.performedBy?.fullName.charAt(0)}
            </Avatar>
          }
          title={task.performedBy.fullName}
          subheader={task.performedBy.position}
        />
        <CardContent sx={{ mt: 2 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="body1" color="text.secondary">
              Department: {task.department.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {dayjs(task.date).format("MMMM DD, YYYY")}
            </Typography>
          </Stack>
        </CardContent>
        <CardActions sx={{ justifyContent: "flex-end" }}>
          <Tooltip title="Delete Task" arrow placement="top">
            <IconButton
              aria-label="delete"
              size="small"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setSelectedTask(task);
                setConfirmOpen(true);
              }}
              sx={{ border: "none" }}
            >
              {isDeleting ? (
                <CircularProgress size={20} color="secondary" />
              ) : (
                <DeleteIcon color="error" />
              )}
            </IconButton>
          </Tooltip>
          <Tooltip title="Update Task" arrow placement="top">
            <IconButton
              aria-label="view details"
              size="small"
              onClick={() => navigate(`/routine-tasks/${task._id}/details`)}
              sx={{ border: "none" }}
            >
              <VisibilityIcon color="primary" />
            </IconButton>
          </Tooltip>

          <Tooltip title="Update Task" arrow placement="top">
            <IconButton
              aria-label="edit"
              size="small"
              onClick={() => onEdit(task)}
              sx={{ border: "none" }}
            >
              <EditIcon fontSize="small" sx={{ color: "secondary.main" }} />
            </IconButton>
          </Tooltip>
        </CardActions>
      </Card>
      <ConfirmDialog
        open={isConfirmOpen}
        title="Delete Task"
        description="Are you sure you want to delete this task?"
        onClose={() => {
          setSelectedTask(null);
          setConfirmOpen(false);
        }}
        onConfirm={async () => {
          setConfirmOpen(false);
          await handleDeleteTask();
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};

RoutineTaskCard.propTypes = {
  task: PropTypes.object.isRequired,
};

export default RoutineTaskCard;
