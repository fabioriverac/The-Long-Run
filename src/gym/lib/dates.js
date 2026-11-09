const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function todayISO(now = new Date()) {
  return toISODate(now);
}

export function addDays(iso, days) {
  const date = parseISODate(iso);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

export function weekdayIndex(iso) {
  return parseISODate(iso).getDay();
}

/** Monday on or before the given day. */
export function mondayOnOrBefore(now = new Date()) {
  const date = now instanceof Date ? new Date(now.getFullYear(), now.getMonth(), now.getDate()) : parseISODate(now);
  const day = date.getDay();
  const diff = day === 0 ? 6 : day - 1;
  date.setDate(date.getDate() - diff);
  return toISODate(date);
}

/**
 * Whole weeks since the Monday a block started.
 * Can be less than 1 when the date is before the block — callers decide how to show that.
 * This is a label for the grid only. It never changes a dose.
 */
export function weekIndex(startedOn, dateISO) {
  if (!startedOn || !dateISO) return 1;
  const diff = Math.floor((parseISODate(dateISO) - parseISODate(startedOn)) / 86400000);
  if (Number.isNaN(diff)) return 1;
  return Math.floor(diff / 7) + 1;
}

export function formatLongDate(iso) {
  const date = parseISODate(iso);
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatShortDate(iso) {
  const date = parseISODate(iso);
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]}`;
}

export function weekdayName(index) {
  return WEEKDAYS[index] || "";
}
