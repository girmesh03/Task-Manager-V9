import PropTypes from "prop-types";

import { Toolbar, ToolbarButton } from "@mui/x-data-grid";
import Button from "@mui/material/Button";

import generateReport from "../utils/generateReport";

const CustomToolbar = ({ items, selectedItemIds }) => {
  const selectedItem = Array.from(selectedItemIds.ids);
  const isExportDisabled = selectedItem.length === 0;

  // console.log("selectedItemIds:", selectedItemIds);
  // console.log("selectedItem:", selectedItem);
  // console.log("isExportDisabled:", isExportDisabled);
  // console.log("items:", items);

  return (
    <Toolbar>
      <ToolbarButton
        render={(props) => (
          <Button
            {...props}
            variant="outlined"
            size="small"
            disabled={isExportDisabled}
            onClick={() => generateReport(items, selectedItem)}
          >
            Export
          </Button>
        )}
      />
    </Toolbar>
  );
};

CustomToolbar.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedItemIds: PropTypes.object.isRequired,
};

export default CustomToolbar;
