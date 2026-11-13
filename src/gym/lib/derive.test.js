import { describe, expect, it } from "vitest";
import { exercisesForPicker, selectSession, sessionAfterChoice } from "./derive.js";

const days = [
  { label: "A", name: "Return", weekday: 1, timeLabel: "18:30" },
  { label: "B", name: "Hip control", weekday: 4, timeLabel: "18:30" },
  { label: "C", name: "Light", weekday: 0, timeLabel: "15:00" },
];

describe("selectSession", () => {
  it("keeps Monday on A", () => {
    expect(selectSession(days, "2026-11-09")).toMatchObject({ relation: "today", day: { label: "A" } });
  });

  it("picks Thursday B on Tuesday and Wednesday", () => {
    expect(selectSession(days, "2026-11-10")).toMatchObject({ relation: "rest", day: { label: "B" } });
    expect(selectSession(days, "2026-11-11")).toMatchObject({ relation: "rest", day: { label: "B" } });
  });

  it("picks Sunday C on Friday instead of wrapping to Monday", () => {
    expect(selectSession(days, "2026-11-13")).toMatchObject({ relation: "rest", day: { label: "C" } });
  });

  it("keeps the Saturday run-day message and points at Sunday C", () => {
    expect(selectSession(days, "2026-11-14")).toMatchObject({ relation: "run-day", day: { label: "C" } });
  });
});

describe("off-day workout list", () => {
  const saved = days.map((day) => ({ ...day, id: day.label }));

  it("lists A, B, and C on Friday and logs B today when B is chosen", () => {
    const friday = "2026-11-13";
    const waiting = sessionAfterChoice(saved, friday, null);
    expect(waiting.logging).toBe(false);
    expect(waiting.day.label).toBe("C");
    expect(saved.map((day) => day.label)).toEqual(["A", "B", "C"]);

    const chosen = sessionAfterChoice(saved, friday, "B");
    expect(chosen.logging).toBe(true);
    expect(chosen.day.label).toBe("B");
    expect(chosen.day.weekday).toBe(4);
  });
});

describe("exercise picker", () => {
  const library = [
    { id: "ex-pushup", name: "Push-up", muscle: "Chest", equipment: "bodyweight" },
    { id: "ex-sl-leg-press", name: "Single-leg leg press", muscle: "Quads", equipment: "machine" },
    { id: "ex-retired", name: "Old machine", muscle: "Quads", equipment: "machine", deletedAt: "2026-11-01" },
  ];

  it("includes machine exercises and can filter them by muscle", () => {
    expect(exercisesForPicker(library).map((exercise) => exercise.id)).toEqual(["ex-pushup", "ex-sl-leg-press"]);
    expect(exercisesForPicker(library, { muscle: "Quads" }).map((exercise) => exercise.name)).toEqual(["Single-leg leg press"]);
    expect(exercisesForPicker(library, { query: "press" }).map((exercise) => exercise.equipment)).toEqual(["machine"]);
  });
});
