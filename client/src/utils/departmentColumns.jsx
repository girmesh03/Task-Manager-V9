import Avatar from "@mui/material/Avatar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import AvatarGroup from "@mui/material/AvatarGroup";

import dayjs from "dayjs";

import {
  People as PeopleIcon,
  Description as DescriptionIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";

export const DepartmentColumns = [
  {
    field: "name",
    headerName: "Department",
    flex: 1.5,
    minWidth: 180,
    renderCell: (params) => (
      <Stack direction="row" alignItems="center" spacing={1} height="100%">
        <Avatar
          sx={{
            bgcolor: "primary.main",
            width: 30,
            height: 30,
            fontSize: "1rem",
          }}
        >
          {params.value?.[0]?.toUpperCase() || "D"}
        </Avatar>
        <Typography variant="body1" fontWeight={500}>
          {params.value || "No name"}
        </Typography>
      </Stack>
    ),
  },
  {
    field: "description",
    headerName: "Description",
    flex: 2,
    minWidth: 250,
    renderCell: (params) => {
      const description = params.value || "No description available";

      return (
        <Tooltip title={description} placement="top" arrow>
          <Stack direction="row" alignItems="center" spacing={1} height="100%">
            <DescriptionIcon color="action" fontSize="small" />
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
    field: "managers",
    headerName: "Managers",
    flex: 1,
    minWidth: 150,
    renderCell: (params) => {
      const managers = params.value || [];

      if (managers.length === 0) {
        return (
          <Stack direction="row" alignItems="center" spacing={1} height="100%">
            <PeopleIcon color="action" />
            <Typography variant="body2">No managers</Typography>
          </Stack>
        );
      }

      return (
        <AvatarGroup
          max={3}
          sx={{
            justifyContent: "flex-end",
            "& .MuiAvatar-root": { width: 30, height: 30, fontSize: 14 },
          }}
        >
          {managers.map((manager) => {
            const initials = `${manager.firstName?.[0] || ""}${
              manager.lastName?.[0] || ""
            }`;
            const fullName =
              manager.fullName ||
              `${manager.firstName || ""} ${manager.lastName || ""}`;

            return (
              <Tooltip
                key={manager._id}
                title={fullName || "Unnamed manager"}
                arrow
              >
                <Avatar
                  alt={fullName}
                  src={manager.profilePicture?.url}
                  // sx={{
                  //   bgcolor: manager.profilePicture?.url
                  //     ? "transparent"
                  //     : "grey.300",
                  // }}
                >
                  {!manager.profilePicture?.url && initials}
                </Avatar>
              </Tooltip>
            );
          })}
        </AvatarGroup>
      );
    },
  },
  {
    field: "createdAt",
    headerName: "Created",
    flex: 1,
    minWidth: 140,
    headerAlign: "center",
    align: "center",
    valueGetter: (params) => dayjs(params).toDate(),
    renderCell: (params) => (
      <Stack direction="row" alignItems="center" spacing={1} height="100%">
        <CalendarIcon fontSize="small" color="action" />
        <Typography variant="body2">
          {dayjs(params.value).format("MMM D, YYYY") || "N/A"}
        </Typography>
      </Stack>
    ),
  },
  {
    field: "updatedAt",
    headerName: "Updated",
    flex: 1,
    minWidth: 140,
    headerAlign: "center",
    align: "center",
    valueGetter: (params) => dayjs(params).toDate(),
    renderCell: (params) => {
      const updatedDate = params.value;
      const currentDate = dayjs(params.row.createdAt).toDate();
      const diffDays = Math.floor(
        (currentDate - updatedDate) / (1000 * 60 * 60 * 24)
      );

      return (
        <Stack direction="row" alignItems="center" spacing={1} height="100%">
          {diffDays <= 7 ? (
            <CheckIcon fontSize="small" color="success" />
          ) : (
            <CloseIcon fontSize="small" color="error" />
          )}
          <Typography variant="body2">
            {dayjs(params.value).format("MMM D, YYYY") || "N/A"}
          </Typography>
        </Stack>
      );
    },
  },
];
