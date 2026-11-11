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
      ["ex-hip-abd", 3, 3, 12, 12, false, false],
      ["ex-side-plank", 2, 2, 15, 30, false, false],
      ["ex-band-walk", 2, 2, 8, 10, false, false],
    ]);
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
