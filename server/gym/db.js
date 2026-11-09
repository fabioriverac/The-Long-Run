import { neon } from "@neondatabase/serverless";
import { and, gt, isNotNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { schema } from "../../db/schema.js";
import { runMigrations } from "./migrate.js";
import { gymEnv } from "./session.js";
import { TABLES, fromDbRow, toDbValues } from "./tables.js";

let databasePromise = null;

export function resetGymDbForTests() {
  databasePromise = null;
}

async function connect() {
  const env = gymEnv();
  if (!env.databaseUrl) return null;
  await runMigrations();
  const client = neon(env.databaseUrl);
  return drizzle(client, { schema });
}

export function getGymDb() {
  if (!databasePromise) {
    databasePromise = connect().catch((error) => {
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

export async function upsertChange(db, change) {
  const tableDef = TABLES[change.entity];
  const drizzleTable = schema[change.entity];
  if (!tableDef || !drizzleTable || !change?.data?.id) return { ok: false, reason: "bad_change" };
  if (change.data.sample) return { ok: true, ignored: true };
  const receivedAt = new Date().toISOString();
  const values = toDbValues(tableDef, { ...change.data, id: change.id || change.data.id }, receivedAt);
  const { id, ...rest } = values;
  await db
    .insert(drizzleTable)
    .values({ ...rest, id })
    .onConflictDoUpdate({
      target: drizzleTable.id,
      set: rest,
      setWhere: sql`${drizzleTable.updatedAt} <= ${values.updatedAt}`,
    });
  return { ok: true };
}

export async function changesSince(db, since) {
  const serverChanges = [];
  for (const [entity, drizzleTable] of Object.entries(schema)) {
    const tableDef = TABLES[entity];
    const rows = since
      ? await db
          .select()
          .from(drizzleTable)
          .where(and(isNotNull(drizzleTable.serverReceivedAt), gt(drizzleTable.serverReceivedAt, since)))
      : await db.select().from(drizzleTable);
    for (const row of rows) {
      const data = fromDbRow(tableDef, row);
      serverChanges.push({
        entity,
        id: data.id,
        updatedAt: data.updatedAt,
        deleted: Boolean(data.deletedAt),
        data,
      });
    }
  }
  return serverChanges;
}
