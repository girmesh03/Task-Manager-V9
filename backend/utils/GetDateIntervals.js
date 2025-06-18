// backend/utils/GetDateIntervals.js
// Purpose: Calculates and formats standard date ranges for statistics, relative to a given date.
// Interactions: Used by StatisticsController and ReportController. Uses dayjs.
// Edge Cases: Handles invalid input date, timezone guessing reliability.
// Dependencies: dayjs, dayjs/plugin/utc, dayjs/plugin/timezone, dayjs/plugin/isSameOrBefore.
// Refactor: Corrected getDateIntervals logic for standard date ranges (start/end of day).
// NOTE: getFormattedDate retains its original, less conventional logic as provided.

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";

// Extend dayjs with necessary plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);

// Get the system's local timezone where the server is running
// Note: Guessing timezone on the server might not be reliable in all deployment environments.
// A more robust approach might involve configuring the timezone via environment variable or user preference.
const TIMEZONE = dayjs.tz.guess();
// console.log(`Using server timezone for date calculations: ${TIMEZONE}`); // Optional logging

/**
 * Calculates date intervals (last 30 days, previous 30 days, last 6 months)
 * relative to a given reference date ("today"), using standard start/end of day boundaries.
 * @param {string | Date | dayjs.Dayjs} currentDateInput - The date representing "today" for the calculation.
 * @returns {object | null} An object containing the date intervals as native Date objects and formatted arrays, or null if input is invalid.
 */
export const getDateIntervals = (
  currentDateInput // Accepts Date object, dayjs object, or string
) => {
  // Parse the input date and set it to the server's timezone at the start of the day.
  const todayStart = dayjs(currentDateInput).tz(TIMEZONE).startOf("day");

  // Validate if the date is correct after parsing
  if (!todayStart.isValid()) {
    console.error(
      `getDateIntervals received invalid date input: ${currentDateInput}`
    );
    return null; // Indicate invalid input
  }

  // End of the reference day ("today")
  const todayEnd = todayStart.endOf("day");

  // --- Last 30 Days Interval ---
  // Starts 29 full days before the *start* of today (inclusive of today), i.e., 30 days total.
  const last30DaysStart = todayStart.subtract(29, "day");
  const last30DaysEnd = todayEnd; // Ends at the end of today

  // --- Previous 30 Days Interval ---
  // This interval immediately precedes the "Last 30 Days" interval.
  // It starts 30 full days before the *start* of the "Last 30 Days" period's start.
  const previous30DaysEnd = last30DaysStart.subtract(1, "day").endOf("day"); // Ends the day before last30DaysStart
  const previous30DaysStart = previous30DaysEnd
    .subtract(29, "day")
    .startOf("day"); // Starts 29 days before previous30DaysEnd

  // --- Last 6 Months Interval ---
  // Starts at the beginning of the month 5 months before the *start* of today (inclusive of the current month).
  const sixMonthsAgoStart = todayStart.subtract(5, "month").startOf("month");
  // Ends at the end of today.
  const sixMonthsAgoEnd = todayEnd;

  // --- Generate Date Range Arrays for Charting/Aggregation Keys ---
  // Array of labels for the last 30 days (e.g., 'Feb 24')
  const daysInLast30 = [];
  // Array of 'YYYY-MM-DD' strings for daily aggregation keys
  const dateRange = [];
  let currentDay = last30DaysStart;
  // Iterate from the start of the last 30 days up to and including the end of today
  while (currentDay.isSameOrBefore(todayEnd, "day")) {
    daysInLast30.push(currentDay.format("MMM D")); // e.g., 'Feb 24'
    dateRange.push(currentDay.format("YYYY-MM-DD")); // e.g., '2025-02-24'
    currentDay = currentDay.add(1, "day"); // Move to the start of the next day
  }

  // Generate array of last six months names (e.g., 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul') for labels
  const lastSixMonths = Array.from({ length: 6 }, (_, i) => {
    // Start from sixMonthsAgoStart and add months for labels
    return sixMonthsAgoStart.add(i, "month").format("MMM");
  });

  // Generate array of last six months in 'YYYY-MM' format (e.g., '2024-02', ..., '2024-07') for aggregation keys
  const sixMonthRange = Array.from({ length: 6 }, (_, i) => {
    // Start from sixMonthsAgoStart and add months for aggregation keys
    return sixMonthsAgoStart.add(i, "month").format("YYYY-MM");
  });

  // Return date objects (native Date type) for use in Mongoose queries (which expect Date objects)
  return {
    last30DaysStart: last30DaysStart.toDate(),
    last30DaysEnd: last30DaysEnd.toDate(),
    previous30DaysStart: previous30DaysStart.toDate(),
    previous30DaysEnd: previous30DaysEnd.toDate(),
    daysInLast30, // Array of strings for chart labels
    dateRange, // Array of 'YYYY-MM-DD' strings for daily aggregation keys
    sixMonthsAgo: sixMonthsAgoStart.toDate(), // Start date (as Date object) for 6-month range query
    lastSixMonths, // Array of 'MMM' strings for chart labels
    sixMonthRange, // Array of 'YYYY-MM' strings for monthly aggregation keys
  };
};

/**
 * Formats a date, incorporating the server's current time and an optional minute offset.
 * NOTE: This function's logic, particularly the use of utc(true) followed by manual time setting
 * using the *current* time components, results in a date object whose date part is from the input
 * but whose time part is determined by the execution moment, potentially adding 'limit' minutes.
 * Its specific use case is not conventional for standard date handling but is preserved as provided.
 * @param {string | Date | dayjs.Dayjs} currentDate - The date part to use.
 * @param {number} [limit=0] - Optional minute offset added to the current minute.
 * @returns {Date | null} A native Date object with the adjusted time, or null if input is invalid.
 */
export const getFormattedDate = (currentDate, limit = 0) => {
  // Get the current time in the server's timezone at the moment this function is called.
  const now = dayjs().tz(TIMEZONE);

  // Parse the input date and set it to the server's timezone initially at the start of the day.
  let formattedDate = dayjs(currentDate).tz(TIMEZONE).startOf("day");

  // Validate if the date is correct after parsing
  if (!formattedDate.isValid()) {
    console.error(
      `getFormattedDate received invalid date input: ${currentDate}`
    );
    return null;
  }

  // The original logic here seems to then take the *date* part of the input (`formattedDate`)
  // and combine it with the *time* part derived from `now`, applying an optional minute limit,
  // and then converting this composite date/time to UTC.
  // This is unusual for standard date formatting or interval calculation.
  // Example: If currentDate = '2023-10-15' and now = '2023-11-14 14:30', the result might effectively be
  // a Date object representing '2023-10-15 14:30:XX' in UTC, depending on exactly how `utc(true)` interacts here.
  // We preserve this original behavior exactly as found, but note its unconventional nature.
  formattedDate = formattedDate
    // Take the DATE part of formattedDate (which is based on currentDate input)
    // and then set its time components to match the time components of 'now', plus the minute limit.
    // The `utc(true)` call after setting time components is the ambiguous part.
    // It likely converts the resulting date/time from the server's local timezone *to* UTC.
    .hour(now.hour())
    .minute(now.minute() + limit) // Add 'limit' minutes to the current minute derived from 'now'
    .second(now.second())
    .millisecond(now.millisecond())
    .utc(true); // Convert this specific date/time from TIMEZONE to UTC

  return formattedDate.toDate(); // Return as native Date object
};
