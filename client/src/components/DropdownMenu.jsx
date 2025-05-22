import { useState } from "react";
import PropTypes from "prop-types";
import { Controller } from "react-hook-form";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

const DropdownMenu = ({
  name,
  control,
  rules,
  label,
  multiple = false,
  options = [],
  ...props
}) => {
  const [open, setOpen] = useState(false); // State to track whether the select menu is open

  const handleSelectChange = () => {
    // Close the menu after selection
    setOpen(false);
  };

  const handleMenuOpen = () => {
    // Open the menu
    setOpen(true);
  };

  const handleMenuClose = () => {
    // Close the menu
    setOpen(false);
  };

  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field, fieldState: { error } }) => (
        <FormControl
          fullWidth
          size="small"
          variant="outlined"
          error={!!error}
          required={!!rules?.required}
        >
          <Select
            {...field}
            labelId={`${name}-label`}
            id={name}
            name={name}
            label={label}
            displayEmpty
            {...props}
            multiple={multiple}
            open={open} // Control the open state here
            onOpen={handleMenuOpen} // Trigger to open the menu
            onClose={handleMenuClose} // Trigger to close the menu
            onChange={(event) => {
              handleSelectChange(event); // Handle change and close
              field.onChange(event); // Make sure react-hook-form handles the change
            }}
            renderValue={(selected) => {
              if (selected.length === 0) {
                return <em>Select</em>;
              }

              // If multiple is true, render as chips
              if (multiple) {
                return (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {selected.map((value, index) => (
                      <Chip
                        key={index}
                        label={
                          options.find((opt) => opt.label === value)?.label
                        }
                      />
                    ))}
                  </Box>
                );
              }

              // Otherwise, render as a single label
              return options.find((opt) => opt.label === selected)?.label;
            }}
          >
            <MenuItem value="" disabled>
              Select an option
            </MenuItem>
            {options.map((option) => (
              <MenuItem key={option.id} value={option.label}>
                {option.icon && (
                  <ListItemIcon>
                    <option.icon />
                  </ListItemIcon>
                )}
                <ListItemText primary={option.label} />
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{error?.message}</FormHelperText>
        </FormControl>
      )}
    />
  );
};

DropdownMenu.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  rules: PropTypes.object,
  label: PropTypes.string,
  multiple: PropTypes.bool,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.elementType.isRequired,
    })
  ).isRequired,
};

export default DropdownMenu;
