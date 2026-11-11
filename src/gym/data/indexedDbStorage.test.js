import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { createIndexedDbStorage } from "./indexedDbStorage.js";
import { createRepository } from "./repository.js";

describe("IndexedDB storage", () => {
  it("seeds the coach plan and reads a logged set back", async () => {
    const storage = createIndexedDbStorage({ name: `meso-test-${Math.random().toString(16).slice(2)}` });
    const repo = createRepository(storage);
    await repo.ensureSeed(new Date(2026, 10, 9));
    await repo.saveRecord("sets", {
      id: "set-1",
      workoutId: "w",
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
    const all = await repo.loadAll();
    expect(all.exercises.length).toBe(17);
    expect(all.sets.find((set) => set.id === "set-1").reps).toBe(8);
    expect(all.trainingDays.filter((day) => day.mesoId === "meso-current")).toHaveLength(3);
  });
});
