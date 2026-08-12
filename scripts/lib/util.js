/**
 * Convert a UTC activity start timestamp to the runner's local calendar
 * date ("YYYY-MM-DD"). Naively truncating a UTC timestamp to a date (or
 * running it through `new Date()` + local formatting on whatever machine
 * happens to run the code) reintroduces the off-by-one date bug already
 * fixed elsewhere in this codebase (see src/utils/formatDate.js) — a run
 * just after midnight local time can land on the wrong calendar day.
 *
 * Garmin's activity list doesn't expose the device's timezone directly,
 * so this is pinned to a configured zone rather than guessed per-activity.
 * Override with RUNNER_TIMEZONE if training moves to a different timezone.
 */
const RUNNER_TIMEZONE = process.env.RUNNER_TIMEZONE || "Europe/Berlin";

export function toLocalDate(isoTimestamp, timeZone = RUNNER_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // en-CA formats as YYYY-MM-DD, which is what a Postgres `date` column wants.
  return formatter.format(new Date(isoTimestamp));
}

/** Round to N decimal places as a number (not a string). */
export function round(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Coerce a value that may be a numeric string, number, or null/undefined. */
export function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isNaN(num) ? null : num;
}

/** Upsert rows into a table in chunks, logging the result. */
export async function upsertInChunks(supabaseAdmin, table, rows, conflictColumn, chunkSize = 200) {
  if (rows.length === 0) {
    console.log(`[${table}] nothing to sync`);
    return { upserted: 0 };
  }

  let upserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabaseAdmin.from(table).upsert(chunk, { onConflict: conflictColumn });
    if (error) {
      throw new Error(`[${table}] upsert failed: ${error.message}`);
    }
    upserted += chunk.length;
  }

  console.log(`[${table}] upserted ${upserted} row(s)`);
  return { upserted };
}
