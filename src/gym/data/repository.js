import { parseBackup, serializeBackup } from "../lib/backup.js";
import { DATA_TABLES, SEED_STAMP, SEED_VERSION, newId } from "../lib/types.js";
import { buildCoachSeed } from "./coachTemplate.js";
import { buildSampleHistory } from "./sampleHistory.js";
import { chooseRecord } from "../sync/merge.js";

function sameRecord(existing, next) {
  const keys = Object.keys(next).filter((key) => !["createdAt", "updatedAt", "serverReceivedAt"].includes(key));
  return keys.every((key) => JSON.stringify(existing[key] ?? null) === JSON.stringify(next[key] ?? null));
}

const HIP_THRUST_ID = "ex-hip-thrust";

function blankText(value) {
  return !String(value || "").trim();
}

/** Prefer a hip thrust Fabio already logged, so the new B plan keeps his history. */
async function adoptUserHipThrust(storage, bundle, saveRecord) {
  const exercises = await storage.getAll("exercises");
  const sets = await storage.getAll("sets");
  const matches = exercises.filter(
    (exercise) => exercise.id !== HIP_THRUST_ID && !exercise.deletedAt && /hip thrust/i.test(exercise.name || ""),
  );
  if (!matches.length) return;
  matches.sort((a, b) => {
    const logged = (id) => sets.filter((set) => set.exerciseId === id && !set.deletedAt).length;
    return logged(b.id) - logged(a.id) || String(a.createdAt || "").localeCompare(String(b.createdAt || ""));
  });
  const user = matches[0];
  const seed = bundle.tables.exercises.find((row) => row.id === HIP_THRUST_ID);
  const patch = {};
  if (blankText(user.muscle) || String(user.muscle).trim().toLowerCase() === "other") patch.muscle = seed?.muscle || "Glutes";
  if (blankText(user.notes)) patch.notes = seed?.notes || "";
  if (Object.keys(patch).length) await saveRecord("exercises", { ...user, ...patch });

  const seedLive = exercises.some((exercise) => exercise.id === HIP_THRUST_ID && !exercise.deletedAt);
  if (!seedLive) {
    bundle.tables.exercises = bundle.tables.exercises.filter((row) => row.id !== HIP_THRUST_ID);
  }

  const plans = await storage.getAll("plannedExercises");
  bundle.tables.plannedExercises = bundle.tables.plannedExercises.flatMap((row) => {
    if (row.exerciseId !== HIP_THRUST_ID) return [row];
    const onDay = plans.filter((plan) => plan.trainingDayId === row.trainingDayId && !plan.deletedAt);
    const stable = onDay.find((plan) => plan.id === row.id);
    const other = onDay.find((plan) => plan.exerciseId === user.id && plan.id !== row.id);
    if (other && !stable) return [];
    return [{ ...row, exerciseId: stable ? stable.exerciseId : user.id }];
  });
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
      await adoptUserHipThrust(storage, bundle, saveRecord);
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
            if (table === "plannedExercises") {
              const siblings = (await storage.getAll("plannedExercises")).filter(
                (plan) =>
                  plan.trainingDayId === next.trainingDayId &&
                  !plan.deletedAt &&
                  plan.sortOrder >= next.sortOrder &&
                  plan.updatedAt &&
                  plan.updatedAt !== SEED_STAMP,
              );
              for (const sibling of siblings) {
                await saveRecord("plannedExercises", { ...sibling, sortOrder: sibling.sortOrder + 1 });
              }
            }
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

    async appendExercise(dayId, exerciseId, { alsoDayId, targetRir } = {}) {
      const exercise = await storage.get("exercises", exerciseId);
      if (!exercise || exercise.deletedAt) return [];
      const targets = [...new Set([dayId, alsoDayId].filter(Boolean))];
      const created = [];
      for (const trainingDayId of targets) {
        const plans = await storage.getAll("plannedExercises");
        const siblings = plans.filter((plan) => plan.trainingDayId === trainingDayId && !plan.deletedAt);
        const already = siblings.find((plan) => plan.exerciseId === exerciseId);
        if (already) {
          created.push(already);
          continue;
        }
        const sortOrder = siblings.reduce((max, plan) => Math.max(max, Number(plan.sortOrder) || 0), -1) + 1;
        const weighted = exercise.equipment === "machine" || exercise.equipment === "dumbbell" || exercise.equipment === "barbell";
        created.push(
          await saveRecord("plannedExercises", {
            id: newId("plan"),
            trainingDayId,
            exerciseId,
            sortOrder,
            setsMin: 3,
            setsMax: 3,
            repsMin: exercise.unit === "reps" ? 8 : 15,
            repsMax: exercise.unit === "reps" ? 12 : 30,
            targetDose: exercise.unit === "reps" ? 8 : 15,
            targetRir: targetRir ?? null,
            perSide: Boolean(exercise.perSide),
            optional: false,
            laterOption: false,
            notes: "",
            variation: exercise.defaultVariation || "standard",
            loadKg: null,
            loadLabel: exercise.equipment === "band" ? "light" : weighted ? exercise.equipment : "bodyweight",
            deletedAt: null,
            serverReceivedAt: null,
          }),
        );
      }
      return created;
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
