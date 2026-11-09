import { neon } from "@neondatabase/serverless";
import { SYNC_NOT_READY } from "../../src/gym/sync/messages.js";
import { gymEnv } from "./session.js";
import { migrationStatements } from "./tables.js";

const MIGRATION_ID = "0001_init";

export async function runMigrations(env = process.env) {
  const { databaseUrl, configured } = gymEnv(env);
  if (!databaseUrl) {
    return { ok: true, skipped: true, message: `${SYNC_NOT_READY} — skipping gym database migrations.` };
  }
  const sql = neon(databaseUrl);
  const statements = migrationStatements();
  for (const statement of statements) {
    await sql.query(statement);
  }
  await sql.query(
    `insert into gym_schema_migrations (id) values ($1) on conflict (id) do nothing`,
    [MIGRATION_ID],
  );
  return {
    ok: true,
    skipped: false,
    configured,
    message: "Gym database schema is up to date.",
  };
}
