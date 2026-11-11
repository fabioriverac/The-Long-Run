import { parseBackup, serializeBackup } from "../lib/backup.js";
import { DATA_TABLES, SEED_STAMP, SEED_VERSION } from "../lib/types.js";
import { buildCoachSeed } from "./coachTemplate.js";
import { buildSampleHistory } from "./sampleHistory.js";
import { chooseRecord } from "../sync/merge.js";

function sameRecord(existing, next) {
  const keys = Object.keys(next).filter((key) => !["createdAt", "updatedAt", "serverReceivedAt"].includes(key));
  return keys.every((key) => JSON.stringify(existing[key] ?? null) === JSON.stringify(next[key] ?? null));
}

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
      const bundle = buildCoachSeed(now);
      const tables = ["exercises", "mesocycles", "trainingDays", "plannedExercises"];
      let wrote = false;
      const existingMesos = await storage.getAll("mesocycles");
      const otherActive = existingMesos.some((meso) => meso.id !== "meso-current" && meso.status === "active" && !meso.deletedAt);
      for (const table of tables) {
        for (const row of bundle.tables[table]) {
          const existing = await storage.get(table, row.id);
          if (existing?.deletedAt) continue;
          let next = row;
          if (table === "mesocycles" && row.id === "meso-current" && existing) {
            next = {
              ...row,
              startedOn: existing.startedOn || row.startedOn,
              status: existing.status === "completed" || otherActive ? existing.status : "active",
            };
          }
          if (!existing) {
            await saveRecord(table, next, { sync: true, updatedAt: next.updatedAt || SEED_STAMP });
            wrote = true;
            continue;
          }
          if (existing.updatedAt && existing.updatedAt !== SEED_STAMP) continue;
          if (sameRecord(existing, next)) continue;
          await saveRecord(table, { ...next, createdAt: existing.createdAt || next.createdAt }, {
            sync: true,
            updatedAt: new Date(now).toISOString(),
          });
          wrote = true;
        }
      }
      const retired = ["tpl-plan-b-ex-copenhagen", "tpl-plan-b-ex-sp-lift", "meso-plan-b-ex-copenhagen", "meso-plan-b-ex-sp-lift"];
      for (const id of retired) {
        const existing = await storage.get("plannedExercises", id);
        if (existing && !existing.deletedAt && existing.updatedAt === SEED_STAMP) {
          await saveRecord("plannedExercises", { ...existing, deletedAt: new Date(now).toISOString() });
          wrote = true;
        }
      }
      const marker = await storage.get("meta", "seed");
      if (!marker || marker.version < SEED_VERSION || wrote) {
        await storage.put("meta", {
          id: "seed",
          version: SEED_VERSION,
          seededAt: marker?.seededAt || new Date(now).toISOString(),
        });
      }
      return wrote || !marker;
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
