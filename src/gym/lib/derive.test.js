import { describe, expect, it } from "vitest";
import { selectSession } from "./derive.js";

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
