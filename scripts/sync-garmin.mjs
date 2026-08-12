#!/usr/bin/env node
// Turns Garmin data (already fetched via the CustomGarmin MCP by the agent
// running this) into the site's build-time data files. No network calls,
// no credentials — deterministic mapping only.
//
// Usage:
//   node scripts/sync-garmin.mjs <path-to-garmin-data.json>
//
// Expected input JSON shape (the raw shape each CustomGarmin MCP tool
// already returns):
//   {
//     "activities": [...],     // list_activities(...).activities
//     "trainingStatus": [...]  // get_training_status(...).snapshots
//   }
// Either key may be omitted — each domain updates independently, only
// overwriting its own output file.
//
// Writes:
//   src/data/garmin/runs.json          full training log (Running page)
//   src/data/garmin/runs-latest.json   small slice (Home page)
//   src/data/garmin/training-status.json
//
// runs.json and runs-latest.json are separate files, not one file sliced
// two ways, so that Home's bundle (not lazy-loaded) only ever pulls in the
// small file — see src/data/latestRunsRepository.js vs runsRepository.js.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mapActivities } from "./lib/runs.js";
import { mapSnapshots } from "./lib/trainingStatus.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "src", "data", "garmin");

// Trim history to what the dashboards actually render, so the repo never
// carries (or publishes) more than the site shows.
const RUNS_WINDOW_DAYS = 365;
const TRAINING_STATUS_WINDOW_DAYS = 90;
const HOME_LATEST_RUNS_COUNT = 6;

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node scripts/sync-garmin.mjs <path-to-garmin-data.json>");
    process.exit(1);
  }

  const raw = await readFile(inputPath, "utf-8");
  const data = JSON.parse(raw);

  await mkdir(OUTPUT_DIR, { recursive: true });

  const results = {};

  if (data.activities?.length) {
    const runs = withinWindow(mapActivities(data.activities), RUNS_WINDOW_DAYS);
    await writeJson("runs.json", runs);
    await writeJson("runs-latest.json", runs.slice(0, HOME_LATEST_RUNS_COUNT));
    results.runs = runs.length;
  }

  if (data.trainingStatus?.length) {
    const snapshots = withinWindow(mapSnapshots(data.trainingStatus), TRAINING_STATUS_WINDOW_DAYS);
    await writeJson("training-status.json", snapshots);
    results.trainingStatus = snapshots.length;
  }

  console.log("Sync complete:", JSON.stringify(results, null, 2));
}

function withinWindow(rows, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return rows.filter((row) => row.date >= cutoffStr);
}

async function writeJson(filename, data) {
  const filePath = path.join(OUTPUT_DIR, filename);
  await writeFile(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${data.length} row(s) to src/data/garmin/${filename}`);
}

main().catch((error) => {
  console.error("Sync failed:", error.message);
  process.exit(1);
});
