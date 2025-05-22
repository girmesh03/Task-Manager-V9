import PropTypes from "prop-types";
import { toast } from "react-toastify";
import dayjs from "dayjs";

import Timeline from "@mui/lab/Timeline";
import TimelineItem, { timelineItemClasses } from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";

import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "@mui/material/Link";

import CheckCircle from "@mui/icons-material/CheckCircle";
import SwapHoriz from "@mui/icons-material/SwapHoriz";
import Comment from "@mui/icons-material/Comment";
import AttachFile from "@mui/icons-material/AttachFile";
import Assignment from "@mui/icons-material/Assignment";

import { useDeleteTaskActivityMutation } from "../redux/features/taskApiSlice";
import useExpandableText from "../hooks/useExpandableText";

const activityIcons = {
  status: <SwapHoriz color="primary" />,
  comment: <Comment color="secondary" />,
  file: <AttachFile color="success" />,
  system: <Assignment color="warning" />,
};

const TaskTimeLineItem = ({ activity, isMobile, index }) => {
  const { displayText, isTruncated, expanded, toggleExpand } =
    useExpandableText(activity?.description, 100);

  const [deleteActivity, { isLoading: isDeleting }] =
    useDeleteTaskActivityMutation();

  const handleDeleteActivity = async (activityId) => {
    try {
      await deleteActivity({
        taskId: activity.task,
        activityId,
      }).unwrap();
      toast.success("Activity deleted successfully");
    } catch (error) {
      toast.error(error.data.message || "Failed to delete activity");
    }
  };

  return (
    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot sx={{ mt: 0, boxShadow: 0 }}>
          <Avatar sx={{ bgcolor: "action.hover" }}>
            {activityIcons[activity.type] || <CheckCircle />}
          </Avatar>
        </TimelineDot>
        <TimelineConnector />
      </TimelineSeparator>

      <TimelineContent sx={{ overflow: "hidden" }}>
        <Stack spacing={2}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent={
              index % 2 === 0 || isMobile ? "flex-start" : "flex-end"
            }
            spacing={1}
          >
            <Typography variant="subtitle2">
              {activity.performedBy?.firstName || "System"}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {dayjs(activity.createdAt).format("MMM D, HH:mm")}
            </Typography>
            {/* <Chip label={activity.type} size="small" variant="outlined" /> */}
          </Stack>

          {activity.description && (
            <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
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
          )}

          {activity.statusChange && (
            <Stack
              direction="row"
              justifyContent={
                index % 2 === 0 || isMobile ? "flex-start" : "flex-end"
              }
              spacing={1}
            >
              <Chip label={activity.statusChange.from} variant="outlined" />
              <Typography variant="body2">→</Typography>
              <Chip
                label={activity.statusChange.to}
                color="primary"
                variant="contained"
              />
            </Stack>
          )}

          {activity.attachments?.length > 0 && (
            <Stack spacing={1}>
              {activity.attachments.map((file) => (
                <Link
                  key={file.url}
                  href={file.url}
                  target="_blank"
                  sx={{ display: "flex", alignItems: "center" }}
                >
                  <AttachFile fontSize="small" />
                  <Typography variant="body2" ml={0.5}>
                    {file.type} attachment
                  </Typography>
                </Link>
              ))}
            </Stack>
          )}

          <Button
            variant="outlined"
            color="primary"
            onClick={() => handleDeleteActivity(activity._id)}
            size="small"
            disabled={isDeleting}
            sx={{ mt: 2, "&:hover": { color: "red" } }}
          >
            {isDeleting ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Delete"
            )}
          </Button>
        </Stack>
      </TimelineContent>
    </TimelineItem>
  );
};

TaskTimeLineItem.propTypes = {
  activity: PropTypes.object.isRequired,
  isMobile: PropTypes.bool.isRequired,
  index: PropTypes.number.isRequired,
};

const TaskTimeLines = ({ activities }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <Timeline
      position={isMobile ? "right" : "alternate"}
      sx={{
        maxWidth: 800,
        mt: 0,
        mx: "auto",
        padding: 1,
        [`& .${timelineItemClasses.root}:before`]: {
          p: isMobile ? 0 : "auto",
          flex: isMobile ? 0 : 1,
        },
      }}
    >
      <Typography
        variant="h6"
        sx={{ mb: 2, ml: 1, textAlign: isMobile ? "left" : "center" }}
      >
        Timeline
      </Typography>
      {activities.length > 0 ? (
        activities.map((activity, index) => (
          <TaskTimeLineItem
            key={activity._id}
            activity={activity}
            isMobile={isMobile}
            index={index}
          />
        ))
      ) : (
        <TimelineItem>
          <TimelineSeparator>
            <TimelineDot color="primary" />
            <TimelineConnector />
          </TimelineSeparator>
          <TimelineContent>
            <Typography variant="body1" color="text.secondary">
              No activities
            </Typography>
          </TimelineContent>
        </TimelineItem>
      )}
    </Timeline>
  );
};

TaskTimeLines.propTypes = {
  activities: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default TaskTimeLines;
