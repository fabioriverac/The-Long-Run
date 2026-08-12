import { toNumberOrNull, upsertInChunks } from "./util.js";

/** Map one raw Garmin daily-health day to a row. */
export function mapDay(day) {
  return {
    date: day.date.slice(0, 10), // whole-day value, see trainingStatus.js
    steps: toNumberOrNull(day.steps),
    resting_hr: toNumberOrNull(day.resting_hr),
    avg_stress: toNumberOrNull(day.avg_stress),
    max_stress: toNumberOrNull(day.max_stress),
    respiration_avg: toNumberOrNull(day.respiration_avg),
    spo2_avg: toNumberOrNull(day.spo2_avg),
    intensity_minutes_moderate: toNumberOrNull(day.intensity_minutes_moderate),
    intensity_minutes_vigorous: toNumberOrNull(day.intensity_minutes_vigorous),
  };
}

export async function syncDailyHealth(supabaseAdmin, days) {
  const rows = days.map(mapDay);
  return upsertInChunks(supabaseAdmin, "daily_health", rows, "date");
}
