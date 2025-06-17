import { memo, useState } from "react";

import Stack from "@mui/material/Stack";
import Badge, { badgeClasses } from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import NotificationsIcon from "@mui/icons-material/Notifications";

import { useGetNotificationStatsQuery } from "../redux/features/notificationApiSlice";

import HeaderLayout from "../layouts/HeaderLayout";
import NavbarBreadcrumbs from "./NavbarBreadcrumbs";
import Search from "./Search";
import CustomDatePicker from "./CustomDatePicker";
import ColorModeIconDropdown from "./ColorModeIconDropdown";
import NotificationMenu from "./NotificationMenu";

const Header = memo(() => {
  // Use the RTKQ hook to get live data
  const { data: stats } = useGetNotificationStatsQuery(undefined, {
    // Polling can be useful as a fallback
    // pollingInterval: 60000, //How frequently to automatically re-fetch data (in milliseconds). Defaults to 0 (off).
  });

  const unreadCount = stats?.unreadCount || 0;

  const [anchorEl, setAnchorEl] = useState(null);
  const isOpen = Boolean(anchorEl);

  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  return (
    <HeaderLayout
      position="sticky"
      sx={{ display: { xs: "none", md: "block" } }}
    >
      <NavbarBreadcrumbs />
      <Stack direction="row" sx={{ gap: 1 }}>
        <Search />
        <CustomDatePicker />

        {/* Notification Icon with Badge */}
        <IconButton
          size="small"
          aria-label={`show ${unreadCount} new notifications`}
          color="inherit"
          onClick={handleOpenMenu}
          aria-controls={isOpen ? "notifications-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={isOpen ? "true" : undefined}
        >
          <Badge
            color="error"
            invisible={unreadCount === 0}
            badgeContent={unreadCount}
            sx={{ [`& .${badgeClasses.badge}`]: { right: -4, top: -4 } }}
          >
            <NotificationsIcon />
          </Badge>
        </IconButton>

        {/* Notification Menu */}
        <NotificationMenu
          anchorEl={anchorEl}
          open={isOpen}
          onClose={handleCloseMenu}
        />
        <ColorModeIconDropdown />
      </Stack>
    </HeaderLayout>
  );
});

export default Header;
