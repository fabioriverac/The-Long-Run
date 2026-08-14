import { describe, expect, it, vi } from "vitest";
import { mapSnapshot, mapSnapshots } from "./trainingStatus.js";

function snapshot(overrides = {}) {
  return {
    date: "2026-06-01T00:00:00.000Z",
    vo2max: 52,
    training_status: "Productive",
    training_readiness_score: 80,
    race_predictor_5k_seconds: 1100,
    race_predictor_10k_seconds: 2300,
    race_predictor_half_marathon_seconds: 5200,
    race_predictor_marathon_seconds: 10900,
    ...overrides,
  };
}

describe("mapSnapshot", () => {
  it("maps a raw Garmin training-status snapshot to a record", () => {
    expect(mapSnapshot(snapshot())).toMatchObject({
      date: "2026-06-01",
      vo2max: 52,
      training_status: "Productive",
      training_readiness_score: 80,
      race_predictor_5k_seconds: 1100,
      race_predictor_10k_seconds: 2300,
      race_predictor_half_marathon_seconds: 5200,
      race_predictor_marathon_seconds: 10900,
    });
  });

  it("nulls out optional fields when absent instead of coercing to NaN", () => {
    const mapped = mapSnapshot(
      snapshot({
        vo2max: undefined,
        training_status: undefined,
        training_readiness_score: null,
        race_predictor_5k_seconds: undefined,
      })
    );
    expect(mapped.vo2max).toBeNull();
    expect(mapped.training_status).toBeNull();
    expect(mapped.training_readiness_score).toBeNull();
    expect(mapped.race_predictor_5k_seconds).toBeNull();
  });

  it("throws when date is missing instead of crashing deep inside a .slice() call", () => {
    expect(() => mapSnapshot(snapshot({ date: undefined }))).toThrow(/date/);
  });

  it("throws when date is blank", () => {
    expect(() => mapSnapshot(snapshot({ date: "" }))).toThrow(/date/);
  });
});

describe("mapSnapshots", () => {
  it("dedupes by date, later entry winning", () => {
    const mapped = mapSnapshots([snapshot({ vo2max: 50 }), snapshot({ vo2max: 55 })]);
    expect(mapped).toHaveLength(1);
    expect(mapped[0].vo2max).toBe(55);
  });

  it("sorts most recent first", () => {
    const mapped = mapSnapshots([
      snapshot({ date: "2026-01-01T00:00:00.000Z" }),
      snapshot({ date: "2026-06-01T00:00:00.000Z" }),
    ]);
    expect(mapped.map((s) => s.date)).toEqual(["2026-06-01", "2026-01-01"]);
  });

  it("skips invalid snapshots (logging a warning) instead of one bad record aborting the whole batch", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mapped = mapSnapshots([
      snapshot({ date: "2026-06-01T00:00:00.000Z" }),
      snapshot({ date: undefined }),
    ]);
    expect(mapped).toHaveLength(1);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("does not let multiple invalid snapshots collide under a shared undefined key", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const mapped = mapSnapshots([snapshot({ date: undefined }), snapshot({ date: undefined })]);
    expect(mapped).toHaveLength(0);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
