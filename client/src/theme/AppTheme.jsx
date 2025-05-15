import { useMemo } from "react";
import PropTypes from "prop-types";
import { ThemeProvider, createTheme } from "@mui/material/styles";

import { inputsCustomizations } from "./inputs";
import { dataDisplayCustomizations } from "./dataDisplay";
import { feedbackCustomizations } from "./feedback";
import { navigationCustomizations } from "./navigation";
import { surfacesCustomizations } from "./surfaces";
import { colorSchemes, typography, shadows, shape } from "./themePrimitives";

const AppTheme = (props) => {
  const { children, themeComponents } = props;

  const theme = useMemo(() => {
    return createTheme({
      cssVariables: {
        colorSchemeSelector: "data-mui-color-scheme",
        cssVarPrefix: "template",
      },
      colorSchemes,
      typography,
      shadows,
      shape,
      components: {
        ...inputsCustomizations,
        ...dataDisplayCustomizations,
        ...feedbackCustomizations,
        ...navigationCustomizations,
        ...surfacesCustomizations,
        ...themeComponents,
      },
    });
  }, [themeComponents]);

  return (
    <ThemeProvider theme={theme} disableTransitionOnChange>
      {children}
    </ThemeProvider>
  );
};

AppTheme.propTypes = {
  children: PropTypes.node,
  themeComponents: PropTypes.object,
};

export default AppTheme;
