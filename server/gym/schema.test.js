import { getTableColumns } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { schema } from "../../db/schema.js";
import { buildCoachSeed } from "../../src/gym/data/coachTemplate.js";
import { DATA_TABLES } from "../../src/gym/lib/types.js";
import { migrationStatements, TABLES } from "./tables.js";

describe("gym schema", () => {
  it("keeps Drizzle, SQL, and the client table list on the same columns", () => {
    expect(Object.keys(TABLES).sort()).toEqual([...DATA_TABLES].sort());
    const sqlText = migrationStatements().join("\n");
    for (const [key, table] of Object.entries(TABLES)) {
      expect(sqlText).toContain(`create table if not exists "${table.sqlName}"`);
      const drizzleColumns = getTableColumns(schema[key]);
      for (const column of table.columns) {
        expect(sqlText).toContain(column.column);
        expect(drizzleColumns[column.field]?.name).toBe(column.column);
      }
    }
  });

  it("only seeds fields the database knows how to store", () => {
    const bundle = buildCoachSeed(new Date(2026, 10, 9));
    for (const [key, rows] of Object.entries(bundle.tables)) {
      const fields = new Set(TABLES[key].columns.map((column) => column.field));
      for (const row of rows) {
        for (const field of Object.keys(row)) expect(fields.has(field)).toBe(true);
      }
    }
  });
});
