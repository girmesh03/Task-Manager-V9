import PropTypes from "prop-types";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

import dayjs from "dayjs";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import AvatarGroup from "@mui/material/AvatarGroup";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import CardActions from "@mui/material/CardActions";
import CircularProgress from "@mui/material/CircularProgress";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";

import { useDeleteTaskMutation } from "../redux/features/taskApiSlice";
import useAuth from "../hooks/useAuth";

import { truncateText } from "../utils/helpers";
import ConfirmDialog from "./ConfirmDialog";
import { useState } from "react";
const statusColors = {
  "To Do": "info",
  "In Progress": "warning",
  Completed: "success",
  Pending: "error",
};

const priorityColors = {
  Low: "info",
  Medium: "warning",
  High: "error",
};

const TaskCard = ({ task, onEdit }) => {
  const { isPrivilegedUser } = useAuth();
  const navigate = useNavigate();
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();

  const startDate = dayjs(
    new Date(task.createdAt).toISOString().split("T")[0]
  ).format("MMM DD, YYYY ");
  const endDate = dayjs(task.dueDate).format("MMM DD, YYYY");
  const assignedUsers = task.assignedTo || [];
  const createdByUser = task.createdBy;

  const handleDeleteTask = async (task) => {
    try {
      const { message } = await deleteTask({
        departmentId: task.department._id,
        taskId: task._id,
      }).unwrap();
      toast.success(message || "Task deleted successfully");
    } catch (error) {
      toast.error(error?.data?.message || "Failed to delete task");
    }
  };

  return (
    <>
      <Card
        variant="outlined"
        sx={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        {/* Content */}
        <CardContent
          sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1 }}
        >
          {/* Title */}
          <Typography variant="h6" fontWeight="bold">
            {truncateText(task.title, 30)}
          </Typography>

          {/* Created By and Task Type*/}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="body2" color="text.secondary">
                Created By:
              </Typography>
              <Chip
                label={createdByUser?.firstName || "Unknown"}
                icon={<AccountCircleIcon />}
                size="small"
                sx={{ fontWeight: 600, textTransform: "capitalize" }}
              />
            </Stack>
            <Avatar
              sx={{
                width: 30,
                height: 30,
                bgcolor: "secondary.dark",
                color: "white",
              }}
              variant="rounded"
            >
              <Typography variant="subtitle2" fontWeight="bold">
                {task.taskType.charAt(0).toUpperCase()}
              </Typography>
            </Avatar>
          </Stack>

          {/* Description */}
          <Typography variant="body2" color="text.secondary">
            {truncateText(task.description, 100)}
          </Typography>

          {/* Status and Priority */}
          <Stack direction="row" justifyContent="space-between">
            <Chip
              label={task.status || "Unknown"}
              color={statusColors[task.status] || "default"}
              size="small"
              sx={{ fontWeight: 600, textTransform: "capitalize" }}
            />
            <Chip
              label={task.priority || "Normal"}
              color={priorityColors[task.priority] || "default"}
              size="small"
              sx={{ fontWeight: 600, textTransform: "capitalize" }}
            />
          </Stack>

          {/* Start and End Date */}
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="caption" color="text.secondary">
              {`Start: ${startDate}`}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {`End: ${endDate}`}
            </Typography>
          </Stack>
        </CardContent>

        {/* Actions */}
        <CardActions
          disableSpacing
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            px: 1,
          }}
        >
          {/* Assigned Users */}
          <AvatarGroup max={4}>
            {assignedUsers.map((assignee) => (
              <Tooltip
                key={assignee._id}
                title={assignee.fullName || "Unknown"}
                placement="top"
                arrow
              >
                <Avatar
                  alt={assignee.fullName || "Unknown"}
                  src={assignee?.profilePicture?.url || undefined}
                  sx={{ width: 28, height: 28, cursor: "pointer" }}
                  onClick={() => navigate(`/users/${assignee._id}/profile`)}
                >
                  {!assignee?.profilePicture?.url && assignee.firstName ? (
                    assignee.firstName.charAt(0)
                  ) : (
                    <AccountCircleIcon fontSize="small" />
                  )}
                </Avatar>
              </Tooltip>
            ))}
          </AvatarGroup>

          {/* Action Buttons */}
          <Stack direction="row" alignItems="center" spacing={1}>
            {/* Link to the task detail page */}
            <Tooltip title="Task Detail" arrow>
              <IconButton
                onClick={() => navigate(`/tasks/${task._id}/details`)}
                sx={{ border: "none" }}
              >
                <VisibilityIcon
                  fontSize="small"
                  sx={{ color: "primary.main" }}
                />
              </IconButton>
            </Tooltip>

            {/* Update and delete task*/}
            {isPrivilegedUser && (
              <>
                {/* Open dialog to update task */}
                <Tooltip title="Update Task" arrow>
                  <IconButton
                    onClick={() => onEdit(task)}
                    sx={{ border: "none" }}
                  >
                    <EditIcon
                      fontSize="small"
                      sx={{ color: "secondary.main" }}
                    />
                  </IconButton>
                </Tooltip>

                {/* Delete task */}
                <Tooltip title="Delete Task" arrow>
                  <IconButton
                    onClick={() => {
                      setSelectedTask(task);
                      setConfirmOpen(true);
                    }}
                    sx={{ border: "none" }}
                  >
                    {isDeleting ? (
                      <CircularProgress size={20} />
                    ) : (
                      <DeleteIcon
                        fontSize="small"
                        sx={{ color: "error.main" }}
                      />
                    )}
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Stack>
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
          if (selectedTask) {
            await handleDeleteTask(selectedTask);
          }
        }}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
};

TaskCard.propTypes = {
  task: PropTypes.object.isRequired,
  onEdit: PropTypes.func,
};

export default TaskCard;
