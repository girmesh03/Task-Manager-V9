import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Rating from "@mui/material/Rating";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import {
  Verified as VerifiedIcon,
  Report as UnverifiedIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
} from "@mui/icons-material";
import { Divider } from "@mui/material";

// Helper function to determine Chip color based on role
const getRoleChipColor = (role) => {
  switch (role) {
    case "SuperAdmin":
      return "secondary";
    case "Admin":
      return "primary";
    case "Manager":
      return "info";
    case "User":
      return "default";
    default:
      return "default";
  }
};

export const LeaderboardColumns = [
  // {
  //   field: "id", // Corresponds to "_id" or "id" from backend
  //   headerName: "ID",
  //   flex: 0.7,
  //   minWidth: 180,
  //   hide: true, // Usually, raw IDs are not displayed to end-users
  //   filterable: false,
  // },
  {
    field: "name",
    headerName: "Full Name",
    flex: 1.5,
    minWidth: 180,
    maxWidth: 250,
    renderCell: (params) => (
      <Tooltip title={params.value || ""} arrow placement="top">
        <Typography noWrap>{params.value}</Typography>
      </Tooltip>
    ),
  },
  {
    field: "email",
    headerName: "Email",
    flex: 2,
    minWidth: 200,
    maxWidth: 300,
    renderCell: (params) => (
      <Tooltip title={params.value || ""} arrow placement="top">
        <Typography noWrap>{params.value}</Typography>
      </Tooltip>
    ),
  },
  {
    field: "userRole",
    headerName: "Role",
    flex: 1,
    minWidth: 120,
    maxWidth: 150,
    type: "singleSelect",
    valueOptions: ["SuperAdmin", "Admin", "Manager", "User"],
    renderCell: (params) => (
      <Chip
        label={params.value}
        color={getRoleChipColor(params.value)}
        size="small"
        variant="filled" // or "outlined"
      />
    ),
  },
  {
    field: "departmentName",
    headerName: "Department",
    flex: 1.2,
    minWidth: 130,
    maxWidth: 200,
  },
  {
    field: "rating",
    headerName: "Performance Rating",
    flex: 1.5,
    minWidth: 180,
    maxWidth: 200,
    align: "center",
    headerAlign: "center",
    type: "number", // Allows for numeric filtering and sorting
    renderCell: (params) => (
      <Rating
        name={`user-rating-${params.id}`}
        value={Number(params.value) || 0}
        precision={0.1}
        readOnly
        size="small"
      />
    ),
    // To filter by rating, you might need custom filter operators if MUI's default
    // numeric filter isn't sufficient for a 1-5 star system.
    // For simplicity, relying on default numeric filtering here.
  },
  {
    field: "totalTaskCount",
    headerName: "Total Tasks",
    type: "number",
    flex: 0.8,
    minWidth: 100,
    maxWidth: 130,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "completedTaskCount",
    headerName: "Completed",
    type: "number",
    flex: 0.8,
    minWidth: 100,
    maxWidth: 130,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "pendingTaskCount",
    headerName: "Pending",
    type: "number",
    flex: 0.7,
    minWidth: 90,
    maxWidth: 120,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "activityCount",
    headerName: "Activities",
    type: "number",
    flex: 0.8,
    minWidth: 100,
    maxWidth: 130,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "assignedTaskCount",
    headerName: "Assigned T.",
    description: "Assigned Tasks Count",
    type: "number",
    flex: 0.7,
    minWidth: 90,
    maxWidth: 120,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "projectTaskCount",
    headerName: "Project T.",
    description: "Project Tasks Count",
    type: "number",
    flex: 0.7,
    minWidth: 90,
    maxWidth: 120,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "routineTaskCount",
    headerName: "Routine T.",
    description: "Routine Tasks Count",
    type: "number",
    flex: 0.7,
    minWidth: 90,
    maxWidth: 120,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "highPriorityCount",
    headerName: "High P.",
    description: "High Priority Tasks",
    type: "number",
    flex: 0.6,
    minWidth: 80,
    maxWidth: 100,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "mediumPriorityCount",
    headerName: "Med P.",
    description: "Medium Priority Tasks",
    type: "number",
    flex: 0.6,
    minWidth: 80,
    maxWidth: 100,
    align: "center",
    headerAlign: "center",
  },
  {
    field: "lowPriorityCount",
    headerName: "Low P.",
    description: "Low Priority Tasks",
    type: "number",
    flex: 0.6,
    minWidth: 80,
    maxWidth: 100,
    align: "center",
    headerAlign: "center",
  },
];

export const UserColumns = [
  {
    field: "user",
    headerName: "User",
    flex: 2,
    minWidth: 200,
    renderCell: (params) => {
      const { row } = params;

      // Generate initials for fallback avatar
      const getInitials = () => {
        const firstInitial = row.firstName?.[0] || "";
        const lastInitial = row.lastName?.[0] || "";
        return `${firstInitial}${lastInitial}`.toUpperCase();
      };

      // Check if profile picture exists
      const hasProfilePicture = row.profilePicture?.url;
      const fullName =
        row.fullName || `${row.firstName || ""} ${row.lastName || ""}`.trim();

      return (
        <Box
          sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}
        >
          <Avatar
            alt={fullName}
            src={hasProfilePicture ? row.profilePicture.url : undefined}
            sx={{
              width: 30,
              height: 30,
              bgcolor: hasProfilePicture ? "transparent" : "primary.main",
              fontSize: "0.8rem",
              fontWeight: 500,
            }}
          >
            {!hasProfilePicture && getInitials()}
          </Avatar>

          <Stack
            direction="column"
            sx={{ height: "100%", overflowX: "hidden" }}
          >
            <Typography
              variant="body2"
              // fontWeight={500}
              noWrap
              // sx={{ lineHeight: 1.2 }}
            >
              {fullName || "No name"}
            </Typography>

            {/* <Typography
              variant="body2"
              color="text.secondary"
              noWrap
              // sx={{ lineHeight: 1.2, mt: 0.5 }}
            >
              {row.email || "No email"}
            </Typography> */}
          </Stack>
        </Box>
      );
    },
  },
  {
    field: "position",
    headerName: "Position",
    flex: 1,
    minWidth: 150,
  },
  {
    field: "role",
    headerName: "Role",
    flex: 1,
    minWidth: 120,
    renderCell: (params) => (
      <Chip
        label={params.value || "No role"}
        size="small"
        color={
          params.value === "SuperAdmin"
            ? "primary"
            : params.value === "Admin"
            ? "info"
            : params.value === "Manager"
            ? "secondary"
            : "default"
        }
      />
    ),
  },
  {
    field: "department",
    headerName: "Department",
    flex: 1,
    minWidth: 100,
    // valueGetter: (params) => console.log(params.name),
    renderCell: (params) => (
      <Typography
        variant="body2"
        sx={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        {params.row.department.name || "No department"}
      </Typography>
    ),
  },
  {
    field: "status",
    headerName: "Status",
    flex: 1,
    minWidth: 180,
    type: "singleSelect",
    valueOptions: ["Active", "Inactive"],
    headerAlign: "center",
    renderCell: (params) => {
      const { row } = params;
      return (
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          spacing={1.5}
          sx={{ height: "100%" }}
          divider={<Divider orientation="vertical" flexItem />}
        >
          <Chip
            icon={row.isActive ? <ActiveIcon /> : <InactiveIcon />}
            label={row.isActive ? "Active" : "Inactive"}
            size="small"
            color={row.isActive ? "success" : "error"}
            variant="outlined"
          />

          <Chip
            icon={row.isVerified ? <VerifiedIcon /> : <UnverifiedIcon />}
            label={row.isVerified ? "Verified" : "Unverified"}
            size="small"
            color={row.isVerified ? "success" : "error"}
            variant="outlined"
          />
        </Stack>
      );
    },
  },
];
