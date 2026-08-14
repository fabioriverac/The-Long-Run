import { describe, expect, it } from "vitest";
import { groupByWeek } from "./groupByWeek.js";

function run(date, distanceKm) {
  return { date, distance_km: distanceKm };
}

describe("groupByWeek", () => {
  it("returns an empty array for no runs", () => {
    expect(groupByWeek([])).toEqual([]);
  });

  it("sums distance for runs within the same ISO week, labeled by Monday", () => {
    // Mon 2026-06-01 .. Sun 2026-06-07
    const weeks = groupByWeek([run("2026-06-01", 5), run("2026-06-03", 10), run("2026-06-07", 8)]);
    expect(weeks).toEqual([{ weekStart: "2026-06-01", distanceKm: 23 }]);
  });

  it("sorts weeks oldest to newest", () => {
    const weeks = groupByWeek([run("2026-06-15", 5), run("2026-06-01", 5)]);
    expect(weeks.map((w) => w.weekStart)).toEqual(["2026-06-01", "2026-06-08", "2026-06-15"]);
  });

  it("backfills a rest week between two training weeks with a zero entry", () => {
    // 2026-06-01 and 2026-06-15 are both Mondays, two weeks apart —
    // 2026-06-08 has no runs and must still appear, at zero.
    const weeks = groupByWeek([run("2026-06-01", 10), run("2026-06-15", 12)]);
    expect(weeks).toEqual([
      { weekStart: "2026-06-01", distanceKm: 10 },
      { weekStart: "2026-06-08", distanceKm: 0 },
      { weekStart: "2026-06-15", distanceKm: 12 },
    ]);
  });

  it("backfills multiple consecutive rest weeks", () => {
    const weeks = groupByWeek([run("2026-06-01", 10), run("2026-06-29", 5)]);
    expect(weeks.map((w) => w.weekStart)).toEqual([
      "2026-06-01",
      "2026-06-08",
      "2026-06-15",
      "2026-06-22",
      "2026-06-29",
    ]);
    expect(weeks.map((w) => w.distanceKm)).toEqual([10, 0, 0, 0, 5]);
  });

  it("treats a null distance_km as zero instead of poisoning the week's total with NaN", () => {
    const weeks = groupByWeek([run("2026-06-01", 10), run("2026-06-02", null)]);
    expect(weeks).toEqual([{ weekStart: "2026-06-01", distanceKm: 10 }]);
  });

  it("treats an undefined/missing distance_km as zero instead of NaN", () => {
    const weeks = groupByWeek([{ date: "2026-06-01" }, run("2026-06-02", 4)]);
    expect(weeks).toEqual([{ weekStart: "2026-06-01", distanceKm: 4 }]);
  });

  it("rounds summed distance to one decimal place", () => {
    const weeks = groupByWeek([run("2026-06-01", 5.05), run("2026-06-02", 3.04)]);
    expect(weeks[0].distanceKm).toBe(8.1);
  });

  it("a single run's week has no backfilled neighbors", () => {
    const weeks = groupByWeek([run("2026-06-03", 7)]);
    expect(weeks).toEqual([{ weekStart: "2026-06-01", distanceKm: 7 }]);
  });
});
