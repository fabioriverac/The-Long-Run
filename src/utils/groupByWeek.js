/**
 * Group runs by ISO week (Monday start), summing distance_km per week.
 * Returns weeks sorted oldest to newest, each labeled by the week's
 * Monday date, for a weekly-volume trend chart.
 *
 * @param {Array<{date: string, distance_km: number}>} runs
 */
export function groupByWeek(runs) {
  const totals = new Map();

  for (const run of runs) {
    const weekStart = startOfIsoWeek(run.date);
    const current = totals.get(weekStart) || 0;
    totals.set(weekStart, current + Number(run.distance_km));
  }

  return [...totals.entries()]
    .map(([weekStart, distanceKm]) => ({ weekStart, distanceKm: Math.round(distanceKm * 10) / 10 }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

/** "YYYY-MM-DD" for the Monday of the week containing the given date string. */
function startOfIsoWeek(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);
  const day = date.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return date.toISOString().slice(0, 10);
}
