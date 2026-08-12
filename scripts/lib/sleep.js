import { toNumberOrNull, upsertInChunks } from "./util.js";

/** Map one raw Garmin sleep night to a row. */
export function mapNight(night) {
  return {
    date: night.date.slice(0, 10), // whole-day value, see trainingStatus.js
    sleep_start: night.sleep_start || null,
    sleep_end: night.sleep_end || null,
    total_sleep_seconds: toNumberOrNull(night.total_sleep_seconds),
    deep_sleep_seconds: toNumberOrNull(night.deep_sleep_seconds),
    light_sleep_seconds: toNumberOrNull(night.light_sleep_seconds),
    rem_sleep_seconds: toNumberOrNull(night.rem_sleep_seconds),
    awake_seconds: toNumberOrNull(night.awake_seconds),
    sleep_score: toNumberOrNull(night.sleep_score),
    avg_hrv: toNumberOrNull(night.avg_hrv),
    body_battery_change: toNumberOrNull(night.body_battery_change),
  };
}

export async function syncSleep(supabaseAdmin, nights) {
  const rows = nights.map(mapNight);
  return upsertInChunks(supabaseAdmin, "sleep_nights", rows, "date");
}
