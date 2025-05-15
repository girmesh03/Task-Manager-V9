// react
import PropTypes from "prop-types";

// mui
import { styled } from "@mui/material/styles";
import { AppBar, Toolbar as MuiToolbar } from "@mui/material";
import { tabsClasses } from "@mui/material/Tabs";

// styled
const Toolbar = styled(MuiToolbar)({
  width: "100%",
  padding: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  flexShrink: 0,
  [`& ${tabsClasses.list}`]: {
    gap: "8px",
    p: "8px",
    pb: 0,
  },
});

const HeaderLayout = ({ children, position = "fixed", sx = {} }) => {
  // console.log("HeaderLayout");
  return (
    <AppBar
      position={position}
      sx={{
        // display: { xs: "auto", md: "none" },
        // boxShadow: "none",
        bgcolor: "background.paper",
        backgroundImage: "none",
        borderBottom: "1px solid",
        borderColor: "divider",
        top: "var(--template-frame-height, 0px)",
        ...sx,
      }}
    >
      <Toolbar variant="regular">{children}</Toolbar>
    </AppBar>
  );
};

HeaderLayout.propTypes = {
  children: PropTypes.node.isRequired,
  position: PropTypes.string,
  sx: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
};

export default HeaderLayout;
