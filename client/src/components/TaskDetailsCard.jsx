import PropTypes from "prop-types";
import dayjs from "dayjs";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid2";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";

import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import AssignmentIndIcon from "@mui/icons-material/AssignmentInd";
import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";

import useExpandableText from "../hooks/useExpandableText";

const TaskDetailsCard = ({ task }) => {
  // Use the expandable-text hook for the description
  const { displayText, isTruncated, expanded, toggleExpand } =
    useExpandableText(task?.description || "", 120);

  // Helper: format ISO date string into "MMMM D, YYYY" (e.g. "June 1, 2025")
  const formatDate = (isoString) => {
    if (!isoString) return "—";
    return dayjs(isoString).format("MMMM D, YYYY");
  };

  // Map status to chip color/variant
  const getStatusChip = (status) => {
    switch (status) {
      case "To Do":
        return <Chip label="To Do" color="info" size="small" />;
      case "In Progress":
        return <Chip label="In Progress" color="primary" size="small" />;
      case "Completed":
        return <Chip label="Completed" color="success" size="small" />;
      case "Pending":
        return <Chip label="Pending" color="warning" size="small" />;
      case "Blocked":
        return <Chip label="Blocked" color="error" size="small" />;
      default:
        return <Chip label={status} variant="outlined" size="small" />;
    }
  };

  // Map priority to chip icon/color
  const getPriorityChip = (priority) => {
    switch (priority) {
      case "High":
        return (
          <Chip
            icon={<PriorityHighIcon />}
            label="High"
            color="error"
            size="small"
          />
        );
      case "Medium":
        return (
          <Chip
            icon={<PriorityHighIcon />}
            label="Medium"
            color="warning"
            size="small"
          />
        );
      case "Low":
        return (
          <Chip
            icon={<PriorityHighIcon />}
            label="Low"
            color="success"
            size="small"
          />
        );
      default:
        return (
          <Chip
            icon={<PriorityHighIcon />}
            label={priority}
            variant="outlined"
            size="small"
          />
        );
    }
  };

  return (
    <Card
      variant="outlined"
      sx={{
        maxWidth: 720,
        mx: "auto",
        mt: 2,
        p: { xs: 1, sm: 2, md: 3 },
        boxShadow: 3,
        borderRadius: 2,
      }}
    >
      {/* Card Header with Title and Status Chip */}
      <CardHeader
        avatar={
          <Avatar>
            <AssignmentIndIcon />
          </Avatar>
        }
        title={
          <Typography variant="h5" fontWeight="bold">
            {task.title}
          </Typography>
        }
        subheader={
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
            {getStatusChip(task.status)}
            {getPriorityChip(task.priority)}
          </Stack>
        }
      />

      <Divider sx={{ my: 1 }} />

      <CardContent>
        <Grid container spacing={2}>
          {/* Left Column: Metadata */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Stack spacing={1}>
              {/* Location */}
              <Stack direction="row" spacing={1} alignItems="center">
                <LocationOnIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  {task.location || "—"}
                </Typography>
              </Stack>

              {/* Due Date */}
              <Stack direction="row" spacing={1} alignItems="center">
                <CalendarTodayIcon color="action" fontSize="small" />
                <Typography variant="body2" color="text.secondary">
                  Due: {formatDate(task.dueDate)}
                </Typography>
              </Stack>

              {/* Department */}
              {task.department && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <BusinessIcon color="action" fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    Dept: {task.department.name}
                  </Typography>
                </Stack>
              )}

              {/* Created By */}
              {task.createdBy && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Avatar
                    sx={{ width: 24, height: 24, bgcolor: "primary.main" }}
                  >
                    {task.createdBy.firstName.charAt(0)}
                  </Avatar>
                  <Typography variant="body2" color="text.secondary">
                    Created by {task.createdBy.fullName} (
                    {task.createdBy.position})
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Grid>

          {/* Right Column: Assigned To & Attachments */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Stack spacing={2}>
              {/* Assigned To */}
              {Array.isArray(task.assignedTo) && task.assignedTo.length > 0 && (
                <>
                  <Typography variant="subtitle2" fontWeight="medium">
                    Assigned To:
                  </Typography>
                  <AvatarGroup max={4} sx={{ justifyContent: "flex-end" }}>
                    {task.assignedTo.map((user) => (
                      <Tooltip
                        key={user._id}
                        title={user.fullName}
                        placement="top"
                        arrow
                      >
                        <Avatar sx={{ bgcolor: "secondary.main" }}>
                          {user.firstName.charAt(0)}
                        </Avatar>
                      </Tooltip>
                    ))}
                  </AvatarGroup>
                </>
              )}

              {/* Proforma / Attachments (for ProjectTask) */}
              {Array.isArray(task.proforma) && task.proforma.length > 0 && (
                <Box>
                  <Typography
                    variant="subtitle2"
                    fontWeight="medium"
                    gutterBottom
                  >
                    Attachments:
                  </Typography>
                  <Stack spacing={1}>
                    {task.proforma.map((file) => (
                      <Stack
                        key={file._id}
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <DescriptionIcon color="action" fontSize="small" />
                        <Link
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          underline="hover"
                          variant="body2"
                        >
                          {file.url.split("/").pop() || file.url}
                        </Link>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          </Grid>

          {/* Full-Width Divider Before Description */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Description Section */}
          {task.description && (
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <Avatar sx={{ width: 24, height: 24, bgcolor: "info.main" }}>
                  <DescriptionIcon fontSize="small" />
                </Avatar>
                <Typography variant="subtitle1" fontWeight="medium">
                  Description
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                {displayText}{" "}
                {isTruncated && (
                  <Link
                    component="button"
                    variant="body2"
                    onClick={toggleExpand}
                    underline="hover"
                  >
                    {expanded ? "Show less" : "Read more"}
                  </Link>
                )}
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

TaskDetailsCard.propTypes = {
  task: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.string,
    location: PropTypes.string,
    dueDate: PropTypes.string,
    priority: PropTypes.string,
    createdBy: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      firstName: PropTypes.string,
      lastName: PropTypes.string,
      position: PropTypes.string,
      fullName: PropTypes.string,
    }),
    department: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string,
      description: PropTypes.string,
      managers: PropTypes.arrayOf(
        PropTypes.shape({
          _id: PropTypes.string.isRequired,
          firstName: PropTypes.string,
          lastName: PropTypes.string,
          position: PropTypes.string,
          email: PropTypes.string,
          role: PropTypes.string,
          fullName: PropTypes.string,
        })
      ),
    }),
    assignedTo: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        firstName: PropTypes.string,
        lastName: PropTypes.string,
        position: PropTypes.string,
        fullName: PropTypes.string,
      })
    ),
    proforma: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        url: PropTypes.string.isRequired,
        type: PropTypes.string,
      })
    ),
    taskType: PropTypes.string,
    companyInfo: PropTypes.shape({
      name: PropTypes.string,
      phoneNumber: PropTypes.string,
      address: PropTypes.string,
    }),
    createdAt: PropTypes.string,
    updatedAt: PropTypes.string,
  }).isRequired,
};

export default TaskDetailsCard;
