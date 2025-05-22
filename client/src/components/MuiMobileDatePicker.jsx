import PropTypes from "prop-types";
import { Controller } from "react-hook-form";

import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

const MuiMobileDatePicker = ({ name, control, rules, ...otherProps }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <DatePicker
            {...otherProps}
            value={value ? dayjs(value) : null}
            onChange={(newValue) =>
              onChange(newValue ? dayjs(newValue).format("YYYY-MM-DD") : null)
            }
            // desktopModeMediaQuery="@media (min-width: 1900px)"
            slotProps={{
              textField: {
                error: !!error,
                helperText: error?.message,
                fullWidth: true,
                size: "small",
              },
              layout: {
                sx: {
                  margin: 0,
                  overflow: "hidden",
                  backgroundColor: "var(--template-palette-background-paper)",
                  backgroundImage: "none",
                  "& .MuiPickersCalendarHeader-root": {
                    "& .MuiPickersArrowSwitcher-root": {
                      gap: 1,
                    },
                  },
                },
              },
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
};

MuiMobileDatePicker.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  rules: PropTypes.object,
};

export default MuiMobileDatePicker;
