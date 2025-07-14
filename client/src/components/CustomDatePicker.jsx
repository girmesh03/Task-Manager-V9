import { useState } from "react";
import { useForkRef } from "@mui/material/utils";
import Button from "@mui/material/Button";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  useParsedFormat,
  usePickerContext,
  useSplitFieldProps,
} from "@mui/x-date-pickers";
import ClearIcon from "@mui/icons-material/Clear";
import { useDispatch } from "react-redux";
import { setSelectedDate, clearFilters } from "../redux/features/filtersSlice";

function ButtonField(props) {
  // Extract custom onClear prop
  const { onClear, ...other } = props;
  const { forwardedProps } = useSplitFieldProps(other, "date");
  const pickerContext = usePickerContext();
  const handleRef = useForkRef(pickerContext.triggerRef, pickerContext.rootRef);
  const parsedFormat = useParsedFormat();
  const valueStr =
    pickerContext.value == null
      ? parsedFormat
      : pickerContext.value.format(pickerContext.fieldFormat);

  return (
    <Button
      {...forwardedProps}
      variant="outlined"
      ref={handleRef}
      size="small"
      startIcon={<CalendarTodayRoundedIcon fontSize="small" />}
      // Add ClearIcon as endIcon conditionally
      endIcon={
        pickerContext.value != null && (
          <ClearIcon
            fontSize="small"
            onClick={(event) => {
              event.stopPropagation();
              if (onClear) onClear();
            }}
          />
        )
      }
      sx={{ minWidth: "fit-content", pr: 1 }}
      onClick={() => pickerContext.setOpen((prev) => !prev)}
    >
      {pickerContext.label ?? valueStr}
    </Button>
  );
}

const CustomDatePicker = () => {
  const [value, setValue] = useState(null);
  const dispatch = useDispatch();

  // Dispatch selected date to Redux on accept
  const handleOnAccept = (newDate) => {
    if (!newDate) return;
    const formattedDate = newDate.format("YYYY-MM-DD");
    setValue(newDate);
    dispatch(setSelectedDate(formattedDate));
  };

  // Handle clear action: reset local state and dispatch clearFilters
  const handleClear = () => {
    setValue(null);
    dispatch(clearFilters());
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        value={value}
        label={value ? value.format("DD-MM-YYYY") : "Pick a date"}
        onChange={(newValue) => setValue(newValue)}
        // Wire up onAccept handler
        onAccept={handleOnAccept}
        slots={{ field: ButtonField }}
        slotProps={{
          // Pass handleClear to ButtonField
          field: { onClear: handleClear },
          nextIconButton: { size: "small" },
          previousIconButton: { size: "small" },
        }}
        views={["day", "month", "year"]}
      />
    </LocalizationProvider>
  );
};

export default CustomDatePicker;
