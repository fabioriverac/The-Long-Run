import { createTableRepository } from "./createTableRepository.js";
import fallbackDailyHealth from "./dailyHealth.fallback.js";

const repo = createTableRepository({ table: "daily_health", fallbackData: fallbackDailyHealth });

/** Fetch daily health snapshots, most recent first. */
export function getDailyHealth(limit) {
  return repo.fetchAll(limit);
}
