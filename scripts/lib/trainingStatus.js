import { toNumberOrNull, upsertInChunks } from "./util.js";

/** Map one raw Garmin training-status snapshot to a row. */
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

export async function syncTrainingStatus(supabaseAdmin, snapshots) {
  const rows = snapshots.map(mapSnapshot);
  return upsertInChunks(supabaseAdmin, "training_status_snapshots", rows, "date");
}
