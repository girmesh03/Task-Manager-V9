import { useState, Suspense } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { toast } from "react-toastify";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import useTheme from "@mui/material/styles/useTheme";
import useMediaQuery from "@mui/material/useMediaQuery";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import LoginIcon from "@mui/icons-material/Login";

import useAuth from "../hooks/useAuth";

import { useSelector, useDispatch } from "react-redux";
import { setLogout, selectIsLoading } from "../redux/features/authSlice";

import HeaderLayout from "./HeaderLayout";
import CustomLogo from "../components/CustomLogo";
import ColorModeIconDropdown from "../components/ColorModeIconDropdown";
import { LoadingFallback } from "../components/LoadingFallback";

const AuthLayout = () => {
  console.log("AuthLayout");
  const { isAuthenticated } = useAuth();
  const pathname = useLocation().pathname;

  const dispatch = useDispatch();
  const isLoading = useSelector(selectIsLoading);

  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  // breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const handleClick = (event) => {
    event.stopPropagation();
    event.preventDefault();
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      const response = await dispatch(setLogout()).unwrap();
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error?.data?.message);
    } finally {
      handleClose();
    }
  };

  return (
    <Box height="100%" display="flex" flexDirection="column">
      <HeaderLayout position="sticky" sx={{ display: "block" }}>
        <CustomLogo route={isAuthenticated ? "/dashboard" : "/"} />
        <Stack direction="row" spacing={1}>
          <ColorModeIconDropdown />
          {isMobile ? (
            <>
              <IconButton
                id="auth-icon"
                aria-controls={openMenu ? "auth-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={openMenu ? "true" : undefined}
                onClick={handleClick}
                size="small"
              >
                <PersonIcon />
              </IconButton>

              <Menu
                id="auth-menu"
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                sx={{ "& .MuiList-root": { py: 0 } }}
              >
                {isAuthenticated ? (
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                ) : (
                  <MenuItem component={Link} to="/login" onClick={handleClose}>
                    <LoginIcon sx={{ mr: 1 }} />
                    Login
                  </MenuItem>
                )}
              </Menu>
            </>
          ) : isAuthenticated ? (
            <Button
              variant="outlined"
              size="small"
              onClick={handleLogout}
              startIcon={<LogoutIcon />}
              loading={isLoading}
              loadingPosition="center"
              loadingIndicator={<CircularProgress size={20} />}
            >
              Logout
            </Button>
          ) : pathname === "/" ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<LoginIcon />}
              component={Link}
              to="/login"
            >
              Login
            </Button>
          ) : null}
        </Stack>
      </HeaderLayout>
      <Stack direction="column" sx={{ flexGrow: 1, overflow: "auto" }}>
        <Suspense fallback={<LoadingFallback />}>
          <Outlet />
        </Suspense>
      </Stack>
    </Box>
  );
};

export default AuthLayout;
