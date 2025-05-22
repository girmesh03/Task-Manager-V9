import { memo } from "react";

import Stack from "@mui/material/Stack";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";

import HeaderLayout from "../layouts/HeaderLayout";

import NavbarBreadcrumbs from "./NavbarBreadcrumbs";
// import Search from "./Search";
// import CustomDatePicker from "./CustomDatePicker";
import MenuButton from "./MenuButton";
import ColorModeIconDropdown from "./ColorModeIconDropdown";

const Header = memo(() => {
  console.log("Header");
  return (
    <HeaderLayout
      position="sticky"
      sx={{ display: { xs: "none", md: "block" } }}
    >
      <NavbarBreadcrumbs />
      <Stack direction="row" sx={{ gap: 1 }}>
        {/* <Search /> */}
        {/* <CustomDatePicker /> */}
        <MenuButton showBadge aria-label="Open notifications">
          <NotificationsRoundedIcon />
        </MenuButton>
        <ColorModeIconDropdown />
      </Stack>
    </HeaderLayout>
  );
});

export default Header;
