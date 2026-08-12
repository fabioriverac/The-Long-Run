#!/usr/bin/env node
// Syncs Garmin data (already fetched via the CustomGarmin MCP by the agent
// running this) into Supabase. Run by the scheduled Claude Code Routine —
// see the Routine's prompt for exactly how the input file gets built —
// or manually for testing.
//
// Usage:
//   node scripts/sync-garmin.mjs <path-to-garmin-data.json>
//
// Expected input JSON shape (the raw shape each CustomGarmin MCP tool
// already returns — this script does no reshaping of the top level, only
// per-row mapping):
//   {
//     "activities": [...],     // list_activities(...).activities
//     "trainingStatus": [...], // get_training_status(...).snapshots
//     "dailyHealth": [...],    // get_daily_health(...).days
//     "sleep": [...]           // get_sleep(...).nights
//   }
// Any key may be omitted or empty — each domain syncs independently.
//
// Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.

import { readFile } from "node:fs/promises";
import { supabaseAdmin } from "./lib/supabaseAdmin.js";
import { syncRuns } from "./lib/runs.js";
import { syncTrainingStatus } from "./lib/trainingStatus.js";
import { syncDailyHealth } from "./lib/dailyHealth.js";
import { syncSleep } from "./lib/sleep.js";

async function main() {
  const inputPath = process.argv[2];
  if (!inputPath) {
    console.error("Usage: node scripts/sync-garmin.mjs <path-to-garmin-data.json>");
    process.exit(1);
  }

  const raw = await readFile(inputPath, "utf-8");
  const data = JSON.parse(raw);

  const results = {};

  if (data.activities?.length) {
    results.runs = await syncRuns(supabaseAdmin, data.activities);
  }
  if (data.trainingStatus?.length) {
    results.trainingStatus = await syncTrainingStatus(supabaseAdmin, data.trainingStatus);
  }
  if (data.dailyHealth?.length) {
    results.dailyHealth = await syncDailyHealth(supabaseAdmin, data.dailyHealth);
  }
  if (data.sleep?.length) {
    results.sleep = await syncSleep(supabaseAdmin, data.sleep);
  }

  console.log("\nSync complete:", JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error("Sync failed:", error.message);
  process.exit(1);
});
