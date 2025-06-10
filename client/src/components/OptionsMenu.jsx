// react
import React, { memo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "react-toastify";

// mui
import { styled } from "@mui/material/styles";
import Divider, { dividerClasses } from "@mui/material/Divider";
import Menu from "@mui/material/Menu";
import ListItemText from "@mui/material/ListItemText";
import MuiMenuItem from "@mui/material/MenuItem";
import { paperClasses } from "@mui/material/Paper";
import { listClasses } from "@mui/material/List";
import ListItemIcon, { listItemIconClasses } from "@mui/material/ListItemIcon";

// mui icon
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";

// redux
import { useDispatch } from "react-redux";
import { setLogout } from "../redux/features/authSlice";

// hooks
import useAuth from "../hooks/useAuth";

// components
import MenuButton from "./MenuButton";

// styled components
const MenuItem = styled(MuiMenuItem)({
  margin: "2px 0",
});

const OptionsMenu = memo(() => {
  // console.log("OptionsMenu");
  // const { currentUserId, isAdminOrSuperAdmin } = useAuth();
  const { currentUserId } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      const response = await dispatch(setLogout()).unwrap();
      // console.log("handleLogout", response);
      navigate("/", { replace: true });
      toast.success(response.message);
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      handleClose();
    }
  };

  return (
    <React.Fragment>
      <MenuButton
        aria-label="Open-menu"
        onClick={handleClick}
        sx={{ borderColor: "transparent" }}
      >
        <MoreVertRoundedIcon />
      </MenuButton>
      <Menu
        anchorEl={anchorEl}
        id="menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        sx={{
          [`& .${listClasses.root}`]: {
            padding: "4px",
          },
          [`& .${paperClasses.root}`]: {
            padding: 0,
            minWidth: "150px",
          },
          [`& .${dividerClasses.root}`]: {
            margin: "4px -4px",
          },
        }}
      >
        <MenuItem
          component={Link}
          to={`/users/${currentUserId}/profile`}
          onClick={handleClose}
        >
          Profile
        </MenuItem>
        <Divider />
        <MenuItem
          component={Link}
          to={`/users/${currentUserId}/account`}
          onClick={handleClose}
          // disabled={!isAdminOrSuperAdmin}
        >
          Account
        </MenuItem>
        <Divider />

        <MenuItem
          onClick={handleLogout}
          sx={{
            [`& .${listItemIconClasses.root}`]: {
              ml: "auto",
              minWidth: 0,
            },
          }}
        >
          <ListItemText>Logout</ListItemText>
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
        </MenuItem>
      </Menu>
    </React.Fragment>
  );
});

export default OptionsMenu;
