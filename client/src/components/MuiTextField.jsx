// react
import { memo } from "react";
import propTypes from "prop-types";
import { Controller } from "react-hook-form";

// mui
import TextField from "@mui/material/TextField";

const MuiTextField = memo(
  ({
    name,
    control,
    rules,
    label,
    type = "text",
    multiline = false,
    rows = 1,
    select = false,
    children,
    ...props
  }) => {
    // console.log("MuiTextField");
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            id={name}
            name={name}
            label={label}
            type={type}
            size="small"
            fullWidth
            variant="outlined"
            required={!!rules?.required}
            multiline={multiline}
            rows={rows}
            select={select}
            error={!!error}
            helperText={error?.message}
            {...props}
          >
            {select && children}
          </TextField>
        )}
      />
    );
  }
);

MuiTextField.propTypes = {
  name: propTypes.string.isRequired,
  control: propTypes.object.isRequired,
  rules: propTypes.object,
  label: propTypes.string,
  type: propTypes.string,
  multiline: propTypes.bool,
  rows: propTypes.number,
  maxRows: propTypes.number,
  select: propTypes.bool,
  children: propTypes.node,
};

export default MuiTextField;
