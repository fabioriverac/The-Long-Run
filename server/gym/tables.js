/**
 * Column contract shared by Drizzle, the SQL migration, and the sync upsert.
 * `json` columns are stored as text so the HTTP driver never has to cast jsonb.
 */

function col(field, column, type, extra = {}) {
  return { field, column, type, null: false, ...extra };
}

const bookkeeping = [
  col("createdAt", "created_at", "text"),
  col("updatedAt", "updated_at", "text"),
  col("deletedAt", "deleted_at", "text", { null: true }),
  col("serverReceivedAt", "server_received_at", "text", { null: true }),
];

export const TABLES = {
  exercises: {
    sqlName: "exercises",
    columns: [
      col("id", "id", "text", { primary: true }),
      col("name", "name", "text"),
      col("muscle", "muscle", "text"),
      col("equipment", "equipment", "text"),
      col("unit", "unit", "text"),
      col("perSide", "per_side", "bool", { defaultSql: "false" }),
      col("progression", "progression", "text"),
      col("doseStep", "dose_step", "int"),
      col("loadStepKg", "load_step_kg", "real"),
      col("variationLadder", "variation_ladder", "json"),
      col("defaultVariation", "default_variation", "text"),
      col("regression", "regression", "json", { null: true }),
      col("sideNote", "side_note", "text"),
      col("notes", "notes", "text"),
      col("cues", "cues", "text"),
      col("custom", "custom", "bool", { defaultSql: "false" }),
      ...bookkeeping,
    ],
  },
  mesocycles: {
    sqlName: "mesocycles",
    columns: [
      col("id", "id", "text", { primary: true }),
      col("name", "name", "text"),
      col("kind", "kind", "text"),
      col("templateId", "template_id", "text", { null: true }),
      col("status", "status", "text"),
      col("weeks", "weeks", "int"),
      col("includesDeload", "includes_deload", "bool", { defaultSql: "false" }),
      col("focus", "focus", "text"),
      col("notes", "notes", "text"),
      col("startedOn", "started_on", "text", { null: true }),
      ...bookkeeping,
    ],
  },
  trainingDays: {
    sqlName: "training_days",
    columns: [
      col("id", "id", "text", { primary: true }),
      col("mesoId", "meso_id", "text"),
      col("label", "label", "text"),
      col("name", "name", "text"),
      col("weekday", "weekday", "int"),
      col("timeLabel", "time_label", "text"),
      col("focus", "focus", "text"),
      col("targetRir", "target_rir", "int"),
      col("restMinSeconds", "rest_min_seconds", "int"),
      col("restMaxSeconds", "rest_max_seconds", "int"),
      col("sortOrder", "sort_order", "int"),
      col("isLight", "is_light", "bool", { defaultSql: "false" }),
      col("warmup", "warmup", "text"),
      ...bookkeeping,
    ],
  },
  plannedExercises: {
    sqlName: "planned_exercises",
    columns: [
      col("id", "id", "text", { primary: true }),
      col("trainingDayId", "training_day_id", "text"),
      col("exerciseId", "exercise_id", "text"),
      col("sortOrder", "sort_order", "int"),
      col("setsMin", "sets_min", "int"),
      col("setsMax", "sets_max", "int"),
      col("repsMin", "reps_min", "int"),
      col("repsMax", "reps_max", "int"),
      col("targetDose", "target_dose", "int"),
      col("targetRir", "target_rir", "int"),
      col("perSide", "per_side", "bool", { defaultSql: "false" }),
      col("optional", "optional", "bool", { defaultSql: "false" }),
      col("laterOption", "later_option", "bool", { defaultSql: "false" }),
      col("notes", "notes", "text"),
      col("variation", "variation", "text"),
      col("loadKg", "load_kg", "real", { null: true }),
      col("loadLabel", "load_label", "text"),
      ...bookkeeping,
    ],
  },
  workouts: {
    sqlName: "workouts",
    columns: [
      col("id", "id", "text", { primary: true }),
      col("mesoId", "meso_id", "text", { null: true }),
      col("trainingDayId", "training_day_id", "text", { null: true }),
      col("weekIndex", "week_index", "int", { null: true }),
      col("date", "date", "text"),
      col("startedAt", "started_at", "text", { null: true }),
      col("finishedAt", "finished_at", "text", { null: true }),
      col("status", "status", "text"),
      col("notes", "notes", "text"),
      col("sample", "sample", "bool", { defaultSql: "false" }),
      ...bookkeeping,
    ],
  },
  sets: {
    sqlName: "sets",
    columns: [
      col("id", "id", "text", { primary: true }),
      col("workoutId", "workout_id", "text"),
      col("plannedExerciseId", "planned_exercise_id", "text", { null: true }),
      col("exerciseId", "exercise_id", "text"),
      col("setNumber", "set_number", "int"),
      col("loadKg", "load_kg", "real", { null: true }),
      col("loadLabel", "load_label", "text"),
      col("reps", "reps", "int", { null: true }),
      col("seconds", "seconds", "int", { null: true }),
      col("steps", "steps", "int", { null: true }),
      col("rir", "rir", "int", { null: true }),
      col("variation", "variation", "text"),
      col("completed", "completed", "bool", { defaultSql: "false" }),
      col("sample", "sample", "bool", { defaultSql: "false" }),
      ...bookkeeping,
    ],
  },
  feedback: {
    sqlName: "feedback",
    columns: [
      col("id", "id", "text", { primary: true }),
      col("workoutId", "workout_id", "text"),
      col("exerciseId", "exercise_id", "text", { null: true }),
      col("jointPain", "joint_pain", "text"),
      col("soreness", "soreness", "text"),
      col("pump", "pump", "text"),
      col("workload", "workload", "text"),
      col("sample", "sample", "bool", { defaultSql: "false" }),
      ...bookkeeping,
    ],
  },
  safetyChecks: {
    sqlName: "safety_checks",
    columns: [
      col("id", "id", "text", { primary: true }),
      col("workoutId", "workout_id", "text"),
      col("kind", "kind", "text"),
      col("painLocation", "pain_location", "text"),
      col("painDuring", "pain_during", "int", { null: true }),
      col("painQuality", "pain_quality", "text"),
      col("firstStepVsBaseline", "first_step_vs_baseline", "text", { null: true }),
      col("swelling", "swelling", "text"),
      col("gaitChange", "gait_change", "text"),
      col("lossOfControl", "loss_of_control", "bool", { defaultSql: "false" }),
      col("focalBonePain", "focal_bone_pain", "bool", { defaultSql: "false" }),
      col("notes", "notes", "text"),
      col("sample", "sample", "bool", { defaultSql: "false" }),
      ...bookkeeping,
    ],
  },
};

function sqlType(type) {
  if (type === "int") return "integer";
  if (type === "real") return "double precision";
  if (type === "bool") return "boolean";
  return "text";
}

function quoteIdent(name) {
  return `"${name}"`;
}

export function createTableStatement(table) {
  const lines = table.columns.map((column) => {
    let line = `${quoteIdent(column.column)} ${sqlType(column.type)}`;
    if (column.primary) line += " primary key";
    else if (!column.null) line += " not null";
    if (column.defaultSql != null) line += ` default ${column.defaultSql}`;
    return line;
  });
  return `create table if not exists ${quoteIdent(table.sqlName)} (${lines.join(", ")})`;
}

export function migrationStatements() {
  const statements = [
    `create table if not exists gym_schema_migrations (
      id text primary key,
      applied_at timestamptz not null default now()
    )`,
  ];
  for (const table of Object.values(TABLES)) {
    statements.push(createTableStatement(table));
    statements.push(
      `create index if not exists ${quoteIdent(`${table.sqlName}_server_received_idx`)} on ${quoteIdent(table.sqlName)} (${quoteIdent("server_received_at")})`,
    );
  }
  return statements;
}

export function toDbValues(table, data, receivedAt) {
  const values = {};
  for (const column of table.columns) {
    if (column.field === "serverReceivedAt") {
      values.serverReceivedAt = receivedAt;
      continue;
    }
    let value = data[column.field];
    if (column.type === "json") {
      value = value == null ? null : JSON.stringify(value);
    }
    if (value === undefined) value = column.null ? null : null;
    values[column.field] = value;
  }
  return values;
}

export function fromDbRow(table, row) {
  const data = { ...row };
  for (const column of table.columns) {
    if (column.type === "json" && typeof data[column.field] === "string") {
      try {
        data[column.field] = JSON.parse(data[column.field]);
      } catch {
        data[column.field] = null;
      }
    }
  }
  return data;
}
