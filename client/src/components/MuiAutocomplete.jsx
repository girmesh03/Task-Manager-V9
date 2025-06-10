// react imports
import { memo } from "react";
import { Controller } from "react-hook-form";
import PropTypes from "prop-types";

// mui imports
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

const MuiAutocomplete = memo(
  ({ name, control, rules, label, options, multiple = true, ...props }) => {
    // console.log("MuiAutocomplete");
    return (
      <Controller
        name={name}
        control={control}
        rules={rules} // Pass validation rules
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <Autocomplete
            multiple={multiple}
            options={options}
            size="small"
            getOptionLabel={(option) => option.firstName || ""}
            value={options.filter((user) => value?.includes(user._id)) || []}
            onChange={(_, selectedUsers) =>
              onChange(selectedUsers.map((user) => user._id))
            }
            {...props} // Forward additional props
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                fullWidth
                placeholder={params?.value ? "" : `Select ${name}`}
                size="small"
                error={!!error}
                helperText={error ? error.message : null}
              />
            )}
            slotProps={{
              popupIndicator: {
                sx: {
                  border: "none",
                  height: "auto",
                },
              },
              clearIndicator: {
                sx: {
                  border: "none",
                  height: "auto",
                },
              },
            }}
          />
        )}
      />
    );
  }
);

MuiAutocomplete.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  rules: PropTypes.object,
  label: PropTypes.string,
  options: PropTypes.array.isRequired,
  multiple: PropTypes.bool,
};

export default MuiAutocomplete;
