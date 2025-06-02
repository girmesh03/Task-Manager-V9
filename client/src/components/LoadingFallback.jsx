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
      sx={{ ...sx }}
    >
      <CircularProgress size={50} disableShrink />
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
        zIndex: theme.zIndex.drawer + 1,
        ...sx,
        backdropFilter: "blur(1px)",
      })}
    >
      <CircularProgress
        disableShrink
        size={50}
        color="primary"
        sx={(theme) => ({
          [theme.breakpoints.up("md")]: {
            marginLeft: `${drawerWidth}px`,
          },
        })}
      />
    </Backdrop>
  );
};

LoadingBackdrop.propTypes = {
  open: PropTypes.bool,
};
