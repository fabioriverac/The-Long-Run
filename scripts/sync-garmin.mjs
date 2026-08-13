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
// Either key may be omitted — each domain updates independently.
//
// IMPORTANT: this script MERGES with whatever is already on disk — it
// never trusts the input to be a complete history. It reads the existing
// runs.json + runs-archive.json, combines them with the newly mapped
// activities (keyed by garmin_activity_id — incoming wins on conflict,
// e.g. if Garmin recalculates something), then re-splits the combined set
// by the 365-day window. This makes the script safe to run with ANY input
// range — a daily sync asking for the last 45 days can never destroy older
// history the way a naive overwrite would. (It used to be a naive
// overwrite. That was a real bug: a 45-day sync against the old version of
// this script would have silently dropped 187 of 215 runs on its first
// run. Never go back to overwrite-in-place for runs.)
//
// Writes:
//   src/data/garmin/runs.json           last 365 days (Running page log)
//   src/data/garmin/runs-archive.json   everything older — never deleted
//   src/data/garmin/runs-latest.json    small slice (Home page)
//   src/data/garmin/training-status.json  last 90 days, also merged

import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mapActivities } from "./lib/runs.js";
import { mapSnapshots } from "./lib/trainingStatus.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "src", "data", "garmin");

// Trim history to what the dashboards actually render, so the repo never
// carries (or publishes) more than the site shows. Runs older than the
// window move to the archive instead of being discarded — see above.
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
    const incoming = mapActivities(data.activities);
    const existingCurrent = await readJson("runs.json");
    const existingArchive = await readJson("runs-archive.json");

    const merged = mergeById([...existingArchive, ...existingCurrent, ...incoming], "garmin_activity_id");
    const { current, archived } = splitByWindow(merged, RUNS_WINDOW_DAYS);

    await writeJson("runs.json", current);
    await writeJson("runs-archive.json", archived);
    await writeJson("runs-latest.json", current.slice(0, HOME_LATEST_RUNS_COUNT));

    results.runs = {
      current: current.length,
      archived: archived.length,
      total: merged.length,
    };
  }

  if (data.trainingStatus?.length) {
    const incoming = mapSnapshots(data.trainingStatus);
    const existing = await readJson("training-status.json");

    const merged = mergeById([...existing, ...incoming], "date");
    const { current } = splitByWindow(merged, TRAINING_STATUS_WINDOW_DAYS);

    await writeJson("training-status.json", current);
    results.trainingStatus = current.length;
  }

  console.log("Sync complete:", JSON.stringify(results, null, 2));
}

/** Read a JSON array file from the output dir, or [] if it doesn't exist yet. */
async function readJson(filename) {
  try {
    const raw = await readFile(path.join(OUTPUT_DIR, filename), "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw new Error(`Failed to read existing ${filename}: ${error.message}`);
  }
}

/**
 * Merge records by key, later entries winning on conflict, sorted
 * descending by date (most recent first).
 */
function mergeById(records, keyField) {
  const byKey = new Map(records.map((r) => [r[keyField], r]));
  return [...byKey.values()].sort((a, b) => b.date.localeCompare(a.date));
}

/** Split records into {current, archived} by a rolling day window. */
function splitByWindow(rows, days) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  return {
    current: rows.filter((row) => row.date >= cutoffStr),
    archived: rows.filter((row) => row.date < cutoffStr),
  };
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
