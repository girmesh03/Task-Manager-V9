// react
// import { memo } from "react";

// mui
import Stack from "@mui/material/Stack";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";

// layout
import HeaderLayout from "../layouts/HeaderLayout";

// components
import NavbarBreadcrumbs from "./NavbarBreadcrumbs";
// import Search from "./Search";
// import CustomDatePicker from "./CustomDatePicker";
import MenuButton from "./MenuButton";
import ColorModeIconDropdown from "./ColorModeIconDropdown";

const Header = () => {
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
};

export default Header;
