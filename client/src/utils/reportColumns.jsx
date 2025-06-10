import dayjs from "dayjs";
import Avatar from "@mui/material/Avatar";
import AvatarGroup from "@mui/material/AvatarGroup";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import {
  Business as CompanyIcon,
  Phone as PhoneIcon,
  Groups as UsersIcon,
  Description as DescriptionIcon,
  CalendarToday as DateIcon,
  LocationOn as LocationIcon,
  Work as TaskTypeIcon,
  // Person as PerformedByIcon,
  Cancel as UncompletedIcon,
  CheckCircle as CompletedIcon,
} from "@mui/icons-material";

// Helper function to get initials from name
const getInitials = (name) => {
  if (!name) return "?";
  const names = name.split(" ");
  let initials = names[0][0];
  if (names.length > 1) initials += names[names.length - 1][0];
  return initials.toUpperCase();
};

// Helper function to get initials
// function getInitials(name) {
//   if (!name) return "?";
//   const parts = name.split(" ");
//   let initials = "";
//   for (let i = 0; i < Math.min(2, parts.length); i++) {
//     if (parts[i].length > 0) {
//       initials += parts[i][0].toUpperCase();
//     }
//   }
//   return initials;
// }

// export const TasksColumns = [
//   // {
//   //   field: "id", // Corresponds to "_id" or "id" from backend
//   //   headerName: "ID",
//   //   flex: 0.7,
//   //   minWidth: 180, // To ensure UUID is somewhat visible if not hidden
//   //   hide: true, // Usually, raw IDs are not displayed to end-users
//   //   filterable: false, // Typically don't filter by raw ID
//   // },
//   {
//     field: "date",
//     headerName: "Date",
//     type: "date",
//     flex: 1,
//     minWidth: 120,
//     valueGetter: (value) => (value ? dayjs(value).toDate() : null),
//     valueFormatter: (value) => (value ? dayjs(value).format("YYYY-MM-DD") : ""),
//   },
//   {
//     field: "taskType",
//     headerName: "Task Type",
//     // flex: 0.8,
//     // minWidth: 130,
//     type: "singleSelect",
//     valueOptions: ["AssignedTask", "ProjectTask"],
//   },
//   {
//     field: "title",
//     headerName: "Title",
//     // flex: 1.5,
//     // minWidth: 200,
//     renderCell: (params) => (
//       <div
//         style={{
//           width: "100%",
//           overflow: "hidden",
//           textOverflow: "ellipsis",
//           whiteSpace: "nowrap",
//         }}
//         title={params.value || ""}
//       >
//         {params.value}
//       </div>
//     ),
//   },
//   {
//     field: "status",
//     headerName: "Status",
//     // flex: 0.8,
//     // minWidth: 130,
//     type: "singleSelect",
//     valueOptions: ["To Do", "In Progress", "Completed", "Pending"],
//     renderCell: (params) => {
//       const status = params.value;
//       let color = "default";

//       switch (status) {
//         case "Completed":
//           color = "success";
//           break;
//         case "Pending":
//           color = "warning";
//           break;
//         case "In Progress":
//           color = "info";
//           break;
//         case "To Do":
//           color = "primary";
//           break;
//         default:
//           color = "default";
//       }

//       return (
//         <Chip label={status} color={color} variant="filled" size="small" />
//       );
//     },
//   },
//   {
//     field: "location",
//     headerName: "Location",
//     // flex: 1,
//     // minWidth: 150,
//   },
//   {
//     field: "assignedUsers",
//     headerName: "Assigned Users",
//     flex: 1.5,
//     minWidth: 200,
//     renderCell: (params) => (
//       <div
//         style={{
//           width: "100%",
//           overflow: "hidden",
//           textOverflow: "ellipsis",
//           whiteSpace: "nowrap",
//         }}
//         title={params.value || ""}
//       >
//         {params.value}
//       </div>
//     ),
//   },
//   {
//     field: "companyName",
//     headerName: "Company Name",
//     // flex: 1,
//     // minWidth: 150,
//   },
//   {
//     field: "phoneNumber",
//     headerName: "Phone Number",
//     // flex: 1,
//     // minWidth: 140,
//   },
//   {
//     field: "description",
//     headerName: "Description",
//     // flex: 2,
//     // minWidth: 250,
//     renderCell: (params) => (
//       <div
//         style={{
//           width: "100%",
//           overflow: "hidden",
//           textOverflow: "ellipsis",
//           whiteSpace: "nowrap",
//         }}
//         title={params.value || ""}
//       >
//         {params.value}
//       </div>
//     ),
//   },
//   {
//     field: "activities",
//     headerName: "Activities",
//     // flex: 2,
//     // minWidth: 250,
//     renderCell: (params) => (
//       <div
//         style={{
//           width: "100%",
//           overflow: "hidden",
//           textOverflow: "ellipsis",
//           whiteSpace: "nowrap",
//         }}
//         title={params.value || ""}
//       >
//         {params.value}
//       </div>
//     ),
//   },
// ];

// For Routine Task Report

// export const RoutineColumns = [
//   // {
//   //   field: "id",
//   //   headerName: "ID",
//   //   flex: 0.7,
//   //   minWidth: 180,
//   //   hide: true,
//   //   filterable: false,
//   // },
//   {
//     field: "date",
//     headerName: "Date",
//     type: "date",
//     // flex: 0.8,
//     // minWidth: 90,
//     headerAlign: "left",
//     align: "left",
//     valueGetter: (params) => {
//       return params ? new Date(params) : null;
//     },
//     valueFormatter: (params) => {
//       if (!params) return "N/A";
//       return new Date(params).toLocaleDateString("en-US");
//     },
//   },
//   {
//     field: "location", // Department name
//     headerName: "Location",
//     // flex: 1,
//     // minWidth: 150,
//   },
//   {
//     field: "assignedUsers", // Performed by
//     headerName: "Performed By",
//     // flex: 1.5,
//     // minWidth: 180,
//   },
//   {
//     field: "description", // Tasks performed
//     headerName: "Tasks Performed",
//     // flex: 2.5,
//     // minWidth: 300,
//     renderCell: (params) => (
//       // Allow wrapping for this potentially very long field
//       <div
//         style={{
//           width: "100%",
//           whiteSpace: "normal",
//           wordBreak: "break-word",
//         }}
//         title={params.value || ""}
//       >
//         {params.value}
//       </div>
//     ),
//   },
//   {
//     field: "status",
//     headerName: "Status",
//     // flex: 0.8,
//     // minWidth: 130,
//     type: "singleSelect",
//     valueOptions: ["Completed", "Uncompleted", "Pending"],
//     renderCell: (params) => {
//       const status = params.value;
//       let color = "default";

//       switch (status) {
//         case "Completed":
//           color = "success";
//           break;
//         case "Uncompleted":
//           color = "error";
//           break;
//         case "Pending":
//           color = "warning";
//           break;
//         default:
//           color = "default";
//       }

//       return (
//         <Chip label={status} color={color} variant="filled" size="small" />
//       );
//     },
//   },
// ];

// For Task Type ProjectTask And AssignedTask Report
export const TaskColumns = [
  {
    field: "date",
    headerName: "Date",
    flex: 0.8,
    minWidth: 120,
    // valueGetter: (params) => new Date(params.value),
    renderCell: (params) => (
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ height: "100%" }}
      >
        <DateIcon fontSize="small" color="action" />
        <Typography variant="body2">
          {dayjs(params.value).format("YYYY-MM-DD") || "N/A"}
        </Typography>
      </Stack>
    ),
  },
  {
    field: "title",
    headerName: "Title",
    flex: 1.2,
    minWidth: 180,
    renderCell: (params) => (
      <Typography
        variant="body1"
        fontWeight={500}
        sx={{ display: "flex", alignItems: "center", gap: 1, height: "100%" }}
      >
        {params.value || "Untitled Task"}
      </Typography>
    ),
  },
  {
    field: "description",
    headerName: "Description",
    flex: 1.5,
    minWidth: 200,
    renderCell: (params) => {
      const description = params.value || "No description";
      return (
        <Tooltip title={description} arrow>
          <Stack direction="row" alignItems="center" spacing={1} height="100%">
            <DescriptionIcon fontSize="small" color="action" />
            <Typography
              variant="body2"
              sx={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {description}
            </Typography>
          </Stack>
        </Tooltip>
      );
    },
  },
  {
    field: "status",
    headerName: "Status",
    flex: 0.8,
    minWidth: 120,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => {
      const statusColors = {
        Completed: "success",
        "In Progress": "warning",
        Pending: "info",
        Cancelled: "error",
      };

      return (
        <Chip
          label={params.value || "Unknown"}
          color={statusColors[params.value] || "default"}
          size="small"
          variant="outlined"
        />
      );
    },
  },
  {
    field: "location",
    headerName: "Location",
    flex: 0.9,
    minWidth: 140,
    renderCell: (params) => (
      <Stack direction="row" alignItems="center" spacing={1} height="100%">
        <LocationIcon fontSize="small" color="action" />
        <Typography variant="body2" noWrap>
          {params.value || "No location"}
        </Typography>
      </Stack>
    ),
  },
  {
    field: "taskType",
    headerName: "Type",
    flex: 0.7,
    minWidth: 110,
    renderCell: (params) => (
      <Chip
        icon={<TaskTypeIcon fontSize="small" />}
        label={params.value || "Unknown"}
        size="small"
        color={params.value === "ProjectTask" ? "primary" : "secondary"}
      />
    ),
  },
  {
    field: "taskSpecific",
    headerName: "Details",
    flex: 1.3,
    minWidth: 220,
    renderCell: (params) => {
      const { row } = params;

      if (row.taskType === "ProjectTask") {
        return (
          <Stack direction="column" spacing={1} height="100%">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CompanyIcon fontSize="small" color="action" />
              <Typography variant="body2" noWrap>
                {row.companyName || "No company"}
              </Typography>
            </Box>

            {row.phoneNumber && (
              <Stack
                direction="row"
                alignItems="center"
                spacing={1}
                height="100%"
              >
                <PhoneIcon fontSize="small" color="action" />
                <Link href={`tel:${row.phoneNumber}`} underline="hover">
                  <Typography variant="body2">{row.phoneNumber}</Typography>
                </Link>
              </Stack>
            )}
          </Stack>
        );
      }

      if (row.taskType === "AssignedTask") {
        const users = row.assignedUsers
          ? row.assignedUsers
              .split(";")
              .map((u) => u.trim())
              .filter((u) => u)
          : [];

        return (
          <Stack direction="column" spacing={1} height="100%">
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <UsersIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={500}>
                Assigned to:
              </Typography>
            </Box>

            {users.length > 0 ? (
              <AvatarGroup
                max={3}
                sx={{
                  justifyContent: "flex-start",
                  "& .MuiAvatar-root": { width: 30, height: 30, fontSize: 12 },
                }}
              >
                {users.map((user, index) => (
                  <Tooltip key={index} title={user} arrow>
                    <Avatar sx={{ bgcolor: "grey.300" }}>
                      {getInitials(user)}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            ) : (
              <Typography variant="body2" color="textSecondary">
                No users assigned
              </Typography>
            )}
          </Stack>
        );
      }

      return <Typography variant="body2">N/A</Typography>;
    },
  },
  {
    field: "activities",
    headerName: "Last Activity",
    flex: 1.2,
    minWidth: 300,
    renderCell: (params) => {
      const activity = params.value || "No activities";
      return (
        <Tooltip title={activity} arrow>
          <Stack direction="row" alignItems="center" height="100%">
            <Typography
              variant="body2"
              noWrap
              sx={{
                maxWidth: "100%",
                textOverflow: "ellipsis",
                overflow: "hidden",
              }}
            >
              {activity}
            </Typography>
          </Stack>
        </Tooltip>
      );
    },
  },
];

// For RoutineTask Report
export const RoutineTaskColumns = [
  {
    field: "date",
    headerName: "Date",
    flex: 0.8,
    minWidth: 120,
    // valueGetter: (params) => new Date(params.value),
    renderCell: (params) => (
      <Stack direction="row" alignItems="center" spacing={1} height="100%">
        <DateIcon fontSize="small" color="action" />
        <Typography variant="body2">
          {dayjs(params.value).format("YYYY-MM-DD") || "N/A"}
        </Typography>
      </Stack>
    ),
  },
  {
    field: "description",
    headerName: "Description",
    flex: 1.5,
    minWidth: 200,
    renderCell: (params) => {
      const description = params.value || "No description";
      return (
        <Tooltip title={description} arrow>
          <Stack direction="row" alignItems="center" height="100%" spacing={1}>
            <DescriptionIcon fontSize="small" color="action" />
            <Typography
              variant="body1"
              fontWeight={500}
              sx={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {description}
            </Typography>
          </Stack>
        </Tooltip>
      );
    },
  },
  {
    field: "location",
    headerName: "Location",
    flex: 1,
    minWidth: 150,
    renderCell: (params) => (
      <Stack direction="row" alignItems="center" spacing={1} height="100%">
        <LocationIcon fontSize="small" color="action" />
        <Typography variant="body2" noWrap>
          {params.value || "No location"}
        </Typography>
      </Stack>
    ),
  },
  {
    field: "performedBy",
    headerName: "Performed By",
    flex: 1.2,
    minWidth: 180,
    renderCell: (params) => {
      const performer = params.value || "Not specified";

      return (
        <Stack direction="row" alignItems="center" spacing={1} height="100%">
          <Avatar
            sx={{
              width: 30,
              height: 30,
              fontSize: "0.875rem",
              bgcolor: "primary.main",
            }}
          >
            {getInitials(performer)}
          </Avatar>
          <Typography variant="body2" fontWeight={500} noWrap>
            {performer}
          </Typography>
        </Stack>
      );
    },
  },
  {
    field: "status",
    headerName: "Status",
    flex: 0.8,
    minWidth: 130,
    align: "center",
    headerAlign: "center",
    renderCell: (params) => {
      const isCompleted = params.value === "Completed";

      return (
        <Stack direction="row" alignItems="center" spacing={1} height="100%">
          {isCompleted ? (
            <CompletedIcon color="success" fontSize="small" />
          ) : (
            <UncompletedIcon color="error" fontSize="small" />
          )}
          <Chip
            label={params.value || "Unknown"}
            color={isCompleted ? "success" : "error"}
            size="small"
            variant="outlined"
          />
        </Stack>
      );
    },
  },
  {
    field: "taskType",
    headerName: "Task Type",
    flex: 0.7,
    minWidth: 120,
    renderCell: (params) => (
      <Chip
        label={params.value || "Unknown"}
        color="info"
        size="small"
        variant="outlined"
      />
    ),
  },
];
