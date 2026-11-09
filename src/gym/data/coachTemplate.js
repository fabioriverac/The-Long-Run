import { mondayOnOrBefore, toISODate } from "../lib/dates.js";
import { SEED_STAMP } from "../lib/types.js";

const WARMUP =
  "Warm up with an easy walk or bike. Mobility: knee-to-wall, ankle circles, hip rotations, gentle calf and plantar-fascia stretch — 1–2 sets of 8–10 reps or 20–30 seconds.";

const PLAN_NOTE =
  "Coach's template from 8 Nov 2026. Doses are a proposal, not physio clearance. Written around the left plantar fascia, posterior tibialis, and hip/ITB. Saturday is the long run — no heavy legs before it. Nothing in this plan escalates because a week number changed.";

function exercise(row) {
  return {
    perSide: false,
    progression: "reps_then_external_load",
    doseStep: 1,
    loadStepKg: 1,
    variationLadder: [],
    defaultVariation: "standard",
    regression: null,
    sideNote: "",
    notes: "",
    cues: "",
    custom: false,
    deletedAt: null,
    serverReceivedAt: null,
    createdAt: SEED_STAMP,
    updatedAt: SEED_STAMP,
    ...row,
  };
}

export const COACH_EXERCISES = [
  exercise({
    id: "ex-sl-calf",
    name: "Single-leg calf raise",
    muscle: "Calves",
    equipment: "bodyweight",
    unit: "reps",
    perSide: true,
    defaultVariation: "single-leg",
    regression: { variation: "bilateral", label: "Bilateral calf raise" },
    sideNote: "per side",
    notes: "With support. Left plantar fascia and posterior tibialis are the sensitive side.",
    cues: "Slow lower. Stop the set if heel pain turns sharp.",
  }),
  exercise({
    id: "ex-sl-squat",
    name: "Single-leg squat to bench",
    muscle: "Quads",
    equipment: "bodyweight",
    unit: "reps",
    perSide: true,
    defaultVariation: "to-bench",
    regression: { variation: "sit-to-stand", label: "Sit-to-stand" },
    sideNote: "per side",
    notes: "Regress to a two-leg sit-to-stand if the knee or hip isn't happy.",
  }),
  exercise({
    id: "ex-sl-rdl",
    name: "Single-leg RDL",
    muscle: "Hamstrings",
    equipment: "bodyweight",
    unit: "reps",
    perSide: true,
    defaultVariation: "bodyweight",
    sideNote: "per side",
    notes: "Bodyweight first. A dumbbell is the later, smallest load — only after reps are easy and the next morning stays calm.",
    cues: "Hands on a support if balance goes.",
  }),
  exercise({
    id: "ex-inversion",
    name: "Seated banded foot inversion",
    muscle: "Feet",
    equipment: "band",
    unit: "reps",
    perSide: true,
    defaultVariation: "seated",
    sideNote: "per side",
    notes: "Light band. For the left posterior tibialis. Keep it smooth, not a yank.",
  }),
  exercise({
    id: "ex-dead-bug",
    name: "Dead bug",
    muscle: "Core",
    equipment: "bodyweight",
    unit: "reps",
    perSide: true,
    defaultVariation: "standard",
    sideNote: "per side",
    notes: "Low back stays down. Shorten the lever if it peels up.",
  }),
  exercise({
    id: "ex-step-down",
    name: "Low step-down",
    muscle: "Quads",
    equipment: "bodyweight",
    unit: "reps",
    perSide: true,
    defaultVariation: "low-step",
    sideNote: "per side",
    notes: "Hip and knee control. Use a lower step if the knee dives or the hip complains.",
  }),
  exercise({
    id: "ex-hip-abd",
    name: "Standing band hip abduction",
    muscle: "Hips",
    equipment: "band",
    unit: "reps",
    perSide: true,
    defaultVariation: "standing",
    sideNote: "per side",
    notes: "Light band. Tall posture, pelvis quiet.",
  }),
  exercise({
    id: "ex-side-plank",
    name: "Side plank",
    muscle: "Core",
    equipment: "bodyweight",
    unit: "seconds",
    perSide: true,
    progression: "reps_then_leverage",
    doseStep: 5,
    variationLadder: [
      { id: "bent-knee", label: "Bent-knee" },
      { id: "full", label: "Full" },
    ],
    defaultVariation: "full",
    regression: { variation: "bent-knee", label: "Bent-knee side plank" },
    sideNote: "per side",
    notes: "15–30 seconds a side. Bent-knee is the regression.",
  }),
  exercise({
    id: "ex-band-walk",
    name: "Lateral band walk",
    muscle: "Hips",
    equipment: "band",
    unit: "steps",
    perSide: true,
    defaultVariation: "lateral",
    sideNote: "each way",
    notes: "8–10 steps each way. Soft knees, feet quiet.",
  }),
  exercise({
    id: "ex-copenhagen",
    name: "Short-lever Copenhagen",
    muscle: "Hips",
    equipment: "bodyweight",
    unit: "seconds",
    perSide: true,
    progression: "reps_then_leverage",
    doseStep: 5,
    defaultVariation: "short-lever",
    sideNote: "per side",
    notes: "Later option. Coach listed 2 × 10–20 seconds. Leave it out until you want it in the session.",
  }),
  exercise({
    id: "ex-sp-lift",
    name: "Side-plank leg lift",
    muscle: "Hips",
    equipment: "bodyweight",
    unit: "reps",
    perSide: true,
    defaultVariation: "standard",
    sideNote: "per side",
    notes: "Later option. No dose was set — edit one before you use it.",
  }),
  exercise({
    id: "ex-bridge",
    name: "Single-leg glute bridge",
    muscle: "Hips",
    equipment: "bodyweight",
    unit: "reps",
    perSide: true,
    defaultVariation: "single-leg",
    regression: { variation: "bilateral", label: "Bilateral glute bridge" },
    sideNote: "per side",
    notes: "Hips level. Regress to both feet down.",
  }),
  exercise({
    id: "ex-bi-calf",
    name: "Bilateral calf raise",
    muscle: "Calves",
    equipment: "bodyweight",
    unit: "reps",
    defaultVariation: "bilateral",
    notes: "Optional ball between the ankles. Easy range, no bounce into a sore heel.",
  }),
  exercise({
    id: "ex-pushup",
    name: "Push-up",
    muscle: "Chest",
    equipment: "bodyweight",
    unit: "reps",
    progression: "reps_then_leverage",
    variationLadder: [
      { id: "wall", label: "Wall" },
      { id: "incline", label: "Incline" },
      { id: "floor", label: "Floor" },
    ],
    defaultVariation: "incline",
    regression: { variation: "wall", label: "Wall push-up" },
    notes: "The only upper-body exercise agreed for now. Start where 6 reps still leaves about 2–3 RIR — wall, incline, or floor. Add your own lifts when you and Coach agree.",
  }),
];

const DAY_DEFS = [
  {
    key: "a",
    label: "A",
    name: "Return",
    weekday: 1,
    timeLabel: "18:30",
    focus: "Bodyweight / light",
    targetRir: 3,
    isLight: false,
    sortOrder: 0,
    plans: [
      plan("ex-sl-calf", { setsMin: 3, setsMax: 3, repsMin: 8, repsMax: 8, variation: "single-leg" }),
      plan("ex-sl-squat", { setsMin: 3, setsMax: 3, repsMin: 8, repsMax: 8, variation: "to-bench" }),
      plan("ex-sl-rdl", { setsMin: 3, setsMax: 3, repsMin: 8, repsMax: 8, variation: "bodyweight" }),
      plan("ex-inversion", {
        setsMin: 3,
        setsMax: 3,
        repsMin: 12,
        repsMax: 12,
        variation: "seated",
        loadLabel: "light",
      }),
      plan("ex-dead-bug", { setsMin: 3, setsMax: 3, repsMin: 8, repsMax: 8 }),
    ],
  },
  {
    key: "b",
    label: "B",
    name: "Hip control",
    weekday: 4,
    timeLabel: "18:30",
    focus: "Hip control",
    targetRir: 3,
    isLight: false,
    sortOrder: 1,
    plans: [
      plan("ex-step-down", { setsMin: 2, setsMax: 3, repsMin: 8, repsMax: 8, variation: "low-step" }),
      plan("ex-hip-abd", {
        setsMin: 2,
        setsMax: 3,
        repsMin: 12,
        repsMax: 12,
        variation: "standing",
        loadLabel: "light",
      }),
      plan("ex-side-plank", { setsMin: 2, setsMax: 2, repsMin: 15, repsMax: 30, variation: "full" }),
      plan("ex-band-walk", {
        setsMin: 2,
        setsMax: 2,
        repsMin: 8,
        repsMax: 10,
        variation: "lateral",
        loadLabel: "light",
      }),
      plan("ex-copenhagen", {
        setsMin: 2,
        setsMax: 2,
        repsMin: 10,
        repsMax: 20,
        variation: "short-lever",
        laterOption: true,
        notes: "Later option. 2 × 10–20 seconds a side when you choose to add it.",
      }),
      plan("ex-sp-lift", {
        setsMin: 2,
        setsMax: 2,
        repsMin: 8,
        repsMax: 8,
        laterOption: true,
        notes: "Later option. Dose was not set — edit it before using it.",
      }),
    ],
  },
  {
    key: "c",
    label: "C",
    name: "Light",
    weekday: 0,
    timeLabel: "15:00",
    focus: "Light, home is fine",
    targetRir: 4,
    isLight: true,
    sortOrder: 2,
    plans: [
      plan("ex-bridge", { setsMin: 2, setsMax: 2, repsMin: 8, repsMax: 10, variation: "single-leg" }),
      plan("ex-bi-calf", { setsMin: 2, setsMax: 2, repsMin: 10, repsMax: 10, variation: "bilateral" }),
      plan("ex-inversion", {
        setsMin: 1,
        setsMax: 2,
        repsMin: 12,
        repsMax: 12,
        variation: "seated",
        loadLabel: "light",
        optional: true,
        notes: "Optional. 1–2 × 12.",
      }),
      plan("ex-dead-bug", { setsMin: 2, setsMax: 2, repsMin: 8, repsMax: 8 }),
      plan("ex-pushup", {
        setsMin: 2,
        setsMax: 2,
        repsMin: 6,
        repsMax: 12,
        variation: "incline",
        targetRir: 3,
        notes: "Wall, incline, or floor. Leave about 2–3 RIR even though the rest of Sunday is closer to 4.",
      }),
    ],
  },
];

function plan(exerciseId, overrides) {
  return {
    exerciseId,
    setsMin: 2,
    setsMax: 2,
    repsMin: 8,
    repsMax: 8,
    targetRir: null,
    perSide: false,
    optional: false,
    laterOption: false,
    notes: "",
    variation: "standard",
    loadKg: null,
    loadLabel: "bodyweight",
    ...overrides,
  };
}

function stamp(row) {
  return { ...row, createdAt: SEED_STAMP, updatedAt: SEED_STAMP, deletedAt: null, serverReceivedAt: null };
}

function materialize(prefix, mesoId) {
  const trainingDays = [];
  const plannedExercises = [];
  for (const day of DAY_DEFS) {
    const dayId = `${prefix}-day-${day.key}`;
    trainingDays.push(
      stamp({
        id: dayId,
        mesoId,
        label: day.label,
        name: day.name,
        weekday: day.weekday,
        timeLabel: day.timeLabel,
        focus: day.focus,
        targetRir: day.targetRir,
        restMinSeconds: 60,
        restMaxSeconds: 120,
        sortOrder: day.sortOrder,
        isLight: day.isLight,
        warmup: WARMUP,
      }),
    );
    day.plans.forEach((item, sortOrder) => {
      const exercise = COACH_EXERCISES.find((row) => row.id === item.exerciseId);
      plannedExercises.push(
        stamp({
          id: `${prefix}-plan-${day.key}-${item.exerciseId}`,
          trainingDayId: dayId,
          exerciseId: item.exerciseId,
          sortOrder,
          setsMin: item.setsMin,
          setsMax: item.setsMax,
          repsMin: item.repsMin,
          repsMax: item.repsMax,
          targetDose: item.repsMin,
          targetRir: item.targetRir ?? day.targetRir,
          perSide: Boolean(exercise?.perSide),
          optional: item.optional,
          laterOption: item.laterOption,
          notes: item.notes,
          variation: item.variation,
          loadKg: item.loadKg,
          loadLabel: item.loadLabel,
        }),
      );
    });
  }
  return { trainingDays, plannedExercises };
}

export function buildCoachSeed(now = new Date()) {
  const startedOn = mondayOnOrBefore(now);
  const template = materialize("tpl", "meso-template");
  const active = materialize("meso", "meso-current");
  return {
    tables: {
      exercises: COACH_EXERCISES,
      mesocycles: [
        stamp({
          id: "meso-template",
          name: "Coach template",
          kind: "template",
          templateId: null,
          status: "template",
          weeks: 5,
          includesDeload: true,
          focus: "Return phase",
          notes: PLAN_NOTE,
          startedOn: null,
        }),
        stamp({
          id: "meso-current",
          name: "Stronger for the long run",
          kind: "meso",
          templateId: "meso-template",
          status: "active",
          weeks: 5,
          includesDeload: true,
          focus: "Return phase",
          notes: PLAN_NOTE,
          startedOn,
        }),
      ],
      trainingDays: [...template.trainingDays, ...active.trainingDays],
      plannedExercises: [...template.plannedExercises, ...active.plannedExercises],
      workouts: [],
      sets: [],
      feedback: [],
      safetyChecks: [],
    },
    startedOn,
    seededOn: toISODate(now instanceof Date ? now : new Date(now)),
  };
}
