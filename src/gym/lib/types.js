/** Client record shapes for the gym log. Synced tables match server/gym/tables.js. */

export const DATA_TABLES = [
  "exercises",
  "mesocycles",
  "trainingDays",
  "plannedExercises",
  "workouts",
  "sets",
  "feedback",
  "safetyChecks",
];

export const JOINT_PAIN = [
  { value: "none", label: "None" },
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "a_lot", label: "A lot" },
];

export const SORENESS = [
  { value: "never", label: "Never sore" },
  { value: "healed_early", label: "Healed early" },
  { value: "just_in_time", label: "Just in time" },
  { value: "still_sore", label: "Still sore" },
];

export const PUMP = [
  { value: "low", label: "Low" },
  { value: "moderate", label: "Moderate" },
  { value: "amazing", label: "Amazing" },
];

export const WORKLOAD = [
  { value: "easy", label: "Easy" },
  { value: "pretty_good", label: "Pretty good" },
  { value: "pushed_limits", label: "Pushed limits" },
  { value: "too_much", label: "Too much" },
];

export const PAIN_QUALITY = [
  { value: "none", label: "None" },
  { value: "dull", label: "Dull" },
  { value: "sharp", label: "Sharp" },
  { value: "increasing", label: "Increasing" },
];

export const SWELLING = [
  { value: "none", label: "None" },
  { value: "mild", label: "Mild" },
  { value: "significant", label: "Significant" },
];

export const GAIT = [
  { value: "none", label: "No change" },
  { value: "slight", label: "Slight change" },
  { value: "limping", label: "Limping" },
  { value: "cannot_bear_weight", label: "Can't bear weight" },
];

export const FIRST_STEP = [
  { value: "better", label: "Better" },
  { value: "same", label: "Same" },
  { value: "worse", label: "Worse" },
  { value: "much_worse", label: "Much worse" },
];

export const PAIN_LOCATIONS = [
  "None",
  "Left heel",
  "Left inner ankle",
  "Arch",
  "Calf",
  "Knee",
  "Hip",
];

export const SEED_STAMP = "2026-11-08T22:32:00.000Z";
export const SEED_VERSION = 1;

export function newId(prefix) {
  const id = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${id}`;
}

export function newExercise(partial = {}) {
  return {
    id: partial.id || newId("ex"),
    name: partial.name || "New exercise",
    muscle: partial.muscle || "Other",
    equipment: partial.equipment || "bodyweight",
    unit: partial.unit || "reps",
    perSide: Boolean(partial.perSide),
    progression: partial.progression || "reps_then_external_load",
    doseStep: partial.doseStep ?? 1,
    loadStepKg: partial.loadStepKg ?? 1,
    variationLadder: partial.variationLadder || [],
    defaultVariation: partial.defaultVariation || "standard",
    regression: partial.regression || null,
    sideNote: partial.sideNote || "",
    notes: partial.notes || "",
    cues: partial.cues || "",
    custom: partial.custom ?? true,
    createdAt: partial.createdAt || null,
    updatedAt: partial.updatedAt || null,
    deletedAt: null,
    serverReceivedAt: null,
  };
}
