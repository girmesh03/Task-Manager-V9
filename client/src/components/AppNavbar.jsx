// react
import { useState } from "react";

// mui
import Stack from "@mui/material/Stack";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";

// layout
import HeaderLayout from "../layouts/HeaderLayout";

// components
import CustomLogo from "./CustomLogo";
import ColorModeIconDropdown from "./ColorModeIconDropdown";
import MenuButton from "./MenuButton";
import SideMenuMobile from "../components/SideMenuMobile";

const AppNavbar = () => {
  console.log("AppNavbar");

  const [open, setOpen] = useState(false);

  const toggleDrawer = (newOpen) => () => {
    setOpen(newOpen);
  };

  return (
    <HeaderLayout
      position="sticky"
      sx={{ display: { xs: "block", md: "none" } }}
    >
      <CustomLogo route="/dashboard" />
      <Stack direction="row" alignItems="center" spacing={1}>
        <ColorModeIconDropdown />
        <MenuButton aria-label="menu" onClick={toggleDrawer(true)}>
          <MenuRoundedIcon />
        </MenuButton>
        <SideMenuMobile open={open} toggleDrawer={toggleDrawer} />
      </Stack>
    </HeaderLayout>
  );
};

export default AppNavbar;
