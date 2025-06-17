// react
import { memo } from "react";
import { useNavigate } from "react-router";
import PropTypes from "prop-types";

// mui
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";

const CustomLogo = memo(({ route, sx = {} }) => {
  // console.log("CustomLogo");
  const navigate = useNavigate();

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      spacing={1}
      onClick={() => navigate(route)}
      sx={{ cursor: "pointer", maxWidth: 250 }}
    >
      <Box
        sx={{
          width: "1.5rem",
          height: "1.5rem",
          bgcolor: "black",
          borderRadius: "999px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          alignSelf: "center",
          backgroundImage:
            "linear-gradient(135deg, hsl(210, 98%, 60%) 0%, hsl(210, 100%, 35%) 100%)",
          color: "hsla(210, 100%, 95%, 0.9)",
          border: "1px solid",
          borderColor: "hsl(210, 100%, 55%)",
          boxShadow: "inset 0 2px 5px rgba(255, 255, 255, 0.3)",
        }}
      >
        <DashboardRoundedIcon color="inherit" sx={{ fontSize: "1rem" }} />
      </Box>
      <Typography
        variant="h4"
        component="h1"
        sx={{ color: "text.primary", ...sx }}
      >
        Taskmanager
      </Typography>
    </Stack>
  );
});

CustomLogo.propTypes = {
  route: PropTypes.string.isRequired,
  sx: PropTypes.object,
};

export default CustomLogo;
