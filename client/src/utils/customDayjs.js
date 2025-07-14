import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";

// Extend plugins once globally
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const TZ = dayjs.tz.guess();
const TIMEZONE = import.meta.env.VITE_CLIENT_TIMEZONE || dayjs.tz.guess();

export const customDayjs = (date) => {
  const input = date ? dayjs(date) : dayjs();
  return input.tz(TIMEZONE || TZ);
};

export const getFormattedDate = (
  currentDate = dayjs().format("YYYY-MM-DD")
) => {
  // Get the current time components (hour, minute, second, millisecond) based on server's TZ
  const now = dayjs().tz(TIMEZONE);

  // Parse the input date string and set it to the correct timezone
  const parsedDatePart = dayjs(currentDate).tz(TIMEZONE).startOf("day");
  // Validate if the date is correct
  if (!parsedDatePart.isValid()) {
    console.error(`getFormattedDate invalid base date input: ${currentDate}`);
    return null;
  }

  // Convert the final dayjs object to a native Date object
  return parsedDatePart
    .hour(now.hour())
    .minute(now.minute())
    .second(now.second())
    .millisecond(now.millisecond());
};
