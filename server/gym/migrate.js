import { neon } from "@neondatabase/serverless";
import { SYNC_NOT_READY } from "../../src/gym/sync/messages.js";
import { gymEnv } from "./session.js";
import { migrationStatements } from "./tables.js";

const ALTERS = [
  `alter table "feedback" add column if not exists "muscle" text`,
  `alter table "feedback" add column if not exists "applied_delta" integer`,
];

export async function runMigrations(env = process.env) {
  const { databaseUrl, configured } = gymEnv(env);
  if (!databaseUrl) {
    return { ok: true, skipped: true, message: `${SYNC_NOT_READY} — skipping gym database migrations.` };
  }
  const sql = neon(databaseUrl);
  const statements = [...migrationStatements(), ...ALTERS];
  for (const statement of statements) {
    await sql.query(statement);
  }
  for (const id of ["0001_init", "0002_feedback_muscle"]) {
    await sql.query(
      `insert into gym_schema_migrations (id) values ($1) on conflict (id) do nothing`,
      [id],
    );
  }
  return {
    ok: true,
    skipped: false,
    configured,
    message: "Gym database schema is up to date.",
  };
}
