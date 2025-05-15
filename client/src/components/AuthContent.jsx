// react
import { memo } from "react";

// mui
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ConstructionRoundedIcon from "@mui/icons-material/ConstructionRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";

// components
import { SitemarkIcon } from "./CustomIcons";

const items = [
  {
    icon: <SettingsSuggestRoundedIcon sx={{ color: "text.secondary" }} />,
    title: "Streamlined Task Management",
    description:
      "Efficiently organize, assign, and monitor tasks to keep your projects on track and deadlines in check.",
  },
  {
    icon: <ConstructionRoundedIcon sx={{ color: "text.secondary" }} />,
    title: "Robust Project Tracking",
    description:
      "Track progress across multiple projects with tools designed for reliability and accuracy.",
  },
  {
    icon: <ThumbUpAltRoundedIcon sx={{ color: "text.secondary" }} />,
    title: "User-Friendly Interface",
    description:
      "Easily navigate through tasks and reports with an intuitive design tailored for productivity.",
  },
];

const AuthContent = memo(() => {
  console.log("Auth Content");
  return (
    <Box alignContent="center">
      <Stack direction="column" spacing={4}>
        <Box sx={{ display: { xs: "none", md: "flex" } }}>
          <SitemarkIcon />
        </Box>
        {items.map((item, index) => (
          <Stack key={index} direction="row" sx={{ gap: 2 }}>
            {item.icon}
            <Box>
              <Typography gutterBottom sx={{ fontWeight: "medium" }}>
                {item.title}
              </Typography>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                {item.description}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
});

export default AuthContent;
