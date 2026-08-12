import { round, toLocalDate, toNumberOrNull } from "./util.js";

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

/** Map one raw Garmin activity (from list_activities) to a run record. */
export function mapActivity(activity) {
  const distanceKm = round(Number(activity.distance_meters) / 1000, 2);
  const durationSeconds = Math.round(Number(activity.duration_seconds));

  return {
    id: `garmin-${activity.activity_id}`,
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

/**
 * Map a raw list_activities() result into sorted, deduped run records,
 * most recent first.
 */
export function mapActivities(activities) {
  const runs = activities.filter((a) => a.activity_type === "running").map(mapActivity);

  const byId = new Map(runs.map((run) => [run.garmin_activity_id, run]));
  return [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
}
