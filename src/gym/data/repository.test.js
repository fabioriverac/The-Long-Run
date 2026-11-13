import { describe, expect, it } from "vitest";
import { buildView, lastSetLabel, selectSession } from "../lib/derive.js";
import { SEED_STAMP } from "../lib/types.js";
import { createMemoryStorage } from "./memoryStorage.js";
import { createRepository } from "./repository.js";

const FIXED = new Date(2026, 10, 9);

async function seeded() {
  const repo = createRepository(createMemoryStorage());
  await repo.ensureSeed(FIXED);
  return repo;
}

describe("coach seed and repository", () => {
  it("seeds sessions A Monday, B Thursday, and C Sunday exactly as written", async () => {
    const repo = await seeded();
    const all = await repo.loadAll();
    const days = all.trainingDays
      .filter((day) => day.mesoId === "meso-template")
      .sort((a, b) => a.sortOrder - b.sortOrder);
    expect(days.map((day) => [day.label, day.weekday, day.timeLabel, day.targetRir, day.isLight])).toEqual([
      ["A", 1, "18:30", 3, false],
      ["B", 4, "18:30", 3, false],
      ["C", 0, "15:00", 4, true],
    ]);

    const doses = (dayId) =>
      all.plannedExercises
        .filter((plan) => plan.trainingDayId === dayId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((plan) => [plan.exerciseId, plan.setsMin, plan.setsMax, plan.repsMin, plan.repsMax, plan.optional, plan.laterOption]);

    expect(doses("tpl-day-a")).toEqual([
      ["ex-sl-calf", 3, 3, 8, 8, false, false],
      ["ex-sl-squat", 3, 3, 8, 8, false, false],
      ["ex-sl-rdl", 3, 3, 8, 8, false, false],
      ["ex-inversion", 3, 3, 12, 12, false, false],
      ["ex-dead-bug", 3, 3, 8, 8, false, false],
    ]);
    expect(doses("tpl-day-b")).toEqual([
      ["ex-step-down", 3, 3, 8, 8, false, false],
      ["ex-sl-leg-press", 3, 3, 8, 12, false, false],
      ["ex-hip-thrust", 3, 3, 10, 15, false, false],
      ["ex-hip-abd", 3, 3, 12, 12, false, false],
      ["ex-band-walk", 2, 2, 8, 10, false, false],
      ["ex-side-plank", 2, 2, 15, 30, false, false],
    ]);
    const thrust = all.plannedExercises.find((plan) => plan.id === "meso-plan-b-ex-hip-thrust");
    expect(thrust).toMatchObject({
      sortOrder: 2,
      loadKg: 10,
      loadLabel: "machine",
      perSide: false,
      targetRir: 3,
      repsMin: 10,
      repsMax: 15,
    });
    expect(all.exercises.find((exercise) => exercise.id === "ex-hip-thrust")).toMatchObject({
      name: "Hip thrust (machine)",
      muscle: "Glutes",
      equipment: "machine",
      unit: "reps",
      perSide: false,
      notes: "Ribs down, squeeze at top, knees out, no back arch. 1-2 s pause at top, 2-3 s down.",
    });
    const press = all.plannedExercises.find((plan) => plan.id === "meso-plan-b-ex-sl-leg-press");
    expect(press).toMatchObject({ sortOrder: 1, loadKg: 22.5, loadLabel: "machine", perSide: true, targetRir: 3 });
    expect(all.exercises.find((exercise) => exercise.id === "ex-sl-leg-press")).toMatchObject({
      equipment: "machine",
      muscle: "Quads",
      unit: "reps",
      perSide: true,
    });
    expect(all.exercises.find((exercise) => exercise.id === "ex-side-plank").unit).toBe("seconds");
    expect(doses("tpl-day-c")).toEqual([
      ["ex-bridge", 2, 2, 8, 10, false, false],
      ["ex-bi-calf", 2, 2, 10, 10, false, false],
      ["ex-inversion", 1, 1, 12, 12, true, false],
      ["ex-dead-bug", 2, 2, 8, 8, false, false],
      ["ex-pushup", 2, 2, 6, 12, false, false],
    ]);
    const pushup = all.plannedExercises.find((plan) => plan.id === "tpl-plan-c-ex-pushup");
    expect(pushup.targetRir).toBe(3);
    expect(pushup.variation).toBe("incline");
    expect(all.exercises.filter((exercise) => exercise.muscle === "Chest").map((exercise) => exercise.id)).toEqual(["ex-pushup"]);
    expect(all.mesocycles.find((meso) => meso.id === "meso-current")).toMatchObject({
      startedOn: "2026-11-09",
      status: "active",
      weeks: 5,
      includesDeload: true,
    });
    expect(all.outbox.length).toBeGreaterThan(0);
  });

  it("shows workout B on Thursday 12 Nov and does not duplicate a second seed", async () => {
    const repo = await seeded();
    const before = await repo.loadAll();
    await repo.ensureSeed(new Date(2026, 10, 12));
    const after = await repo.loadAll();
    expect(after.trainingDays.filter((day) => !day.deletedAt)).toHaveLength(before.trainingDays.filter((day) => !day.deletedAt).length);
    expect(after.plannedExercises.filter((plan) => plan.id === "tpl-plan-b-ex-step-down")).toHaveLength(1);
    const view = buildView(after, { today: "2026-11-12", showSample: false });
    expect(selectSession(view.days, "2026-11-12").day.label).toBe("B");
    expect(selectSession(view.days, "2026-11-12").relation).toBe("today");
  });

  it("refreshes an untouched coach dose and leaves an edited one", async () => {
    const repo = await seeded();
    const step = (await repo.loadAll()).plannedExercises.find((row) => row.id === "tpl-plan-b-ex-step-down");
    await repo.saveRecord("plannedExercises", { ...step, setsMin: 2, setsMax: 2 }, { updatedAt: SEED_STAMP });
    const calf = (await repo.loadAll()).plannedExercises.find((row) => row.id === "meso-plan-a-ex-sl-calf");
    await repo.saveRecord("plannedExercises", { ...calf, repsMax: 10 });
    await repo.ensureSeed(FIXED);
    const all = await repo.loadAll();
    expect(all.plannedExercises.find((row) => row.id === "tpl-plan-b-ex-step-down").setsMin).toBe(3);
    expect(all.plannedExercises.find((row) => row.id === "meso-plan-a-ex-sl-calf").repsMax).toBe(10);
  });

  it("repairs day B with one single-leg leg press and keeps an edited dose", async () => {
    const storage = createMemoryStorage();
    const repo = createRepository(storage);
    await repo.ensureSeed(FIXED);
    await storage.delete("exercises", "ex-sl-leg-press");
    await storage.delete("plannedExercises", "tpl-plan-b-ex-sl-leg-press");
    await storage.delete("plannedExercises", "meso-plan-b-ex-sl-leg-press");
    await storage.delete("exercises", "ex-hip-thrust");
    await storage.delete("plannedExercises", "tpl-plan-b-ex-hip-thrust");
    await storage.delete("plannedExercises", "meso-plan-b-ex-hip-thrust");
    const oldOrder = {
      "tpl-plan-b-ex-step-down": 0,
      "tpl-plan-b-ex-hip-abd": 1,
      "tpl-plan-b-ex-side-plank": 2,
      "tpl-plan-b-ex-band-walk": 3,
      "meso-plan-b-ex-step-down": 0,
      "meso-plan-b-ex-hip-abd": 1,
      "meso-plan-b-ex-side-plank": 2,
      "meso-plan-b-ex-band-walk": 3,
    };
    for (const [id, sortOrder] of Object.entries(oldOrder)) {
      const row = await storage.get("plannedExercises", id);
      await storage.put("plannedExercises", { ...row, sortOrder, updatedAt: SEED_STAMP });
    }
    const hip = await storage.get("plannedExercises", "meso-plan-b-ex-hip-abd");
    await storage.put("plannedExercises", { ...hip, repsMax: 15, updatedAt: "2026-11-12T18:00:00.000Z" });

    await repo.ensureSeed(new Date(2026, 10, 13));
    await repo.ensureSeed(new Date(2026, 10, 13));
    const all = await repo.loadAll();
    expect(all.exercises.filter((exercise) => exercise.id === "ex-sl-leg-press")).toHaveLength(1);
    const order = (dayId) =>
      all.plannedExercises
        .filter((plan) => plan.trainingDayId === dayId && !plan.deletedAt)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.exerciseId.localeCompare(b.exerciseId))
        .map((plan) => plan.exerciseId);
    expect(order("tpl-day-b")).toEqual(["ex-step-down", "ex-sl-leg-press", "ex-hip-thrust", "ex-hip-abd", "ex-band-walk", "ex-side-plank"]);
    expect(order("meso-day-b")).toEqual(order("tpl-day-b"));
    expect(all.plannedExercises.filter((plan) => plan.id === "meso-plan-b-ex-sl-leg-press")).toHaveLength(1);
    expect(all.plannedExercises.filter((plan) => plan.id === "tpl-plan-b-ex-sl-leg-press")).toHaveLength(1);
    const edited = all.plannedExercises.find((plan) => plan.id === "meso-plan-b-ex-hip-abd");
    expect(edited.repsMax).toBe(15);
    expect(edited.sortOrder).toBe(3);
    expect(all.plannedExercises.find((plan) => plan.id === "meso-plan-b-ex-sl-leg-press")).toMatchObject({
      setsMin: 3,
      repsMin: 8,
      repsMax: 12,
      loadKg: 22.5,
      sortOrder: 1,
    });
  });

  it("inserts the hip thrust third on B and does not duplicate a repeated repair", async () => {
    const storage = createMemoryStorage();
    const repo = createRepository(storage);
    await repo.ensureSeed(FIXED);
    await storage.delete("exercises", "ex-hip-thrust");
    await storage.delete("plannedExercises", "tpl-plan-b-ex-hip-thrust");
    await storage.delete("plannedExercises", "meso-plan-b-ex-hip-thrust");
    const beforeThrust = {
      "tpl-plan-b-ex-step-down": 0,
      "tpl-plan-b-ex-sl-leg-press": 1,
      "tpl-plan-b-ex-hip-abd": 2,
      "tpl-plan-b-ex-side-plank": 3,
      "tpl-plan-b-ex-band-walk": 4,
      "meso-plan-b-ex-step-down": 0,
      "meso-plan-b-ex-sl-leg-press": 1,
      "meso-plan-b-ex-hip-abd": 2,
      "meso-plan-b-ex-side-plank": 3,
      "meso-plan-b-ex-band-walk": 4,
    };
    for (const [id, sortOrder] of Object.entries(beforeThrust)) {
      const row = await storage.get("plannedExercises", id);
      await storage.put("plannedExercises", { ...row, sortOrder, updatedAt: SEED_STAMP });
    }
    const abduction = await storage.get("plannedExercises", "meso-plan-b-ex-hip-abd");
    await storage.put("plannedExercises", { ...abduction, repsMax: 20, updatedAt: "2026-11-13T18:00:00.000Z" });

    await repo.ensureSeed(new Date(2026, 10, 13));
    await repo.ensureSeed(new Date(2026, 10, 13));
    const all = await repo.loadAll();
    const order = (dayId) =>
      all.plannedExercises
        .filter((plan) => plan.trainingDayId === dayId && !plan.deletedAt)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.exerciseId.localeCompare(b.exerciseId))
        .map((plan) => plan.exerciseId);
    const expected = ["ex-step-down", "ex-sl-leg-press", "ex-hip-thrust", "ex-hip-abd", "ex-band-walk", "ex-side-plank"];
    expect(order("tpl-day-b")).toEqual(expected);
    expect(order("meso-day-b")).toEqual(expected);
    expect(all.exercises.filter((exercise) => exercise.id === "ex-hip-thrust")).toHaveLength(1);
    expect(all.plannedExercises.filter((plan) => plan.id === "tpl-plan-b-ex-hip-thrust")).toHaveLength(1);
    expect(all.plannedExercises.filter((plan) => plan.id === "meso-plan-b-ex-hip-thrust")).toHaveLength(1);
    expect(all.plannedExercises.find((plan) => plan.id === "meso-plan-b-ex-hip-thrust").sortOrder).toBe(2);
    const edited = all.plannedExercises.find((plan) => plan.id === "meso-plan-b-ex-hip-abd");
    expect(edited.repsMax).toBe(20);
    expect(edited.sortOrder).toBe(3);
  });

  it("reuses a user-created hip thrust and will not add a second B plan", async () => {
    const storage = createMemoryStorage();
    const repo = createRepository(storage);
    await repo.ensureSeed(FIXED);
    await storage.delete("exercises", "ex-hip-thrust");
    await storage.delete("plannedExercises", "tpl-plan-b-ex-hip-thrust");
    await storage.delete("plannedExercises", "meso-plan-b-ex-hip-thrust");
    await repo.saveRecord("exercises", {
      id: "ex-user-hip",
      name: "Hip thrust",
      muscle: "",
      equipment: "machine",
      unit: "reps",
      perSide: false,
      notes: "",
      custom: true,
      deletedAt: null,
      serverReceivedAt: null,
      createdAt: "2026-11-13T15:00:00.000Z",
    }, { updatedAt: "2026-11-13T15:00:00.000Z" });
    await repo.saveRecord("sets", {
      id: "set-user-hip",
      workoutId: "w-hip",
      plannedExerciseId: "plan-user-hip",
      exerciseId: "ex-user-hip",
      setNumber: 1,
      loadKg: 10,
      loadLabel: "machine",
      reps: 12,
      seconds: null,
      steps: null,
      rir: 3,
      variation: "machine",
      completed: true,
      sample: false,
      deletedAt: null,
      serverReceivedAt: null,
    });
    await repo.saveRecord("plannedExercises", {
      id: "plan-user-hip",
      trainingDayId: "meso-day-b",
      exerciseId: "ex-user-hip",
      sortOrder: 5,
      setsMin: 3,
      setsMax: 3,
      repsMin: 10,
      repsMax: 12,
      targetDose: 10,
      targetRir: 3,
      perSide: false,
      optional: false,
      laterOption: false,
      notes: "",
      variation: "machine",
      loadKg: 10,
      loadLabel: "machine",
      deletedAt: null,
      serverReceivedAt: null,
    }, { updatedAt: "2026-11-13T15:10:00.000Z" });

    await repo.ensureSeed(new Date(2026, 10, 13));
    await repo.ensureSeed(new Date(2026, 10, 13));
    const all = await repo.loadAll();
    const hips = all.exercises.filter((exercise) => /hip thrust/i.test(exercise.name) && !exercise.deletedAt);
    expect(hips.map((exercise) => exercise.id)).toEqual(["ex-user-hip"]);
    expect(hips[0]).toMatchObject({
      name: "Hip thrust",
      muscle: "Glutes",
      equipment: "machine",
      notes: "Ribs down, squeeze at top, knees out, no back arch. 1-2 s pause at top, 2-3 s down.",
    });
    const mesoPlans = all.plannedExercises.filter((plan) => plan.trainingDayId === "meso-day-b" && plan.exerciseId === "ex-user-hip" && !plan.deletedAt);
    expect(mesoPlans).toHaveLength(1);
    expect(mesoPlans[0].id).toBe("plan-user-hip");
    expect(mesoPlans[0].repsMax).toBe(12);
    expect(mesoPlans[0].sortOrder).toBe(5);
    const templatePlans = all.plannedExercises.filter((plan) => plan.trainingDayId === "tpl-day-b" && plan.exerciseId === "ex-user-hip" && !plan.deletedAt);
    expect(templatePlans).toHaveLength(1);
    expect(templatePlans[0].sortOrder).toBe(2);
    expect(all.sets.find((set) => set.id === "set-user-hip")).toMatchObject({ exerciseId: "ex-user-hip", reps: 12 });
    expect(all.exercises.some((exercise) => exercise.id === "ex-hip-thrust")).toBe(false);
  });

  it("leaves a user hip thrust's own muscle and notes alone", async () => {
    const storage = createMemoryStorage();
    const repo = createRepository(storage);
    await repo.ensureSeed(FIXED);
    await storage.delete("exercises", "ex-hip-thrust");
    await storage.delete("plannedExercises", "tpl-plan-b-ex-hip-thrust");
    await storage.delete("plannedExercises", "meso-plan-b-ex-hip-thrust");
    await repo.saveRecord("exercises", {
      id: "ex-user-hip",
      name: "Hip Thrust",
      muscle: "Hips",
      equipment: "machine",
      unit: "reps",
      perSide: false,
      notes: "My cue",
      custom: true,
      deletedAt: null,
      serverReceivedAt: null,
    });
    await repo.ensureSeed(new Date(2026, 10, 13));
    const exercise = (await repo.loadAll()).exercises.find((row) => row.id === "ex-user-hip");
    expect(exercise).toMatchObject({ muscle: "Hips", notes: "My cue", name: "Hip Thrust" });
  });

  it("appends an exercise to today's session once, and to the template when asked", async () => {
    const repo = await seeded();
    const before = (await repo.loadAll()).plannedExercises.filter((plan) => plan.trainingDayId === "meso-day-b" && !plan.deletedAt);
    await repo.appendExercise("meso-day-b", "ex-pushup", { alsoDayId: "tpl-day-b", targetRir: 3 });
    await repo.appendExercise("meso-day-b", "ex-pushup", { alsoDayId: "tpl-day-b", targetRir: 3 });
    const all = await repo.loadAll();
    const meso = all.plannedExercises.filter((plan) => plan.trainingDayId === "meso-day-b" && plan.exerciseId === "ex-pushup" && !plan.deletedAt);
    const template = all.plannedExercises.filter((plan) => plan.trainingDayId === "tpl-day-b" && plan.exerciseId === "ex-pushup" && !plan.deletedAt);
    expect(meso).toHaveLength(1);
    expect(template).toHaveLength(1);
    expect(meso[0].sortOrder).toBe(before.length);
    const onlyToday = await repo.appendExercise("meso-day-b", "ex-pike-pushup");
    const after = await repo.loadAll();
    expect(onlyToday).toHaveLength(1);
    expect(after.plannedExercises.filter((plan) => plan.trainingDayId === "tpl-day-b" && plan.exerciseId === "ex-pike-pushup")).toHaveLength(0);
  });

  it("does not reseed over an edited plan", async () => {
    const repo = await seeded();
    const plan = (await repo.loadAll()).plannedExercises.find((row) => row.id === "meso-plan-a-ex-sl-calf");
    await repo.saveRecord("plannedExercises", { ...plan, repsMax: 10 });
    await repo.ensureSeed(new Date(2026, 11, 1));
    const again = (await repo.loadAll()).plannedExercises.find((row) => row.id === "meso-plan-a-ex-sl-calf");
    expect(again.repsMax).toBe(10);
  });

  it("round-trips a backup and keeps a custom exercise", async () => {
    const repo = await seeded();
    await repo.saveRecord("exercises", {
      id: "ex-custom-row",
      name: "Seated row",
      muscle: "Back",
      equipment: "dumbbell",
      unit: "reps",
      perSide: false,
      progression: "reps_then_external_load",
      doseStep: 1,
      loadStepKg: 1,
      variationLadder: [],
      defaultVariation: "standard",
      regression: null,
      sideNote: "",
      notes: "Added by Fabio.",
      cues: "",
      custom: true,
      deletedAt: null,
      serverReceivedAt: null,
    });
    const file = await repo.exportBundle();
    const other = createRepository(createMemoryStorage());
    await other.importBundle(file);
    const all = await other.loadAll();
    expect(all.exercises.some((exercise) => exercise.id === "ex-custom-row")).toBe(true);
    expect(all.exercises.some((exercise) => exercise.id === "ex-pushup")).toBe(true);
    expect(all.trainingDays.filter((day) => day.mesoId === "meso-template")).toHaveLength(3);
  });

  it("keeps a newer local row when an older remote change arrives", async () => {
    const repo = await seeded();
    const exercise = (await repo.loadAll()).exercises.find((row) => row.id === "ex-pushup");
    await repo.saveRecord("exercises", { ...exercise, notes: "Fabio's cue" }, { updatedAt: "2026-11-09T18:00:00.000Z" });
    await repo.applyRemoteChanges([
      {
        entity: "exercises",
        data: { ...exercise, notes: "old cloud", updatedAt: "2026-11-08T22:32:00.000Z" },
      },
    ]);
    const stored = (await repo.loadAll()).exercises.find((row) => row.id === "ex-pushup");
    expect(stored.notes).toBe("Fabio's cue");
  });

  it("does not queue sample history for sync", async () => {
    const repo = await seeded();
    await repo.ackOutbox((await repo.loadAll()).outbox.map((item) => ({
      changeId: item.id,
      entity: item.entity,
      entityId: item.entityId,
      updatedAt: item.updatedAt,
    })));
    await repo.ensureSample("2026-11-09");
    const all = await repo.loadAll();
    expect(all.workouts.some((workout) => workout.sample)).toBe(true);
    expect(all.outbox).toEqual([]);
  });
});

describe("progress view", () => {
  it("counts this week's sets by muscle and leaves the calendar out of the dose", async () => {
    const repo = await seeded();
    await repo.saveRecord("workouts", {
      id: "w1",
      mesoId: "meso-current",
      trainingDayId: "meso-day-a",
      weekIndex: 1,
      date: "2026-11-09",
      startedAt: "2026-11-09T18:30:00.000Z",
      finishedAt: "2026-11-09T19:00:00.000Z",
      status: "completed",
      notes: "",
      sample: false,
      deletedAt: null,
      serverReceivedAt: null,
    });
    await repo.saveRecord("sets", {
      id: "w1-set",
      workoutId: "w1",
      plannedExerciseId: "meso-plan-a-ex-sl-calf",
      exerciseId: "ex-sl-calf",
      setNumber: 1,
      loadKg: null,
      loadLabel: "bodyweight",
      reps: 8,
      seconds: null,
      steps: null,
      rir: 3,
      variation: "single-leg",
      completed: true,
      sample: false,
      deletedAt: null,
      serverReceivedAt: null,
    });
    const view = buildView(await repo.loadAll(), { today: "2026-11-09", showSample: false });
    expect(view.weeklySets.find((row) => row.muscle === "Calves").sets).toBe(1);
    expect(view.stats.completed).toBe(1);
    expect(view.grid[0].cells[0].state).toBe("done");
    const exercise = view.exercisesById["ex-sl-calf"];
    expect(lastSetLabel(view.sets, [{ ...view.workouts.find((row) => row.id === "w1"), status: "completed" }], exercise, 1, "2026-11-16")).toBe("BW × 8");
    expect(lastSetLabel(
      [{ workoutId: "w", exerciseId: "ex-side-plank", setNumber: 1, completed: true, seconds: 20, loadKg: null, loadLabel: "bodyweight", deletedAt: null }],
      [{ id: "w", status: "completed", date: "2026-11-05", deletedAt: null }],
      { id: "ex-side-plank", unit: "seconds" },
      1,
      "2026-11-12",
    )).toBe("BW × 20s");
    const calfSuggestion = view.suggestions["meso-plan-a-ex-sl-calf"].suggestion;
    expect(calfSuggestion.action).toBe("add_load");
    expect(calfSuggestion.next.loadKg).toBe(1);
  });
});
