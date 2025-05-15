// prop types
import PropTypes from "prop-types";

// mui
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";

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
