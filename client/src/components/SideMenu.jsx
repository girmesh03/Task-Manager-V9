import { styled } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Toolbar from "@mui/material/Toolbar";
import MuiDrawer, { drawerClasses } from "@mui/material/Drawer";

import useAuth from "../hooks/useAuth";

import DepartmentMenu from "./DepartmentMenu";
import MenuContent from "./MenuContent";
import CustomLogo from "./CustomLogo";
import OptionsMenu from "./OptionsMenu";

import { drawerWidth } from "../utils/constants";

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

const SideMenu = () => {
  console.log("SideMenu");
  const { currentUser } = useAuth();
  // console.log("currentUser", currentUser);
  return (
    <Drawer
      variant="permanent"
      sx={{
        display: { xs: "none", md: "block" },
        [`& .${drawerClasses.paper}`]: {
          position: "relative",
          backgroundColor: "background.paper",
          // backgroundColor: "inherit",
          // height: "100dvh",
          // overflow: "hidden",
        },
      }}
    >
      {/* header */}
      <Toolbar variant="regular">
        <CustomLogo route="/dashboard" />
      </Toolbar>

      <Divider />

      {/* content */}
      <Stack
        direction="column"
        spacing={1}
        sx={{ flexGrow: 1, overflowY: "auto" }}
      >
        <DepartmentMenu />
        <Divider />
        <MenuContent />
      </Stack>

      {/* logout with options */}
      <Stack
        direction="row"
        justifyContent="space-between"
        sx={{
          px: 1,
          py: 3,
          gap: 1,
          alignItems: "center",
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Avatar
          sizes="small"
          alt={currentUser?.firstName}
          src={currentUser?.profilePicture}
          sx={{ width: 36, height: 36 }}
        />
        <Box sx={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          <Typography
            variant="body2"
            sx={{ fontWeight: 500, lineHeight: "16px" }}
          >
            {currentUser?.fullName}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {currentUser?.email}
          </Typography>
        </Box>
        <OptionsMenu />
      </Stack>
    </Drawer>
  );
};

export default SideMenu;
