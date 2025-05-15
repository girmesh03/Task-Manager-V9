// react import
import { useMemo } from "react";
import { Link, useLocation } from "react-router";

// mui import
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
// import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
// import InfoRoundedIcon from "@mui/icons-material/InfoRounded";

const MenuContent = () => {
  // console.log("MenuContent useAuth");
  const route = useLocation().pathname;

  const routesListItems = useMemo(
    () => [
      { text: "Home", icon: <HomeRoundedIcon />, path: "/" },
      { text: "Dashboard", icon: <DashboardRoundedIcon />, path: "/dashboard" },
      {
        text: "Tasks",
        icon: <AssignmentRoundedIcon />,
        path: "/tasks",
      },
      { text: "Users", icon: <PeopleRoundedIcon />, path: "/users" },
    ],
    []
  );

  return (
    <List dense>
      {routesListItems.map((item, index) => (
        <ListItem
          key={index}
          disablePadding
          sx={{
            mb: 0.5,
          }}
        >
          <ListItemButton
            component={Link}
            to={item.path}
            selected={route === routesListItems[index].path.toLowerCase()}
            sx={{
              "&.MuiListItemButton-root.Mui-selected": {
                backgroundColor: (theme) => theme.palette.primary.main,
                "&:hover": {
                  backgroundColor: (theme) => theme.palette.primary.dark,
                },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );
};

export default MenuContent;
