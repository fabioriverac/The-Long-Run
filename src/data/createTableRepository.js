import { supabase } from "../lib/supabaseClient.js";

/**
 * Shared fetch-with-fallback logic for a single Supabase table. Every
 * dashboard data source (runs, training status, daily health, sleep)
 * follows the same shape: query Supabase, ordered by date descending; if
 * Supabase isn't configured, the query errors, or the table is empty
 * (e.g. before the first Garmin sync has run), fall back to static mock
 * data so the site never shows a broken or blank state.
 *
 * @param {object} config
 * @param {string} config.table - Supabase table name
 * @param {Array} config.fallbackData - static data shaped like table rows
 * @param {string} [config.orderBy] - column to sort by, default "date"
 */
export function createTableRepository({ table, fallbackData, orderBy = "date" }) {
  async function fetchAll(limit) {
    if (!supabase) {
      return applyLimit(fallbackData, limit);
    }

    let query = supabase.from(table).select("*").order(orderBy, { ascending: false });
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error(`[${table}] Supabase query failed, using fallback data:`, error.message);
      return applyLimit(fallbackData, limit);
    }

    if (!data || data.length === 0) {
      return applyLimit(fallbackData, limit);
    }

    return data;
  }

  return { fetchAll };
}

function applyLimit(list, limit) {
  return limit ? list.slice(0, limit) : list;
}
