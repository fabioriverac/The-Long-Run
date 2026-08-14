import { describe, expect, it, vi } from "vitest";
import { mapActivities, mapActivity } from "./runs.js";

function activity(overrides = {}) {
  return {
    activity_id: 12345,
    activity_type: "running",
    activity_name: "Morning Run",
    start_time: "2026-06-01T06:30:00Z",
    distance_meters: 10000,
    duration_seconds: 2700,
    avg_hr: 150,
    max_hr: 170,
    description: null,
    ...overrides,
  };
}

describe("mapActivity", () => {
  it("maps a raw Garmin activity to a run record", () => {
    const run = mapActivity(activity());
    expect(run).toMatchObject({
      id: "garmin-12345",
      garmin_activity_id: 12345,
      title: "Morning Run",
      date: "2026-06-01",
      distance_km: 10,
      duration_seconds: 2700,
      avg_hr: 150,
      max_hr: 170,
      source: "garmin",
    });
  });

  it("nulls out optional heart-rate fields when absent", () => {
    const run = mapActivity(activity({ avg_hr: undefined, max_hr: null }));
    expect(run.avg_hr).toBeNull();
    expect(run.max_hr).toBeNull();
  });

  it("classifies a long run by distance regardless of pace", () => {
    const run = mapActivity(activity({ distance_meters: 22000, duration_seconds: 8000 }));
    expect(run.type).toBe("Long run");
  });

  it("classifies a workout when pace is within tolerance of goal pace", () => {
    // Goal pace is 256 s/km; 5km in 1280s is exactly goal pace.
    const run = mapActivity(activity({ distance_meters: 5000, duration_seconds: 1280 }));
    expect(run.type).toBe("Workout");
  });

  it("classifies an easy run when pace is well off goal pace", () => {
    const run = mapActivity(activity({ distance_meters: 5000, duration_seconds: 2400 }));
    expect(run.type).toBe("Easy");
  });

  it.each([
    ["activity_id", { activity_id: undefined }],
    ["start_time", { start_time: undefined }],
    ["distance_meters", { distance_meters: undefined }],
    ["duration_seconds", { duration_seconds: undefined }],
  ])("throws when %s is missing instead of coercing to NaN", (_field, overrides) => {
    expect(() => mapActivity(activity(overrides))).toThrow();
  });

  it("throws instead of accepting a zero distance (would divide-by-zero in pace calc)", () => {
    expect(() => mapActivity(activity({ distance_meters: 0 }))).toThrow(/distance_km/);
  });

  it("throws instead of accepting a negative distance", () => {
    expect(() => mapActivity(activity({ distance_meters: -1000 }))).toThrow(/distance_km/);
  });

  it("throws instead of accepting a zero or negative duration", () => {
    expect(() => mapActivity(activity({ duration_seconds: 0 }))).toThrow(/duration_seconds/);
    expect(() => mapActivity(activity({ duration_seconds: -10 }))).toThrow(/duration_seconds/);
  });
});

describe("mapActivities", () => {
  it("filters to running activities only", () => {
    const runs = mapActivities([activity({ activity_id: 1 }), activity({ activity_id: 2, activity_type: "cycling" })]);
    expect(runs).toHaveLength(1);
    expect(runs[0].garmin_activity_id).toBe(1);
  });

  it("dedupes by garmin_activity_id, later entry winning", () => {
    const runs = mapActivities([
      activity({ activity_id: 1, activity_name: "First" }),
      activity({ activity_id: 1, activity_name: "Second" }),
    ]);
    expect(runs).toHaveLength(1);
    expect(runs[0].title).toBe("Second");
  });

  it("sorts most recent first", () => {
    const runs = mapActivities([
      activity({ activity_id: 1, start_time: "2026-01-01T06:00:00Z" }),
      activity({ activity_id: 2, start_time: "2026-06-01T06:00:00Z" }),
    ]);
    expect(runs.map((r) => r.garmin_activity_id)).toEqual([2, 1]);
  });

  it("skips invalid activities (logging a warning) instead of one bad record aborting the whole batch", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const runs = mapActivities([
      activity({ activity_id: 1 }),
      activity({ activity_id: undefined }), // invalid: missing required field
      activity({ activity_id: 2 }),
    ]);
    expect(runs.map((r) => r.garmin_activity_id).sort()).toEqual([1, 2]);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it("does not let multiple invalid activities collide under a shared NaN/undefined key", () => {
    // Two activities both missing activity_id would previously both key to
    // NaN and collide in the dedup Map, silently dropping one. Now each
    // invalid record is individually skipped before either reaches the Map.
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const runs = mapActivities([
      activity({ activity_id: 1 }),
      activity({ activity_id: undefined }),
      activity({ activity_id: undefined }),
    ]);
    expect(runs.map((r) => r.garmin_activity_id)).toEqual([1]);
    expect(warn).toHaveBeenCalledTimes(2);
    warn.mockRestore();
  });
});
