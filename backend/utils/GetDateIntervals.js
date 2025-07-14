// backend/utils/GetDateIntervals.js
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import isBetween from "dayjs/plugin/isBetween.js";

// Extend dayjs with necessary plugins for UTC, timezones, comparisons, and range checks
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isBetween);

const TIMEZONE = "Africa/Addis_Ababa";

export const getDateIntervals = (currentDateInput) => {
  const todayStart = dayjs(currentDateInput)
    .utc() // Convert to UTC
    .tz(process.env.TZ || TIMEZONE) // Convert to the server's timezone
    .startOf("day");

  // Validate if the parsed date is valid
  if (!todayStart.isValid()) {
    console.error(`Invalid date input: ${currentDateInput}`);
    return null; // Indicate invalid input by returning null
  }

  // End of the reference day ("today") in the server's timezone
  const todayEnd = todayStart.endOf("day"); // Set to the end of the day (23:59:59.999) in TIMEZONE

  // --- Last 30 Days Interval Calculation ---
  // This interval *includes* the reference day ("today") and extends back 29 full days before it, totalling 30 days.
  // Starts at the beginning of the day 29 days prior to the start of `todayStart`.
  const last30DaysStart = todayStart.subtract(29, "day").startOf("day"); // Correctly subtracts from start of day
  // Ends at the end of the reference day `todayEnd`.
  const last30DaysEnd = todayEnd;

  // --- Previous 30 Days Interval Calculation ---
  // This interval is immediately preceding the "Last 30 Days" interval and is also 30 days long.
  // It starts the day *after* the "Previous 30 Days" period would end.
  // The day *before* `last30DaysStart` marks the end of the "Previous 30 Days" period.
  const previous30DaysEnd = last30DaysStart.subtract(1, "day").endOf("day"); // End is the day before last30DaysStart, at end of that day
  // Starts 29 full days before the `previous30DaysEnd` start (which is previous30DaysEnd day at 00:00:00.000).
  const previous30DaysStart = previous30DaysEnd
    .subtract(29, "day")
    .startOf("day");

  // --- Last 6 Months Interval Calculation ---
  // This interval *includes* the current month (based on `todayStart`) and extends back 5 full months before it, totalling 6 months.
  // Starts at the beginning of the month, 5 months prior to the month of `todayStart`.
  const sixMonthsAgoStart = todayStart.subtract(5, "month").startOf("month");

  // --- Generate Date Range Arrays for Charting/Aggregation Keys ---
  // Array of labels for the last 30 days (e.g., 'Feb 24', 'Mar 1') - Used for chart axis labels
  const daysInLast30 = [];
  // Array of 'YYYY-MM-DD' strings for daily aggregation keys - Matches the format used in pipelines
  const dateRange = [];
  // Iterate day by day from the start of the "Last 30 Days" period up to and including the end of the reference day ("today").
  let currentDay = last30DaysStart.clone(); // Use clone to avoid modifying original dayjs object
  // Condition: Loop as long as `currentDay` is on or before `todayEnd` *at the day level*.
  while (currentDay.isSameOrBefore(todayEnd, "day")) {
    daysInLast30.push(currentDay.format("MMM D")); // e.g., 'Feb 24'
    dateRange.push(currentDay.format("YYYY-MM-DD")); // e.g., '2025-02-24' - This format is crucial for pipeline matching
    currentDay = currentDay.add(1, "day"); // Move to the start of the next calendar day in TIMEZONE
  }

  // Generate array of last six months names (e.g., 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul') for labels
  const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
    // Start from the month of `sixMonthsAgoStart` and add months.
    // This ensures we get labels for the last 6 calendar months including the current one.
    return sixMonthsAgoStart.clone().add(i, "month").format("MMM");
  });

  // Generate array of last six months in 'YYYY-MM' format (e.g., '2024-02', ..., '2024-07') for aggregation keys.
  // Matches the format potentially used in monthly aggregation stages in pipelines.
  const sixMonthRange = Array.from({ length: 6 }, (_, i) => {
    // Start from the month of `sixMonthsAgoStart` and add months for aggregation keys.
    return sixMonthsAgoStart.clone().add(i, "month").format("YYYY-MM");
  });

  // Return intervals as native Date objects, which Mongoose queries expect for date fields.
  // Return ranges as string arrays.
  return {
    last30DaysStart: last30DaysStart.toDate(), // Convert to native Date
    last30DaysEnd: last30DaysEnd.toDate(), // Convert to native Date
    previous30DaysStart: previous30DaysStart.toDate(), // Convert to native Date
    previous30DaysEnd: previous30DaysEnd.toDate(), // Convert to native Date
    daysInLast30, // Array of 'MMM D' strings
    dateRange, // Array of 'YYYY-MM-DD' strings
    sixMonthsAgo: sixMonthsAgoStart.toDate(), // Start date (as Date object) for 6-month range query
    lastSixMonths, // Array of 'MMM' strings
    sixMonthRange, // Array of 'YYYY-MM' strings
  };
};

export const getFormattedDate = (currentDate, limit = 0) => {
  const now = dayjs();

  // Let's strictly reproduce the source code logic as it was interpreted:
  // const parsedDatePart = dayjs(currentDate).utc(true).tz(TIMEZONE);
  const parsedDatePart = dayjs(currentDate);
  if (!parsedDatePart.isValid()) {
    console.error(
      `getFormattedDate received invalid base date input: ${currentDate}`
    );
    return null;
  }

  const finalDateTime = parsedDatePart
    .hour(now.hour())
    .minute(now.minute() + limit)
    .second(now.second())
    .millisecond(now.millisecond());

  // Convert the final dayjs object to a native Date object
  return finalDateTime.toDate();
};

export const customDayjs = (date) => {
  const now = dayjs();
  const input = date
    ? dayjs(date)
        .hour(now.hour())
        .minute(now.minute())
        .second(now.second())
        .millisecond(now.millisecond())
    : now;
  return input.tz(process.env.TZ || TIMEZONE);
};
