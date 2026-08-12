/**
 * Format a pace string ("4:15 /km") from raw distance/duration, instead of
 * storing a pre-formatted string that can drift out of sync with the
 * underlying numbers. Rounds to the nearest second per km.
 *
 * @param {number} distanceKm
 * @param {number} durationSeconds
 */
export function formatPace(distanceKm, durationSeconds) {
  if (!distanceKm || !durationSeconds) return "—";

  const secondsPerKm = durationSeconds / distanceKm;
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);

  // Carry a rounded-up 60s into the next minute (e.g. 4:60 -> 5:00).
  const normalizedMinutes = seconds === 60 ? minutes + 1 : minutes;
  const normalizedSeconds = seconds === 60 ? 0 : seconds;

  return `${normalizedMinutes}:${String(normalizedSeconds).padStart(2, "0")} /km`;
}

/**
 * Format total duration from seconds as "1:42:30" (h:mm:ss) or "42:30"
 * (mm:ss) if under an hour. Used for run durations and race predictions.
 * @param {number} durationSeconds
 */
export function formatDuration(durationSeconds) {
  if (durationSeconds === null || durationSeconds === undefined) return "—";

  const totalSeconds = Math.round(durationSeconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedMinutes = hours > 0 ? String(minutes).padStart(2, "0") : minutes;
  const paddedSeconds = String(seconds).padStart(2, "0");

  return hours > 0
    ? `${hours}:${paddedMinutes}:${paddedSeconds}`
    : `${paddedMinutes}:${paddedSeconds}`;
}
