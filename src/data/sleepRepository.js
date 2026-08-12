import { createTableRepository } from "./createTableRepository.js";
import fallbackSleep from "./sleep.fallback.js";

const repo = createTableRepository({ table: "sleep_nights", fallbackData: fallbackSleep });

/** Fetch sleep nights, most recent first. */
export function getSleep(limit) {
  return repo.fetchAll(limit);
}
