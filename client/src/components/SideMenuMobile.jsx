import { memo } from "react";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";
import PropTypes from "prop-types";

import { styled } from "@mui/material/styles";
import MuiDrawer, { drawerClasses } from "@mui/material/Drawer";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";

import { useSelector, useDispatch } from "react-redux";
import { setLogout, selectIsLoading } from "../redux/features/authSlice";

import useAuth from "../hooks/useAuth";

import DepartmentMenu from "./DepartmentMenu";
import MenuButton from "./MenuButton";
import MenuContent from "./MenuContent";

import {drawerWidth} from "../utils/constants";

// styled components
const Drawer = styled(MuiDrawer)({
  width: drawerWidth,
  flexShrink: 0,
  boxSizing: "border-box",
  mt: 10,
  [`& .${drawerClasses.paper}`]: {
    width: drawerWidth,
    boxSizing: "border-box",
  },
});

const SideMenuMobile = memo(({ open, toggleDrawer }) => {
  const { currentUser, currentUserId } = useAuth();

  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);

  const navigate = useNavigate();
  const route = `/dashboard/users/${currentUserId}/profile`;

  const handleLogout = async () => {
    try {
      const response = await dispatch(setLogout()).unwrap();
      navigate("/", { replace: true });
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error?.data?.message || "An error occurred");
    }
  };

  return (
    <Drawer
      anchor="right"
      // variant="temporary"
      open={open}
      onClose={toggleDrawer(false)}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundImage: "none",
          backgroundColor: "background.paper",
          overflow: "hidden",
        },
      }}
    >
      {/* header */}
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{ p: 1 }}
        onClick={toggleDrawer(false)}
      >
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            flexGrow: 1,
            p: 1,
            overflowX: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          <Avatar
            sizes="small"
            alt={currentUser?.firstName}
            sx={{ width: 36, height: 36 }}
          />
          <Typography
            variant="body2"
            onClick={() => navigate(route)}
            sx={{
              overflowX: "hidden",
              textOverflow: "ellipsis",
              cursor: "pointer",
            }}
          >
            {currentUser?.fullName}
          </Typography>
        </Stack>
        <MenuButton showBadge>
          <NotificationsRoundedIcon />
        </MenuButton>
      </Stack>

      <Divider />

      {/* content */}
      <Stack
        direction="column"
        spacing={1}
        onClick={toggleDrawer(false)}
        sx={{ p: 1, flexGrow: 1, overflowY: "auto" }}
      >
        <DepartmentMenu />
        <Divider />
        <MenuContent />
      </Stack>

      {/* logout */}
      <Stack
        direction="row"
        sx={{
          p: 1,
          gap: 1,
          alignItems: "center",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Button
          variant="outlined"
          fullWidth
          startIcon={<LogoutRoundedIcon />}
          onClick={handleLogout}
          disabled={isLoading}
          loading={isLoading}
          loadingPosition="center"
          loadingIndicator={<CircularProgress size={20} />}
        >
          Logout
        </Button>
      </Stack>
    </Drawer>
  );
});

SideMenuMobile.propTypes = {
  open: PropTypes.bool.isRequired,
  toggleDrawer: PropTypes.func.isRequired,
};

export default SideMenuMobile;
