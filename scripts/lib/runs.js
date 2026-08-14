import { requireNumber, requireString, round, toLocalDate, toNumberOrNull } from "./util.js";

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
  const activityId = requireNumber(activity.activity_id, "activity_id");
  const startTime = requireString(activity.start_time, "start_time");
  const distanceMeters = requireNumber(activity.distance_meters, "distance_meters");
  const durationSecondsRaw = requireNumber(activity.duration_seconds, "duration_seconds");

  const distanceKm = round(distanceMeters / 1000, 2);
  const durationSeconds = Math.round(durationSecondsRaw);

  // A run at or below zero distance/duration isn't a data point, it's a
  // sensor glitch or a paused-then-discarded activity — classifyType()
  // divides duration by distance, so a zero here would silently produce
  // Infinity/NaN pace instead of a loud failure.
  if (distanceKm <= 0) {
    throw new Error(`Invalid distance_km (must be > 0): ${distanceKm} for activity_id ${activityId}`);
  }
  if (durationSeconds <= 0) {
    throw new Error(`Invalid duration_seconds (must be > 0): ${durationSeconds} for activity_id ${activityId}`);
  }

  return {
    id: `garmin-${activityId}`,
    garmin_activity_id: activityId,
    title: activity.activity_name,
    date: toLocalDate(startTime),
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
 *
 * A single malformed activity (seen in practice: a duplicate/GPS-artifact
 * record with distance but duration_seconds "0") shouldn't take down an
 * entire sync — this pipeline runs unattended on a schedule, and the other
 * 499 good activities in the same batch still deserve to sync. mapActivity
 * still throws per-record (so a bad record can never silently coerce into
 * corrupt data); here that throw is caught, logged loudly, and the record
 * is skipped rather than aborting the whole batch.
 */
export function mapActivities(activities) {
  const runs = [];
  for (const activity of activities.filter((a) => a.activity_type === "running")) {
    try {
      runs.push(mapActivity(activity));
    } catch (error) {
      console.warn(`Skipping invalid activity ${activity.activity_id ?? "(no id)"}: ${error.message}`);
    }
  }

  const byId = new Map(runs.map((run) => [run.garmin_activity_id, run]));
  return [...byId.values()].sort((a, b) => b.date.localeCompare(a.date));
}
