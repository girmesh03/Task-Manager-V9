import { useNavigate } from "react-router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import TaskIcon from "@mui/icons-material/Task";
import PersonIcon from "@mui/icons-material/Person";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import MarkChatReadIcon from "@mui/icons-material/MarkChatRead";

import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "../redux/features/notificationApiSlice";

dayjs.extend(relativeTime);

// Helper to determine the icon based on notification type
const getIconForType = (type) => {
  switch (type) {
    case "TaskAssignment":
    case "TaskUpdate":
    case "StatusChange":
      return <TaskIcon fontSize="small" />;
    default:
      return <PersonIcon fontSize="small" />;
  }
};

const NotificationMenu = ({ anchorEl, open, onClose }) => {
  const navigate = useNavigate();
  const { data, isLoading, isFetching } = useGetNotificationsQuery(
    {
      page: 1, // You can adjust this based on your pagination needs
      limit: 10, // Adjust the limit as needed
      unread: true, // Fetch only unread notifications
    },
    { skip: !open } // Skip the query if the menu is not open
  );

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllAsRead] = useMarkAllAsReadMutation();

  const handleNotificationClick = async (notification) => {
    // Mark as read if it isn't already
    if (!notification.isRead) {
      await markAsRead({ notificationIds: [notification._id] }).unwrap();
    }

    onClose(); // Close the menu

    // Navigate to the relevant page based on the notification type
    if (notification.linkedDocument) {
      switch (notification.linkedDocumentType) {
        case "Task":
        case "TaskActivity":
          // navigate(`/tasks/${notification.linkedDocument._id}/details`, {
          //   replace: true,
          // });
          navigate(`/tasks/${notification.task}/details`, {
            replace: true,
          });
          break;
        // Add other cases for User, Department, etc.
        default:
          break;
      }
    }
  };

  const handleMarkAll = async () => {
    await markAllAsRead().unwrap();
    onClose(); // Close the menu after marking all as read
  };

  const notifications = data?.notifications || [];

  return (
    <Menu
      id="notifications-menu"
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{
        paper: {
          sx: {
            maxHeight: 400,
            width: "350px",
          },
        },
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ px: 2, py: 1 }}
      >
        <Typography variant="subtitle1">Notifications</Typography>
        <Button
          size="small"
          onClick={handleMarkAll}
          disabled={isFetching || notifications.every((n) => n.isRead)}
          startIcon={<MarkChatReadIcon />}
        >
          Mark all as read
        </Button>
      </Stack>
      <Divider />

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Stack alignItems="center" spacing={1} sx={{ p: 3 }}>
          <NotificationsOffIcon color="disabled" sx={{ fontSize: 40 }} />
          <Typography variant="body2" color="text.secondary">
            No new notifications
          </Typography>
        </Stack>
      ) : (
        notifications.map((notification) => (
          <MenuItem
            key={notification._id}
            onClick={() => handleNotificationClick(notification)}
            sx={{
              overflow: "hidden",
              alignItems: "flex-start",
              mr: 1,
            }}
          >
            <ListItemIcon sx={{ mt: 0.5 }}>
              {getIconForType(notification.type)}
            </ListItemIcon>
            <ListItemText
              primary={notification.message}
              secondary={dayjs(notification.createdAt).fromNow()}
              slotProps={{
                primary: {
                  sx: {
                    variant: "body2",
                    fontWeight: notification.isRead ? "normal" : "bold",
                  },
                },
                secondary: {
                  sx: {
                    variant: "caption",
                    color: "text.secondary",
                    fontStyle: "italic",
                  },
                },
              }}
            />
          </MenuItem>
        ))
      )}
    </Menu>
  );
};

export default NotificationMenu;
