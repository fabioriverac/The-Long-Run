/**
 * Group runs by ISO week (Monday start), summing distance_km per week.
 * Returns weeks sorted oldest to newest, each labeled by the week's
 * Monday date, for a weekly-volume trend chart.
 *
 * Weeks with no runs (e.g. a rest week between two training weeks) are
 * backfilled with a zero-distance entry rather than omitted — the caller
 * (WeeklyVolumeChart) takes the last N weeks off the end of this array, so
 * a missing rest week would silently compress the chart's timeline (its
 * "last 12 weeks" would actually span more than 12 real calendar weeks).
 *
 * @param {Array<{date: string, distance_km: number}>} runs
 */
export function groupByWeek(runs) {
  const totals = new Map();

  for (const run of runs) {
    const weekStart = startOfIsoWeek(run.date);
    const current = totals.get(weekStart) || 0;
    totals.set(weekStart, current + toDistanceKm(run.distance_km));
  }

  const weeks = [...totals.entries()]
    .map(([weekStart, distanceKm]) => ({ weekStart, distanceKm: Math.round(distanceKm * 10) / 10 }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));

  return backfillZeroWeeks(weeks);
}

/**
 * Coerce a run's distance to a finite number, treating a missing/null/
 * non-numeric value as zero contribution rather than propagating NaN —
 * one run with a bad distance_km shouldn't poison its entire week's total
 * (and every later week's bar, since a NaN total can never recover).
 */
function toDistanceKm(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

/** Fill any gap weeks between the first and last week with a zero entry. */
function backfillZeroWeeks(weeks) {
  if (weeks.length === 0) return weeks;

  const byWeek = new Map(weeks.map((w) => [w.weekStart, w.distanceKm]));
  const lastWeekStart = weeks[weeks.length - 1].weekStart;

  const filled = [];
  for (let cursor = weeks[0].weekStart; cursor <= lastWeekStart; cursor = addDays(cursor, 7)) {
    filled.push({ weekStart: cursor, distanceKm: byWeek.get(cursor) ?? 0 });
  }
  return filled;
}

/** "YYYY-MM-DD" for the Monday of the week containing the given date string. */
function startOfIsoWeek(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);
  const day = date.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return date.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" for the given date string plus N days. */
function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
