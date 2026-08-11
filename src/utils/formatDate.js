/**
 * Format a "YYYY-MM-DD" date-only string for display.
 *
 * Plain `new Date("2026-08-09")` parses the string as UTC midnight, but
 * `Intl.DateTimeFormat` then renders it in the visitor's local timezone —
 * so anyone west of UTC sees the previous day. Since our content dates
 * (runs, posts) don't carry a time component, we always format them in
 * UTC so the calendar date shown matches the date in the data everywhere.
 *
 * @param {string} dateString - date-only string, e.g. "2026-08-09"
 * @param {Intl.DateTimeFormatOptions} options
 */
export function formatDate(dateString, options) {
  return new Intl.DateTimeFormat("en-US", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(dateString));
}
