import { createTableRepository } from "./createTableRepository.js";
import fallbackTrainingStatus from "./trainingStatus.fallback.js";

const repo = createTableRepository({
  table: "training_status_snapshots",
  fallbackData: fallbackTrainingStatus,
});

/** Fetch training status snapshots, most recent first. */
export function getTrainingStatus(limit) {
  return repo.fetchAll(limit);
}
