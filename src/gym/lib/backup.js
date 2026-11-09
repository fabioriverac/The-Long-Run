import { DATA_TABLES } from "./types.js";

export function serializeBackup(snapshot, exportedAt = new Date().toISOString()) {
  const bundle = { version: 1, app: "meso", exportedAt };
  for (const table of DATA_TABLES) bundle[table] = snapshot[table] || [];
  return bundle;
}

export function parseBackup(input) {
  if (!input || input.app !== "meso" || input.version !== 1) {
    throw new Error("That file isn't a Meso backup.");
  }
  const tables = {};
  for (const table of DATA_TABLES) {
    if (!Array.isArray(input[table])) throw new Error("That file isn't a Meso backup.");
    tables[table] = input[table].filter((row) => row && typeof row.id === "string");
  }
  return tables;
}
