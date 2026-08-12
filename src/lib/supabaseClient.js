import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// This project shares a Supabase instance with another app (the habit
// tracker) rather than getting its own project — all of Becoming Self's
// tables live in the `becoming_self` schema, not `public`. See
// supabase/migrations/0001_fitness_dashboard.sql for the schema-creation
// SQL and the manual "Exposed schemas" step that goes with it.
const SCHEMA = "becoming_self";

// Both vars are optional at build time: if they're missing (e.g. local dev
// without a Supabase project yet), `supabase` stays null and every
// repository module falls back to static mock data instead of throwing.
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, { db: { schema: SCHEMA } })
    : null;

if (!supabase && import.meta.env.DEV) {
  console.warn(
    "[supabaseClient] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY not set — " +
      "falling back to static mock data. See .env.example.",
  );
}
