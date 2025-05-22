import { Suspense } from "react";
import { Outlet } from "react-router";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";

import AppNavbar from "../components/AppNavbar";
import Header from "../components/Header";
import SideMenu from "../components/SideMenu";
import { LoadingFallback } from "../components/LoadingFallback";

import { drawerWidth } from "../utils/constants";

const AppLayout = () => {
  console.log("App layout");
  return (
    <Box
      width="100%"
      height="100%"
      sx={{ display: { xs: "block", md: "flex" } }}
    >
      <SideMenu />
      <AppNavbar />
      <Stack
        direction="column"
        sx={{
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          height: "100%",
          flexGrow: 1,
        }}
      >
        <Header />
        {/* Main content */}
        <Stack
          direction="column"
          component="main"
          sx={{ width: "100%", height: "100%", overflow: "auto", flexGrow: 1 }}
        >
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </Stack>
      </Stack>
    </Box>
  );
};

export default AppLayout;
