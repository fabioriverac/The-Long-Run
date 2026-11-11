import { boolean, doublePrecision, integer, pgTable, text } from "drizzle-orm/pg-core";

function bookkeeping() {
  return {
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    deletedAt: text("deleted_at"),
    serverReceivedAt: text("server_received_at"),
  };
}

export const exercises = pgTable("exercises", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  muscle: text("muscle").notNull(),
  equipment: text("equipment").notNull(),
  unit: text("unit").notNull(),
  perSide: boolean("per_side").notNull().default(false),
  progression: text("progression").notNull(),
  doseStep: integer("dose_step").notNull(),
  loadStepKg: doublePrecision("load_step_kg").notNull(),
  variationLadder: text("variation_ladder").notNull(),
  defaultVariation: text("default_variation").notNull(),
  regression: text("regression"),
  sideNote: text("side_note").notNull(),
  notes: text("notes").notNull(),
  cues: text("cues").notNull(),
  custom: boolean("custom").notNull().default(false),
  ...bookkeeping(),
});

export const mesocycles = pgTable("mesocycles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  kind: text("kind").notNull(),
  templateId: text("template_id"),
  status: text("status").notNull(),
  weeks: integer("weeks").notNull(),
  includesDeload: boolean("includes_deload").notNull().default(false),
  focus: text("focus").notNull(),
  notes: text("notes").notNull(),
  startedOn: text("started_on"),
  ...bookkeeping(),
});

export const trainingDays = pgTable("training_days", {
  id: text("id").primaryKey(),
  mesoId: text("meso_id").notNull(),
  label: text("label").notNull(),
  name: text("name").notNull(),
  weekday: integer("weekday").notNull(),
  timeLabel: text("time_label").notNull(),
  focus: text("focus").notNull(),
  targetRir: integer("target_rir").notNull(),
  restMinSeconds: integer("rest_min_seconds").notNull(),
  restMaxSeconds: integer("rest_max_seconds").notNull(),
  sortOrder: integer("sort_order").notNull(),
  isLight: boolean("is_light").notNull().default(false),
  warmup: text("warmup").notNull(),
  ...bookkeeping(),
});

export const plannedExercises = pgTable("planned_exercises", {
  id: text("id").primaryKey(),
  trainingDayId: text("training_day_id").notNull(),
  exerciseId: text("exercise_id").notNull(),
  sortOrder: integer("sort_order").notNull(),
  setsMin: integer("sets_min").notNull(),
  setsMax: integer("sets_max").notNull(),
  repsMin: integer("reps_min").notNull(),
  repsMax: integer("reps_max").notNull(),
  targetDose: integer("target_dose").notNull(),
  targetRir: integer("target_rir").notNull(),
  perSide: boolean("per_side").notNull().default(false),
  optional: boolean("optional").notNull().default(false),
  laterOption: boolean("later_option").notNull().default(false),
  notes: text("notes").notNull(),
  variation: text("variation").notNull(),
  loadKg: doublePrecision("load_kg"),
  loadLabel: text("load_label").notNull(),
  ...bookkeeping(),
});

export const workouts = pgTable("workouts", {
  id: text("id").primaryKey(),
  mesoId: text("meso_id"),
  trainingDayId: text("training_day_id"),
  weekIndex: integer("week_index"),
  date: text("date").notNull(),
  startedAt: text("started_at"),
  finishedAt: text("finished_at"),
  status: text("status").notNull(),
  notes: text("notes").notNull(),
  sample: boolean("sample").notNull().default(false),
  ...bookkeeping(),
});

export const sets = pgTable("sets", {
  id: text("id").primaryKey(),
  workoutId: text("workout_id").notNull(),
  plannedExerciseId: text("planned_exercise_id"),
  exerciseId: text("exercise_id").notNull(),
  setNumber: integer("set_number").notNull(),
  loadKg: doublePrecision("load_kg"),
  loadLabel: text("load_label").notNull(),
  reps: integer("reps"),
  seconds: integer("seconds"),
  steps: integer("steps"),
  rir: integer("rir"),
  variation: text("variation").notNull(),
  completed: boolean("completed").notNull().default(false),
  sample: boolean("sample").notNull().default(false),
  ...bookkeeping(),
});

export const feedback = pgTable("feedback", {
  id: text("id").primaryKey(),
  workoutId: text("workout_id").notNull(),
  exerciseId: text("exercise_id"),
  muscle: text("muscle"),
  appliedDelta: integer("applied_delta"),
  jointPain: text("joint_pain").notNull(),
  soreness: text("soreness").notNull(),
  pump: text("pump").notNull(),
  workload: text("workload").notNull(),
  sample: boolean("sample").notNull().default(false),
  ...bookkeeping(),
});

export const safetyChecks = pgTable("safety_checks", {
  id: text("id").primaryKey(),
  workoutId: text("workout_id").notNull(),
  kind: text("kind").notNull(),
  painLocation: text("pain_location").notNull(),
  painDuring: integer("pain_during"),
  painQuality: text("pain_quality").notNull(),
  firstStepVsBaseline: text("first_step_vs_baseline"),
  swelling: text("swelling").notNull(),
  gaitChange: text("gait_change").notNull(),
  lossOfControl: boolean("loss_of_control").notNull().default(false),
  focalBonePain: boolean("focal_bone_pain").notNull().default(false),
  notes: text("notes").notNull(),
  sample: boolean("sample").notNull().default(false),
  ...bookkeeping(),
});

export const schema = {
  exercises,
  mesocycles,
  trainingDays,
  plannedExercises,
  workouts,
  sets,
  feedback,
  safetyChecks,
};
