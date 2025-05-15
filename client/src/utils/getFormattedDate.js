import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

// Extend dayjs with UTC and Timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = dayjs.tz.guess();

const getFormattedDate = (currentDate) => {
  // Get the current time in timezone
  const now = dayjs().tz(TIMEZONE);

  // Parse the input date string and set it to the correct timezone
  const formattedDate = dayjs(currentDate)
    .tz(TIMEZONE) // Apply the desired timezone first
    .utc(true) // Convert to UTC to standardize the time
    .hour(now.hour())
    .minute(now.minute())
    .second(now.second())
    .millisecond(now.millisecond());

  // Validate if the date is correct
  if (!formattedDate.isValid()) {
    return null;
  }

  return formattedDate.toDate();
};

export default getFormattedDate;
