import { toNumberOrNull } from "./util.js";

/** Map one raw Garmin training-status snapshot to a record. */
export function mapSnapshot(snapshot) {
  return {
    // snapshot.date is already a whole-day value ("2026-08-12T00:00:00.000Z")
    // with no meaningful time-of-day component, so a direct slice is safe
    // here (unlike activity start_time, which needs toLocalDate — see
    // scripts/lib/runs.js).
    date: snapshot.date.slice(0, 10),
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
 */
export function mapSnapshots(snapshots) {
  const mapped = snapshots.map(mapSnapshot);
  const byDate = new Map(mapped.map((snap) => [snap.date, snap]));
  return [...byDate.values()].sort((a, b) => b.date.localeCompare(a.date));
}
