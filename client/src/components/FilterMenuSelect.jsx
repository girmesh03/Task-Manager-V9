import { memo, useMemo } from "react";
import PropTypes from "prop-types";

import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import ListIcon from "@mui/icons-material/List";

const FilterMenuSelect = memo(
  ({
    onSelect,
    selectedItem,
    options,
    buttonLabel = "Select",
    buttonIcon = <ListIcon />,
  }) => {
    const menuOptions = useMemo(() => options ?? [], [options]);

    return (
      <FormControl variant="outlined" size="small">
        <Select
          value={selectedItem || ""}
          onChange={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelect(event.target.value);
          }}
          displayEmpty
          renderValue={(selected) => (
            <Stack direction="row" alignItems="center">
              {buttonIcon}
              <Typography variant="caption" style={{ marginLeft: 4 }}>
                {selected || buttonLabel}
              </Typography>
            </Stack>
          )}
          sx={{ py: 0.6 }}
        >
          <MenuItem value="">
            <em>All</em>
          </MenuItem>
          {menuOptions.map((item) => (
            <MenuItem key={item.id} value={item.label}>
              <Stack direction="row" alignItems="center">
                {item.icon && <item.icon style={{ marginRight: 8 }} />}
                {item.label}
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }
);

FilterMenuSelect.propTypes = {
  onSelect: PropTypes.func.isRequired,
  selectedItem: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
    })
  ),
  buttonLabel: PropTypes.string,
  buttonIcon: PropTypes.node,
};

export default FilterMenuSelect;
