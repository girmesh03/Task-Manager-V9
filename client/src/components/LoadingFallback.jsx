import PropTypes from "prop-types";

import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Backdrop from "@mui/material/Backdrop";

import { drawerWidth } from "../utils/constants";

export const LoadingFallback = ({ height = "100%", sx = {} }) => {
  return (
    <Box
      width="100%"
      height={height}
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <CircularProgress size={50} disableShrink sx={{ ...sx }} />
    </Box>
  );
};

LoadingFallback.propTypes = {
  height: PropTypes.string,
};

export const LoadingBackdrop = ({ open = false, sx = {} }) => {
  if (!open) return null;
  return (
    <Backdrop
      open={open}
      sx={(theme) => ({
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        zIndex: (theme) => theme.zIndex.drawer + 1,
        ...sx,
        backdropFilter: "blur(1px)",
        [theme.breakpoints.up("md")]: {
          width: `calc(100vw - ${drawerWidth}px)`,
          marginLeft: `${drawerWidth}px`,
        },
      })}
    >
      <CircularProgress color="primary" />
    </Backdrop>
  );
};

LoadingBackdrop.propTypes = {
  open: PropTypes.bool,
};
