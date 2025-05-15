// react
import { Outlet } from "react-router";

// mui
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

// component
import AppNavbar from "../components/AppNavbar";
import Header from "../components/Header";
import SideMenu from "../components/SideMenu";

const AppLayout = () => {
  console.log("App layout");
  return (
    <Box height="100%" sx={{ display: { xs: "block", md: "flex" } }}>
      <SideMenu />
      <AppNavbar />
      <Stack direction="column" sx={{ height: "100%", flexGrow: 1 }}>
        <Header />
        {/* Main content */}
        <Stack
          direction="column"
          component="main"
          sx={{ height: "100%", overflow: "auto", flexGrow: 1 }}
        >
          <Outlet />
        </Stack>
      </Stack>
    </Box>
  );
};

export default AppLayout;
