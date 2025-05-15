// react
import { memo } from "react";
import PropTypes from "prop-types";
import { Controller } from "react-hook-form";

// dayjs and date picker
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { MobileDatePicker } from "@mui/x-date-pickers/MobileDatePicker";

const MuiMobileDatePicker = memo(({ name, control, rules, ...otherProps }) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field: { onChange, value }, fieldState: { error } }) => (
          <MobileDatePicker
            {...otherProps}
            value={value ? dayjs(value) : null}
            onChange={(newValue) =>
              onChange(newValue ? dayjs(newValue).format("YYYY-MM-DD") : null)
            }
            slotProps={{
              textField: {
                error: !!error,
                helperText: error?.message,
                fullWidth: true,
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
              // mobilePaper: {
              //   sx: {
              //     overflow: "hidden",
              //     margin: 0,
              //     minHeight: "100vh",
              //     width: "100vw",
              //     backgroundColor: "var(--template-palette-background-paper)",
              //     backgroundImage: "none",
              //   },
              // },
            }}
          />
        )}
      />
    </LocalizationProvider>
  );
});

MuiMobileDatePicker.propTypes = {
  name: PropTypes.string.isRequired,
  control: PropTypes.object.isRequired,
  rules: PropTypes.object,
};

export default MuiMobileDatePicker;
