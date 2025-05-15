// backend/utils/GetDateIntervals.js

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

// Extend dayjs with UTC and Timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = dayjs.tz.guess();

export const getDateIntervals = (
  currentDate = dayjs().tz(TIMEZONE).format("YYYY-MM-DD")
) => {
  // Get the current time in timezone
  const now = dayjs().tz(TIMEZONE);

  // Parse the input date string and set it to the correct timezone
  const today = dayjs(currentDate)
    .tz(TIMEZONE) // Apply the desired timezone first
    .utc(true) // Convert to UTC to standardize the time
    .hour(now.hour())
    .minute(now.minute())
    .second(now.second())
    .millisecond(now.millisecond());

  // Validate if the date is correct
  if (!today.isValid()) {
    return null;
  }

  // Last 30 Days End = Exactly today with current time
  const last30DaysEnd = today; // Keep as a dayjs object

  // Last 30 Days Start = 29 days before today
  const last30DaysStart = today.subtract(29, "day");

  // Previous 30 Days End = 1 day before last30DaysStart
  const previous30DaysEnd = last30DaysStart.subtract(1, "day");

  // Previous 30 Days Start = 29 days before previous30DaysEnd
  const previous30DaysStart = previous30DaysEnd.subtract(29, "day");

  // Calculate six months ago while keeping the correct timezone
  const sixMonthsAgo = today.subtract(5, "month");

  // Generate date range for last 30 days
  const daysInLast30 = [];
  const dateRange = Array.from({ length: 30 }, (_, i) => {
    const date = last30DaysStart.add(i, "day");
    daysInLast30.push(date.format("MMM D")); // 'Feb 24'
    return date.format("YYYY-MM-DD"); // '2025-02-24'
  });

  return {
    last30DaysEnd: last30DaysEnd.toDate(),
    last30DaysStart: last30DaysStart.toDate(),
    previous30DaysEnd: previous30DaysEnd.toDate(),
    previous30DaysStart: previous30DaysStart.toDate(),
    daysInLast30,
    dateRange,
    sixMonthsAgo: sixMonthsAgo.toDate(),
  };
};

export const getFormattedDate = (currentDate, limit = 0) => {
  // Get the current time in timezone
  const now = dayjs().tz(TIMEZONE);

  // Parse the input date string and set it to the correct timezone
  const formattedDate = dayjs(currentDate)
    .tz(TIMEZONE) // Apply the desired timezone first
    .utc(true) // Convert to UTC to standardize the time
    .hour(now.hour())
    .minute(now.minute() + limit)
    .second(now.second())
    .millisecond(now.millisecond());

  // Validate if the date is correct
  if (!formattedDate.isValid()) {
    return null;
  }

  return formattedDate.toDate();
};
