import { memo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import IconButton from "@mui/material/IconButton";
import ListItemText from "@mui/material/ListItemText";
import MuiMenuItem from "@mui/material/MenuItem";
import Divider, { dividerClasses } from "@mui/material/Divider";
import { paperClasses } from "@mui/material/Paper";
import { listClasses } from "@mui/material/List";
import ListItemIcon, { listItemIconClasses } from "@mui/material/ListItemIcon";

import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";

import { useDispatch, useSelector } from "react-redux";
import {
  selectSelectedDepartmentId,
  setLogout,
} from "../redux/features/authSlice";

import useAuth from "../hooks/useAuth";

const MenuItem = styled(MuiMenuItem)({
  margin: "2px 0",
});

const OptionsMenu = memo(() => {
  const { currentUserId, currentUserDepartmentId } = useAuth();
  const departmentId = useSelector(selectSelectedDepartmentId);
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
      const { message } = await dispatch(setLogout()).unwrap();
      navigate("/", { replace: true });
      toast.success(message);
    } catch (error) {
      toast.error(error.message || "An error occurred");
    } finally {
      handleClose();
    }
  };

  const handleNavigation = (path) => {
    setAnchorEl(null);
    navigate(`/users/${currentUserId}/${path}`, { replace: true });
  };

  return (
    <>
      <IconButton
        size="small"
        aria-label={`${currentUserId}-option-menu`}
        color="inherit"
        onClick={handleClick}
        aria-controls={open ? "options-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
        disabled={
          departmentId?.toString() !== currentUserDepartmentId?.toString()
        }
      >
        <MoreVertRoundedIcon />
      </IconButton>
      <Menu
        id="options-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ horizontal: "right", vertical: "top" }}
        transformOrigin={{ horizontal: "right", vertical: "bottom" }}
        sx={{
          [`& .${listClasses.root}`]: {
            padding: "4px",
          },
          [`& .${paperClasses.root}`]: {
            padding: 0,
            minWidth: "150px",
            mb: "80px",
          },
          [`& .${dividerClasses.root}`]: {
            margin: "4px -4px",
          },
        }}
      >
        <MenuItem onClick={() => handleNavigation("profile")}>Profile</MenuItem>
        <Divider />
        <MenuItem onClick={() => handleNavigation("account")}>Account</MenuItem>
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
    </>
  );
});

export default OptionsMenu;
