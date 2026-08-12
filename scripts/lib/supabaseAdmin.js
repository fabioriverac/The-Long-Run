import { createClient } from "@supabase/supabase-js";

// Server-side only: uses the service_role key, which bypasses Row Level
// Security. This must never run in the browser bundle — it's only ever
// invoked from scripts/sync-garmin.mjs, itself only ever run by the
// scheduled ingestion Routine (or manually, by you, for testing).
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment " +
      "running this script. See .env.example.",
  );
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
