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
  { value: "some", label: "Some pain" },
  { value: "a_lot", label: "A lot of pain" },
];

export const SORENESS = [
  { value: "never", label: "Never got sore" },
  { value: "healed_early", label: "Healed a while ago" },
  { value: "just_in_time", label: "Healed just on time" },
  { value: "still_sore", label: "I'm still sore" },
];

export const PUMP = [
  { value: "low", label: "Low pump" },
  { value: "moderate", label: "Moderate pump" },
  { value: "amazing", label: "Amazing pump" },
];

export const WORKLOAD = [
  { value: "easy", label: "Easy" },
  { value: "pretty_good", label: "Pretty good" },
  { value: "pushed_limits", label: "Pushed my limits" },
  { value: "too_much", label: "Too much" },
];

export const SEED_STAMP = "2026-11-08T22:32:00.000Z";
export const SEED_VERSION = 2;

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
