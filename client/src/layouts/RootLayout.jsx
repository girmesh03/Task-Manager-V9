import { Suspense } from "react";
import { Outlet } from "react-router-dom";

import Box from "@mui/material/Box";

import { LoadingFallback } from "../components/LoadingFallback";

const RootLayout = () => {
  console.log("root layout");
  return (
    <Box
      sx={(theme) => ({
        width: "100%",
        height: "100dvh",
        overflow: "hidden",
        position: "relative",
        [theme.breakpoints.up("xl")]: {
          maxWidth: theme.breakpoints.values.xl,
          margin: "0 auto",
        },
        "&::before": {
          content: '""',
          display: "block",
          position: "absolute",
          zIndex: -1,
          inset: 0,
          backgroundImage:
            "radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))",
          backgroundRepeat: "no-repeat",
          ...theme.applyStyles("dark", {
            backgroundImage:
              "radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))",
          }),
        },
      })}
    >
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </Box>
  );
};

export default RootLayout;
