import latestRuns from "./garmin/runs-latest.json";

// Small slice for the homepage — see runsRepository.js for why this is a
// separate module/file rather than runsRepository.js sliced two ways: Home
// isn't lazy-loaded, so it must never statically import the full training
// log just to show 3 recent runs.

/** Most recent N runs, most recent first (already pre-sliced by the sync script). */
export function getLatestRuns(limit) {
  return limit ? latestRuns.slice(0, limit) : latestRuns;
}
