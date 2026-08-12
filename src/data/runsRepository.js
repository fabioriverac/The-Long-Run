import runs from "./garmin/runs.json";

// Build-time data: synced from Garmin by scripts/sync-garmin.mjs into a
// plain JSON file, imported directly. No client fetch, no loading state,
// no credentials — refreshing data means re-running the sync and
// redeploying, which fits this site's actual update cadence (about once a
// day) far better than a live database ever needed to.
//
// Only used by the (lazy-loaded) Running page, deliberately — see
// latestRunsRepository.js for Home's small-slice equivalent. Keeping these
// as separate modules with separate JSON files means the full ~200-run
// history never ends up in the main bundle just because Home also needs a
// few recent runs.

/** The full training log, most recent first. */
export function getAllRuns() {
  return runs;
}
