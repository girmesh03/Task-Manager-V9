import { memo } from "react";
import { Link, useLocation } from "react-router";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import Divider from "@mui/material/Divider";

import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import ReportIcon from "@mui/icons-material/Report";
import AssignedTasksIcon from "@mui/icons-material/AssignmentInd";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import useAuth from "../hooks/useAuth";

const GENERAL_ROUTES = [
  { text: "Home", icon: <HomeRoundedIcon />, path: "/" },
  { text: "Dashboard", icon: <DashboardRoundedIcon />, path: "/dashboard" },
  { text: "Tasks", icon: <AssignmentRoundedIcon />, path: "/tasks" },
  {
    text: "Routine Tasks",
    icon: <AssignedTasksIcon />,
    path: "/routine-tasks",
  },
  { text: "Users", icon: <PeopleRoundedIcon />, path: "/users" },
];

const MANAGER_ROUTES = [
  { text: "Reports", icon: <ReportIcon />, path: "/reports" },
];

const ADMIN_ROUTES = [
  {
    text: "Admin Panel",
    icon: <AdminPanelSettingsIcon />,
    path: "/admin-panel",
  },
];

const selectedStyles = {
  "&.MuiListItemButton-root.Mui-selected": {
    backgroundColor: (theme) => theme.palette.primary.main,
    "&:hover": {
      backgroundColor: (theme) => theme.palette.primary.dark,
    },
  },
};

const MenuContent = memo(() => {
  const { isPrivilegedUser, isSuperAdmin } = useAuth();
  const { pathname: route } = useLocation();

  const renderListItems = (items) =>
    items.map(({ text, icon, path }) => {
      const baseSegment = `/${route.split("/")[1]}`;
      const isSelected = route === path || baseSegment === path;

      return (
        <ListItem key={path} disablePadding sx={{ mb: 0.5 }}>
          <ListItemButton
            component={Link}
            to={path}
            selected={isSelected}
            sx={selectedStyles}
          >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primary={text} />
          </ListItemButton>
        </ListItem>
      );
    });

  return (
    <List dense>
      <ListSubheader>Pages</ListSubheader>
      {/* <Divider sx={{ mb: 1 }} /> */}
      {renderListItems(GENERAL_ROUTES)}

      {isPrivilegedUser && (
        <>
          <ListSubheader>Report</ListSubheader>
          {/* <Divider sx={{ mb: 1 }} /> */}
          {renderListItems(MANAGER_ROUTES)}
        </>
      )}

      {isSuperAdmin && (
        <>
          <ListSubheader>Admin</ListSubheader>
          {/* <Divider sx={{ mb: 1 }} /> */}
          {renderListItems(ADMIN_ROUTES)}
        </>
      )}
    </List>
  );
});

export default MenuContent;
