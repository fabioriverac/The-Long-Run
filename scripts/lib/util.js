/**
 * Convert a UTC activity start timestamp to the runner's local calendar
 * date ("YYYY-MM-DD"). Naively truncating a UTC timestamp to a date (or
 * running it through `new Date()` + local formatting on whatever machine
 * happens to run the code) reintroduces the off-by-one date bug already
 * fixed elsewhere in this codebase (see src/utils/formatDate.js) — a run
 * just after midnight local time can land on the wrong calendar day.
 *
 * Garmin's activity list doesn't expose the device's timezone directly,
 * so this is pinned to a configured zone rather than guessed per-activity.
 * Override with RUNNER_TIMEZONE if training moves to a different timezone.
 */
const RUNNER_TIMEZONE = process.env.RUNNER_TIMEZONE || "Europe/Berlin";

export function toLocalDate(isoTimestamp, timeZone = RUNNER_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA formats as YYYY-MM-DD, which is what we want for the JSON date field.
  return formatter.format(new Date(isoTimestamp));
}

/** Round to N decimal places as a number (not a string). */
export function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Coerce a value that may be a numeric string, number, or null/undefined. */
export function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

/**
 * Coerce a value expected to always be present (an id, a distance, a
 * duration — fields the downstream dedup/window/pace logic can't function
 * without). Unlike toNumberOrNull, a missing or non-numeric value here is a
 * data problem worth stopping the sync for, not a null to carry forward
 * silently — `Number(undefined)` is NaN, and NaN as a dedup key collapses
 * every record missing that field into one, silently dropping the rest.
 */
export function requireNumber(value, fieldName) {
  const num = Number(value);
  if (value === null || value === undefined || value === "" || Number.isNaN(num)) {
    throw new Error(`Missing or invalid required field "${fieldName}": ${JSON.stringify(value)}`);
  }
  return num;
}

/** Same as requireNumber, but for a required non-empty string field. */
export function requireString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Missing or invalid required field "${fieldName}": ${JSON.stringify(value)}`);
  }
  return value;
}
