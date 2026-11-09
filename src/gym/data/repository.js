import { parseBackup, serializeBackup } from "../lib/backup.js";
import { DATA_TABLES, SEED_VERSION } from "../lib/types.js";
import { buildCoachSeed } from "./coachTemplate.js";
import { buildSampleHistory } from "./sampleHistory.js";
import { chooseRecord } from "../sync/merge.js";

async function deleteOutboxFor(storage, entity, entityId, updatedAt) {
  const outbox = await storage.getAll("outbox");
  for (const item of outbox) {
    if (item.entity === entity && item.entityId === entityId && (!updatedAt || item.updatedAt <= updatedAt)) {
      await storage.delete("outbox", item.id);
    }
  }
}

export function createRepository(storage) {
  async function saveRecord(table, record, opts = {}) {
    if (!DATA_TABLES.includes(table)) throw new Error(`Unknown table ${table}`);
    if (!record?.id) throw new Error(`Missing id for ${table}`);
    const existing = await storage.get(table, record.id);
    const updatedAt = opts.updatedAt || new Date().toISOString();
    if (existing && opts.onlyIfNewer && existing.updatedAt > updatedAt) return existing;
    const next = {
      ...existing,
      ...record,
      id: record.id,
      createdAt: existing?.createdAt || record.createdAt || updatedAt,
      updatedAt,
      deletedAt: record.deletedAt === undefined ? existing?.deletedAt || null : record.deletedAt,
    };
    await storage.put(table, next);
    const sync = opts.sync !== false && !next.sample;
    if (sync) {
      await deleteOutboxFor(storage, table, next.id);
      await storage.put("outbox", {
        id: `${table}:${next.id}:${next.updatedAt}`,
        entity: table,
        entityId: next.id,
        updatedAt: next.updatedAt,
      });
    }
    return next;
  }

  async function saveMeta(record) {
    const existing = await storage.get("meta", record.id);
    const next = { ...existing, ...record };
    await storage.put("meta", next);
    return next;
  }

  return {
    saveRecord,
    saveMeta,

    async loadAll() {
      const entries = await Promise.all(DATA_TABLES.map(async (table) => [table, await storage.getAll(table)]));
      const data = Object.fromEntries(entries);
      const metaRows = await storage.getAll("meta");
      const meta = Object.fromEntries(metaRows.map((row) => [row.id, row]));
      const outbox = await storage.getAll("outbox");
      return { ...data, meta, outbox };
    },

    async ensureSeed(now = new Date()) {
      const marker = await storage.get("meta", "seed");
      if (marker?.version >= SEED_VERSION) return false;
      const bundle = buildCoachSeed(now);
      for (const [table, rows] of Object.entries(bundle.tables)) {
        for (const row of rows) {
          await saveRecord(table, row, { sync: true, updatedAt: row.updatedAt });
        }
      }
      await storage.put("meta", {
        id: "seed",
        version: SEED_VERSION,
        seededAt: new Date(now).toISOString(),
      });
      return true;
    },

    async ensureSample(today) {
      const marker = await storage.get("meta", "sample");
      if (marker?.builtFor === today) return false;
      const sample = buildSampleHistory(today);
      for (const [table, rows] of Object.entries(sample)) {
        for (const row of rows) {
          const existing = await storage.get(table, row.id);
          if (!existing) await saveRecord(table, row, { sync: false, updatedAt: row.updatedAt });
        }
      }
      await storage.put("meta", { id: "sample", builtFor: today });
      return true;
    },

    async softDelete(table, id) {
      const existing = await storage.get(table, id);
      if (!existing) return null;
      return saveRecord(table, { ...existing, deletedAt: new Date().toISOString() });
    },

    async exportBundle() {
      return serializeBackup(await this.loadAll());
    },

    async importBundle(input) {
      const tables = parseBackup(input);
      for (const table of DATA_TABLES) await storage.clear(table);
      await storage.clear("outbox");
      for (const table of DATA_TABLES) {
        for (const row of tables[table]) {
          await saveRecord(table, row, {
            sync: !row.sample,
            updatedAt: row.updatedAt || new Date().toISOString(),
          });
        }
      }
      await storage.put("meta", { id: "seed", version: SEED_VERSION, seededAt: new Date().toISOString(), imported: true });
    },

    async clearAll() {
      for (const table of DATA_TABLES) await storage.clear(table);
      await storage.clear("meta");
      await storage.clear("outbox");
    },

    async applyRemoteChanges(changes) {
      for (const change of changes || []) {
        if (!DATA_TABLES.includes(change.entity) || !change.data?.id) continue;
        const local = await storage.get(change.entity, change.data.id);
        const chosen = chooseRecord(local, change.data);
        if (!local || chosen !== local) {
          await storage.put(change.entity, chosen);
          await deleteOutboxFor(storage, change.entity, chosen.id, chosen.updatedAt);
        }
      }
    },

    async ackOutbox(acks) {
      const outbox = await storage.getAll("outbox");
      const ackedIds = new Set((acks || []).map((ack) => ack.changeId));
      for (const item of outbox) {
        const superseded = (acks || []).some(
          (ack) => ack.entity === item.entity && ack.entityId === item.entityId && item.updatedAt <= ack.updatedAt,
        );
        if (ackedIds.has(item.id) || superseded) await storage.delete("outbox", item.id);
      }
    },

    async copyTemplateOntoMeso(templateId, mesoId) {
      const allDays = await storage.getAll("trainingDays");
      const allPlans = await storage.getAll("plannedExercises");
      const templateDays = allDays.filter((day) => day.mesoId === templateId && !day.deletedAt);
      const mesoDays = allDays.filter((day) => day.mesoId === mesoId && !day.deletedAt);
      for (const templateDay of templateDays) {
        const mesoDay = mesoDays.find((day) => day.label === templateDay.label);
        if (!mesoDay) continue;
        const existing = allPlans.filter((plan) => plan.trainingDayId === mesoDay.id && !plan.deletedAt);
        for (const plan of existing) await saveRecord("plannedExercises", { ...plan, deletedAt: new Date().toISOString() });
        const source = allPlans.filter((plan) => plan.trainingDayId === templateDay.id && !plan.deletedAt);
        for (const plan of source) {
          const id = `${mesoDay.id}-${plan.exerciseId}-${plan.sortOrder}`;
          await saveRecord("plannedExercises", {
            ...plan,
            id,
            trainingDayId: mesoDay.id,
            deletedAt: null,
            createdAt: null,
          });
        }
      }
    },
  };
}
