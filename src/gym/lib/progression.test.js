import { describe, expect, it } from "vitest";
import {
  CLINICIAN_NOTE,
  EPLEY_CAPTION,
  PHYSIO_NOTE,
  coordinateSuggestions,
  epleyE1rm,
  suggestProgression,
} from "./progression.js";

const calf = {
  id: "ex-sl-calf",
  name: "Single-leg calf raise",
  equipment: "bodyweight",
  unit: "reps",
  progression: "reps_then_external_load",
  doseStep: 1,
  loadStepKg: 1,
  variationLadder: [],
  defaultVariation: "single-leg",
  regression: { variation: "bilateral", label: "Bilateral calf raise" },
};

const calfPlan = {
  repsMin: 8,
  repsMax: 8,
  targetDose: 8,
  targetRir: 3,
  variation: "single-leg",
  loadKg: null,
  loadLabel: "bodyweight",
};

const pushup = {
  id: "ex-pushup",
  name: "Push-up",
  equipment: "bodyweight",
  unit: "reps",
  progression: "reps_then_leverage",
  doseStep: 1,
  loadStepKg: 1,
  variationLadder: [
    { id: "wall", label: "Wall" },
    { id: "incline", label: "Incline" },
    { id: "floor", label: "Floor" },
  ],
  defaultVariation: "incline",
  regression: { variation: "wall", label: "Wall push-up" },
};

const pushupPlan = {
  repsMin: 6,
  repsMax: 12,
  targetDose: 6,
  targetRir: 3,
  variation: "incline",
  loadKg: null,
  loadLabel: "bodyweight",
};

function session(overrides = {}) {
  const base = {
    date: "2026-11-02",
    reps: 8,
    seconds: null,
    steps: null,
    loadKg: 0,
    loadLabel: "bodyweight",
    variation: "single-leg",
    rir: 3,
    weekIndex: 1,
    safety: {
      painLocation: "",
      painDuring: 0,
      painQuality: "none",
      swelling: "none",
      gaitChange: "none",
      lossOfControl: false,
      focalBonePain: false,
    },
    morning: {
      painLocation: "",
      firstStepVsBaseline: "same",
      swelling: "none",
      gaitChange: "none",
      focalBonePain: false,
    },
    feedback: {
      jointPain: "none",
      soreness: "just_in_time",
      pump: "moderate",
      workload: "pretty_good",
    },
  };
  return {
    ...base,
    ...overrides,
    safety: overrides.safety === null ? null : { ...base.safety, ...overrides.safety },
    morning: overrides.morning === null ? null : { ...base.morning, ...overrides.morning },
    feedback: overrides.feedback === null ? null : { ...base.feedback, ...overrides.feedback },
  };
}

function suggest(history, exercise = calf, plan = calfPlan) {
  return suggestProgression({ exercise, plan, history });
}

describe("epleyE1rm", () => {
  it("matches the labelled estimate used on the progress screen", () => {
    expect(epleyE1rm(24, 12)).toBe(33.6);
    expect(epleyE1rm(24, 10)).toBe(32);
    expect(epleyE1rm(22, 12)).toBe(30.8);
    expect(EPLEY_CAPTION).toMatch(/not a tested max/i);
  });

  it("returns null without external load so bodyweight work is not pretending to be a max", () => {
    expect(epleyE1rm(0, 12)).toBeNull();
    expect(epleyE1rm(null, 8)).toBeNull();
  });
});

describe("Coach progression", () => {
  it("does not progress just because the calendar week is later", () => {
    const early = suggest([session({ weekIndex: 1, date: "2026-11-02" })]);
    const late = suggest([session({ weekIndex: 8, date: "2026-12-21" })]);
    expect(early.action).toBe("hold");
    expect(early.reason).toBe("need_repeat");
    expect(late).toEqual(early);
  });

  it("progresses the same way in week 1 and week 8 once two sessions were well tolerated", () => {
    const historyFor = (week) => [
      session({ weekIndex: week, date: "2026-11-09" }),
      session({ weekIndex: week, date: "2026-11-02" }),
    ];
    const week1 = suggest(historyFor(1));
    const week8 = suggest(historyFor(8));
    expect(week1.action).toBe("add_load");
    expect(week1.reason).toBe("smallest_load");
    expect(week1.next.loadKg).toBe(1);
    expect(week1.next.targetDose).toBe(8);
    expect(week8).toEqual(week1);
    expect(JSON.stringify(week1)).not.toMatch(/max test|1rm test|amrap/i);
  });

  it("adds reps before any load while there is room in the range", () => {
    const bridge = { ...calf, id: "ex-bridge", name: "Single-leg glute bridge", regression: null };
    const plan = { ...calfPlan, repsMin: 8, repsMax: 10, targetDose: 8, variation: "single-leg" };
    const result = suggest(
      [
        session({ reps: 8, variation: "single-leg" }),
        session({ reps: 8, variation: "single-leg" }),
      ],
      bridge,
      plan,
    );
    expect(result.action).toBe("add_reps");
    expect(result.next.targetDose).toBe(9);
    expect(result.next.loadKg).toBe(0);
  });

  it("treats pain at or under 3/10 as not clearance", () => {
    const painful = { painDuring: 3, painQuality: "dull" };
    const once = suggest([session({ safety: painful })]);
    expect(once.action).toBe("hold");
    expect(once.reason).toBe("need_repeat");

    const sharp = suggest([
      session({ safety: { painDuring: 2, painQuality: "sharp" } }),
      session({ safety: { painDuring: 2, painQuality: "sharp" } }),
    ]);
    expect(sharp.action).toBe("regress");

    const clearedByTheOtherGates = suggest([
      session({ safety: painful }),
      session({ safety: painful }),
    ]);
    expect(clearedByTheOtherGates.action).toBe("add_load");

    const worseMorning = suggest([
      session({ safety: { painDuring: 1, painQuality: "dull" }, morning: { firstStepVsBaseline: "worse" } }),
    ]);
    expect(worseMorning.action).toBe("regress");
    expect(worseMorning.reason).toBe("morning_worse");
  });

  it("regresses or stops on the safety fields instead of adding dose", () => {
    expect(suggest([session({ safety: { gaitChange: "limping" } })]).action).toBe("regress");
    expect(suggest([session({ safety: { lossOfControl: true } })]).action).toBe("regress");
    expect(suggest([session({ safety: { swelling: "mild" } })]).action).toBe("hold");

    const bone = suggest([session({ safety: { focalBonePain: true, painLocation: "Left heel" } })]);
    expect(bone.action).toBe("stop");
    expect(bone.clinician).toBe(true);
    expect(bone.text).toContain(CLINICIAN_NOTE);

    const cannot = suggest([session({ safety: { gaitChange: "cannot_bear_weight" } })]);
    expect(cannot.action).toBe("stop");
    expect(cannot.clinician).toBe(true);

    const swollen = suggest([session({ morning: { swelling: "significant", firstStepVsBaseline: "same" } })]);
    expect(swollen.action).toBe("stop");
  });

  it("points persistent heel and inner-ankle symptoms toward a physio", () => {
    const result = suggest([
      session({ safety: { painLocation: "Left heel" } }),
      session({ safety: { painLocation: "Left inner ankle" } }),
    ]);
    expect(result.physio).toBe(true);
    expect(PHYSIO_NOTE).toMatch(/physio/i);
  });

  it("holds when the next morning has not been checked, and when the set was a failure", () => {
    expect(suggest([session({ morning: null }), session()]).reason).toBe("morning_pending");
    const failure = suggest([session({ rir: 0 }), session({ rir: 0 })]);
    expect(failure.action).toBe("hold");
    expect(failure.reason).toBe("failure");
    expect(failure.text).toMatch(/failure/i);
  });

  it("steps push-ups along wall, incline, and floor and then stops", () => {
    const atTopOfIncline = suggest(
      [
        session({ reps: 12, variation: "incline", rir: 3 }),
        session({ reps: 12, variation: "incline", rir: 3 }),
      ],
      pushup,
      pushupPlan,
    );
    expect(atTopOfIncline.action).toBe("add_variation");
    expect(atTopOfIncline.next.variation).toBe("floor");
    expect(atTopOfIncline.next.targetDose).toBe(6);

    const atFloor = suggest(
      [
        session({ reps: 12, variation: "floor", rir: 3 }),
        session({ reps: 12, variation: "floor", rir: 3 }),
      ],
      pushup,
      { ...pushupPlan, variation: "floor" },
    );
    expect(atFloor.action).toBe("hold");
    expect(atFloor.reason).toBe("ceiling");
    expect(atFloor.text).toMatch(/push-up/i);
    expect(atFloor.next).toBeNull();
  });

  it("changes only one exercise at a time", () => {
    const ready = suggest([session(), session()]);
    const alsoReady = suggest(
      [
        session({ reps: 10, variation: "incline" }),
        session({ reps: 10, variation: "incline" }),
        session({ reps: 9, variation: "incline" }),
        session({ reps: 8, variation: "incline" }),
      ],
      pushup,
      pushupPlan,
    );
    const coordinated = coordinateSuggestions([
      { id: "calf", name: calf.name, sortOrder: 0, suggestion: ready },
      { id: "pushup", name: pushup.name, sortOrder: 20, suggestion: alsoReady },
    ]);
    const progressing = coordinated.filter((entry) =>
      ["add_reps", "add_load", "add_variation"].includes(entry.suggestion.action),
    );
    expect(progressing).toHaveLength(1);
    expect(progressing[0].id).toBe("pushup");
    expect(coordinated.find((entry) => entry.id === "calf").suggestion.reason).toBe("one_at_a_time");
  });

  it("adds five seconds at a time on a timed plank, not a kilogram", () => {
    const plank = {
      ...pushup,
      id: "ex-side-plank",
      name: "Side plank",
      unit: "seconds",
      doseStep: 5,
      variationLadder: [
        { id: "bent-knee", label: "Bent-knee" },
        { id: "full", label: "Full" },
      ],
    };
    const plan = { ...pushupPlan, repsMin: 15, repsMax: 30, targetDose: 15, variation: "full" };
    const result = suggest(
      [
        session({ seconds: 15, reps: null, variation: "full" }),
        session({ seconds: 15, reps: null, variation: "full" }),
      ],
      plank,
      plan,
    );
    expect(result.action).toBe("add_reps");
    expect(result.next.targetDose).toBe(20);
    expect(result.next.loadKg).toBe(0);
  });
});
