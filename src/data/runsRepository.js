import { createTableRepository } from "./createTableRepository.js";
import fallbackRuns from "./runs.fallback.js";

const repo = createTableRepository({ table: "runs", fallbackData: fallbackRuns });

/** Fetch the most recent N runs, most recent first. */
export function getLatestRuns(limit) {
  return repo.fetchAll(limit);
}

/** Fetch the full training log, most recent first. */
export function getAllRuns() {
  return repo.fetchAll();
}
