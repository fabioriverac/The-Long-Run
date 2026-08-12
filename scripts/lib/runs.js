import { round, toLocalDate, toNumberOrNull, upsertInChunks } from "./util.js";

// Sub-3 marathon goal pace, in seconds/km (10800s / 42.195km ≈ 4:16/km).
// Used only to classify a run's `type` — a heuristic, not a Garmin field.
// Garmin doesn't label runs as Easy/Workout/Long run; this project's own
// judgment call, adjustable here as training paces change.
const GOAL_MARATHON_PACE_SECONDS_PER_KM = 256;
const LONG_RUN_DISTANCE_KM = 21;
const WORKOUT_PACE_TOLERANCE = 0.1; // within 10% of goal pace counts as a workout

function classifyType(distanceKm, durationSeconds) {
  if (distanceKm >= LONG_RUN_DISTANCE_KM) return "Long run";

  const paceSecondsPerKm = durationSeconds / distanceKm;
  const paceDelta = Math.abs(paceSecondsPerKm - GOAL_MARATHON_PACE_SECONDS_PER_KM) / GOAL_MARATHON_PACE_SECONDS_PER_KM;
  if (paceDelta <= WORKOUT_PACE_TOLERANCE) return "Workout";

  return "Easy";
}

/** Map one raw Garmin activity (from list_activities) to a `runs` row. */
export function mapActivity(activity) {
  const distanceKm = round(Number(activity.distance_meters) / 1000, 2);
  const durationSeconds = Math.round(Number(activity.duration_seconds));

  return {
    garmin_activity_id: Number(activity.activity_id),
    title: activity.activity_name,
    date: toLocalDate(activity.start_time),
    distance_km: distanceKm,
    duration_seconds: durationSeconds,
    avg_hr: toNumberOrNull(activity.avg_hr),
    max_hr: toNumberOrNull(activity.max_hr),
    type: classifyType(distanceKm, durationSeconds),
    note: activity.description || null,
    source: "garmin",
  };
}

export async function syncRuns(supabaseAdmin, activities) {
  const runningActivities = activities.filter((a) => a.activity_type === "running");
  const rows = runningActivities.map(mapActivity);
  return upsertInChunks(supabaseAdmin, "runs", rows, "garmin_activity_id");
}
