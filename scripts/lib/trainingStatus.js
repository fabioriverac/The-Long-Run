import { requireString, toNumberOrNull } from "./util.js";

/** Map one raw Garmin training-status snapshot to a record. */
export function mapSnapshot(snapshot) {
  const date = requireString(snapshot.date, "date");

  return {
    // snapshot.date is already a whole-day value ("2026-08-12T00:00:00.000Z")
    // with no meaningful time-of-day component, so a direct slice is safe
    // here (unlike activity start_time, which needs toLocalDate — see
    // scripts/lib/runs.js).
    date: date.slice(0, 10),
    vo2max: toNumberOrNull(snapshot.vo2max),
    training_status: snapshot.training_status || null,
    training_readiness_score: toNumberOrNull(snapshot.training_readiness_score),
    race_predictor_5k_seconds: toNumberOrNull(snapshot.race_predictor_5k_seconds),
    race_predictor_10k_seconds: toNumberOrNull(snapshot.race_predictor_10k_seconds),
    race_predictor_half_marathon_seconds: toNumberOrNull(snapshot.race_predictor_half_marathon_seconds),
    race_predictor_marathon_seconds: toNumberOrNull(snapshot.race_predictor_marathon_seconds),
  };
}

/**
 * Map a raw get_training_status() result into sorted, deduped snapshot
 * records, most recent first.
 *
 * As with mapActivities, a single malformed snapshot is skipped (loudly)
 * rather than aborting the whole sync — see the comment there.
 */
export function mapSnapshots(snapshots) {
  const mapped = [];
  for (const snapshot of snapshots) {
    try {
      mapped.push(mapSnapshot(snapshot));
    } catch (error) {
      console.warn(`Skipping invalid training-status snapshot: ${error.message}`);
    }
  }

  const byDate = new Map(mapped.map((snap) => [snap.date, snap]));
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
}
