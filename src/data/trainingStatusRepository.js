import snapshots from "./garmin/training-status.json";

// Build-time data — see runsRepository.js for why this isn't a live fetch.

/** Most recent N training-status snapshots, most recent first. */
export function getTrainingStatus(limit) {
  return limit ? snapshots.slice(0, limit) : snapshots;
}
