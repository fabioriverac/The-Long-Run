import { describe, expect, it } from "vitest";
import {
  epleyE1rm,
  normalizeJointPain,
  plansAfterFeedback,
  rirForWeek,
  rirSchedule,
  setChangeFromFeedback,
} from "./progression.js";

const calf = {
  id: "ex-sl-calf",
  equipment: "bodyweight",
  unit: "reps",
  progression: "reps_then_external_load",
  doseStep: 1,
  loadStepKg: 1,
  variationLadder: [],
  defaultVariation: "single-leg",
  regression: { variation: "bilateral", label: "Bilateral calf raise" },
};

const plan = {
  id: "p1",
  exerciseId: "ex-sl-calf",
  repsMin: 8,
  repsMax: 12,
  targetDose: 8,
  setsMin: 3,
  setsMax: 3,
  variation: "single-leg",
  loadKg: null,
  loadLabel: "bodyweight",
};

const last = { reps: 12, loadKg: null, loadLabel: "bodyweight", variation: "single-leg" };

function apply(feedback, extra = {}) {
  return plansAfterFeedback([plan], { "ex-sl-calf": calf }, {
    performances: { "ex-sl-calf": last },
    templateSets: { "ex-sl-calf": 3, "ex-sl-calf:max": 3 },
    appliedDelta: 0,
    ...feedback,
    ...extra,
  });
}

describe("epleyE1rm", () => {
  it("matches the labelled estimate and ignores bodyweight", () => {
    expect(epleyE1rm(24, 12)).toBe(33.6);
    expect(epleyE1rm(0, 12)).toBeNull();
  });
});

describe("week RIR", () => {
  it("runs 3-2-1-0 and then a deload", () => {
    expect(rirSchedule(5, true).map((week) => [week.rir, week.deload])).toEqual([
      [3, false],
      [2, false],
      [1, false],
      [0, false],
      [3, true],
    ]);
    expect(rirForWeek(4, 5, true).rir).toBe(0);
    expect(rirForWeek(5, 5, true).deload).toBe(true);
  });
});

describe("feedback maps to next week's sets", () => {
  it("adds a set when recovery was early and the work felt easy or good", () => {
    expect(setChangeFromFeedback({ soreness: "never", workload: "easy", pump: "low" }).delta).toBe(1);
    expect(setChangeFromFeedback({ soreness: "healed_early", workload: "pretty_good", pump: "moderate" }).delta).toBe(1);
    const result = apply({ soreness: "healed_early", workload: "pretty_good", pump: "moderate", jointPain: "none" });
    expect(result.plans[0].setsMin).toBe(4);
    expect(result.change.reason).toBe("recovered_early");
  });

  it("holds when soreness landed on time, the work pushed limits, or the pump was already amazing", () => {
    expect(setChangeFromFeedback({ soreness: "just_in_time", workload: "easy", pump: "low" }).delta).toBe(0);
    expect(setChangeFromFeedback({ soreness: "healed_early", workload: "pushed_limits", pump: "low" }).delta).toBe(0);
    expect(setChangeFromFeedback({ soreness: "never", workload: "pretty_good", pump: "amazing" }).delta).toBe(0);
    expect(apply({ soreness: "just_in_time", workload: "pretty_good", pump: "moderate", jointPain: "none" }).plans[0].setsMin).toBe(3);
  });

  it("removes a set when they are still sore or the work was too much", () => {
    expect(setChangeFromFeedback({ soreness: "still_sore", workload: "easy", pump: "amazing" }).delta).toBe(-1);
    expect(setChangeFromFeedback({ soreness: "never", workload: "too_much", pump: "low" }).delta).toBe(-1);
    expect(apply({ soreness: "still_sore", workload: "too_much", pump: "low", jointPain: "none" }).plans[0].setsMin).toBe(2);
  });

  it("does not stack the set change when the same feedback is applied twice", () => {
    const once = apply({ soreness: "healed_early", workload: "easy", pump: "low", jointPain: "none" });
    const twice = plansAfterFeedback(once.plans, { "ex-sl-calf": calf }, {
      soreness: "healed_early",
      workload: "easy",
      pump: "low",
      jointPain: "none",
      performances: { "ex-sl-calf": last },
      templateSets: { "ex-sl-calf": 3, "ex-sl-calf:max": 3 },
      appliedDelta: once.appliedDelta,
    });
    expect(twice.plans[0].setsMin).toBe(4);
  });

  it("keeps the set change inside a small cap", () => {
    const heavy = { ...plan, setsMin: 5, setsMax: 5 };
    const result = plansAfterFeedback([heavy], { "ex-sl-calf": calf }, {
      soreness: "never",
      workload: "easy",
      pump: "low",
      jointPain: "none",
      performances: {},
      templateSets: { "ex-sl-calf": 5, "ex-sl-calf:max": 5 },
      appliedDelta: 0,
    });
    expect(result.plans[0].setsMin).toBe(5);
  });
});

describe("joint pain flags the exercise", () => {
  it("reads older stored joint-pain values as some or a lot", () => {
    expect(normalizeJointPain("low")).toBe("some");
    expect(normalizeJointPain("moderate")).toBe("some");
    expect(normalizeJointPain("a_lot")).toBe("a_lot");
    expect(normalizeJointPain("none")).toBe("none");
  });

  it("holds the load and suggests a swap when there was some joint pain", () => {
    const result = apply({ soreness: "never", workload: "easy", pump: "low", jointPain: "some" });
    expect(result.plans[0].recommendation.flagSwap).toBe(true);
    expect(result.plans[0].recommendation.action).toBe("hold_load");
    expect(result.plans[0].loadKg ?? null).toBeNull();
    expect(result.plans[0].targetDose).toBe(8);
  });

  it("reduces the load and suggests a swap when joints hurt a lot", () => {
    const result = apply({ soreness: "just_in_time", workload: "pretty_good", pump: "moderate", jointPain: "a_lot" });
    expect(result.plans[0].recommendation.action).toBe("reduce_load");
    expect(result.plans[0].recommendation.flagSwap).toBe(true);
    expect(result.plans[0].variation).toBe("bilateral");
  });
});

describe("load moves one small step, after reps", () => {
  it("adds a rep before any load", () => {
    const early = { ...last, reps: 8 };
    const result = plansAfterFeedback([plan], { "ex-sl-calf": calf }, {
      soreness: "just_in_time",
      workload: "pretty_good",
      pump: "moderate",
      jointPain: "none",
      performances: { "ex-sl-calf": early },
      templateSets: { "ex-sl-calf": 3, "ex-sl-calf:max": 3 },
      appliedDelta: 0,
    });
    expect(result.plans[0].recommendation.action).toBe("add_reps");
    expect(result.plans[0].targetDose).toBe(9);
    expect(result.plans[0].loadKg ?? null).toBeNull();
  });

  it("adds a single kilogram only once reps are full", () => {
    const result = apply({ soreness: "just_in_time", workload: "pretty_good", pump: "moderate", jointPain: "none" });
    expect(result.plans[0].recommendation.action).toBe("add_load");
    expect(result.plans[0].loadKg).toBe(1);
    expect(result.plans[0].targetDose).toBe(8);
  });

  it("does not add load on a deload week", () => {
    const result = apply({ soreness: "never", workload: "easy", pump: "low", jointPain: "none" }, { deload: true });
    expect(result.plans[0].recommendation.action).toBe("deload");
    expect(result.plans[0].loadKg ?? null).toBeNull();
    expect(result.plans[0].setsMin).toBe(3);
  });
});
