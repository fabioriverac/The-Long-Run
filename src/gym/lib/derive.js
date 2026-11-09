import { addDays, formatShortDate, weekdayIndex, weekdayName, weekIndex } from "./dates.js";
import { doseOf, epleyE1rm, nextExerciseDose, normalizeJointPain, rirForWeek } from "./progression.js";

export const MUSCLE_COLOR = {
  Chest: "#ff5d8f",
  Back: "#5eb0ff",
  Shoulders: "#c9a0ff",
  Triceps: "#f0a05a",
  Biceps: "#f2d06b",
  Quads: "#67c587",
  Hamstrings: "#8fd0d8",
  Calves: "#ff8a5b",
  Hips: "#67c587",
  Glutes: "#67c587",
  Core: "#f2d06b",
  Feet: "#8fd0d8",
  Other: "#9a9aa3",
};

export function muscleColor(muscle) {
  return MUSCLE_COLOR[muscle] || "#ff6b8a";
}

export function visibleRows(rows, showSample) {
  return (rows || []).filter((row) => row && !row.deletedAt && (showSample || !row.sample));
}

function byId(rows) {
  return Object.fromEntries(rows.map((row) => [row.id, row]));
}

function performanceFrom(workout, sets, feedback, exercise) {
  const completed = sets.filter((set) => set.completed);
  if (!completed.length) return null;
  const best = [...completed].sort((a, b) => {
    const load = (b.loadKg || 0) - (a.loadKg || 0);
    if (load !== 0) return load;
    return doseOf(b, exercise.unit) - doseOf(a, exercise.unit);
  })[0];
  return {
    date: workout.date,
    workoutId: workout.id,
    reps: best.reps,
    seconds: best.seconds,
    steps: best.steps,
    loadKg: best.loadKg,
    loadLabel: best.loadLabel,
    variation: best.variation,
    rir: best.rir,
    weekIndex: workout.weekIndex,
    sample: Boolean(workout.sample || best.sample),
    feedback: feedbackForExercise(feedback, workout.id, exercise),
  };
}

function feedbackForExercise(feedback, workoutId, exercise) {
  return (
    (feedback || []).find((row) => row.workoutId === workoutId && row.muscle === exercise.muscle) ||
    (feedback || []).find((row) => row.workoutId === workoutId && row.exerciseId === exercise.id) ||
    null
  );
}

export function historyForExercise(exercise, rows) {
  const workouts = rows.workouts
    .filter((workout) => workout.status === "completed")
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
  const history = [];
  for (const workout of workouts) {
    const sets = rows.sets.filter((set) => set.workoutId === workout.id && set.exerciseId === exercise.id);
    const perf = performanceFrom(workout, sets, rows.feedback, exercise);
    if (perf) history.push(perf);
  }
  return history;
}

export function suggestionsForProgramme(exercisesById, days, plans, rows) {
  const entries = [];
  for (const day of days) {
    const dayPlans = plans
      .filter((plan) => plan.trainingDayId === day.id && !plan.laterOption)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    for (const plan of dayPlans) {
      const exercise = exercisesById[plan.exerciseId];
      if (!exercise) continue;
      const history = historyForExercise(exercise, rows).filter((perf) => !perf.sample || rows.showSample);
      const last = history[0] || null;
      entries.push({
        id: plan.id,
        name: exercise.name,
        sortOrder: day.sortOrder * 100 + plan.sortOrder,
        suggestion: nextExerciseDose({
          exercise,
          plan,
          last,
          jointPain: last?.feedback?.jointPain,
          deload: false,
        }),
        basedOnSample: history.some((perf) => perf.sample),
      });
    }
  }
  return Object.fromEntries(entries.map((entry) => [entry.id, entry]));
}

function weeklySets(rows, exercisesById, today) {
  const start = mondayOf(today);
  const end = addDays(start, 6);
  const counts = new Map();
  for (const set of rows.sets) {
    if (!set.completed) continue;
    const workout = rows.workouts.find((row) => row.id === set.workoutId);
    if (!workout || workout.date < start || workout.date > end) continue;
    const exercise = exercisesById[set.exerciseId];
    if (!exercise) continue;
    counts.set(exercise.muscle, (counts.get(exercise.muscle) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([muscle, sets]) => ({ muscle, sets, color: muscleColor(muscle) }))
    .sort((a, b) => b.sets - a.sets || a.muscle.localeCompare(b.muscle));
}

function mondayOf(iso) {
  const day = weekdayIndex(iso);
  const diff = day === 0 ? 6 : day - 1;
  return addDays(iso, -diff);
}

export function buildView(snapshot, { today, showSample }) {
  const rows = {
    exercises: visibleRows(snapshot.exercises, true),
    mesocycles: visibleRows(snapshot.mesocycles, true),
    trainingDays: visibleRows(snapshot.trainingDays, true),
    plannedExercises: visibleRows(snapshot.plannedExercises, true),
    workouts: visibleRows(snapshot.workouts, showSample),
    sets: visibleRows(snapshot.sets, showSample),
    feedback: visibleRows(snapshot.feedback, showSample),
    safetyChecks: visibleRows(snapshot.safetyChecks, showSample),
    showSample,
  };
  const exercisesById = byId(rows.exercises);
  const template = rows.mesocycles.find((meso) => meso.kind === "template") || null;
  const active = rows.mesocycles.find((meso) => meso.status === "active") || null;
  const pastMesos = rows.mesocycles
    .filter((meso) => meso.kind === "meso" && meso.status !== "active")
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
  const days = rows.trainingDays
    .filter((day) => day.mesoId === active?.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const templateDays = rows.trainingDays
    .filter((day) => day.mesoId === template?.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const plannedByDay = {};
  for (const day of [...days, ...templateDays]) {
    plannedByDay[day.id] = rows.plannedExercises
      .filter((plan) => plan.trainingDayId === day.id)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  const suggestionEntries = active
    ? suggestionsForProgramme(exercisesById, days, rows.plannedExercises, rows)
    : {};

  const blockWeek = active?.startedOn ? Math.max(1, weekIndex(active.startedOn, today)) : 1;
  const shownWeek = Math.min(blockWeek, active?.weeks || blockWeek);
  const weekTarget = active ? rirForWeek(shownWeek, active.weeks, active.includesDeload) : { rir: 3, deload: false };
  const blockFinished = Boolean(active && blockWeek > active.weeks);
  const grid = buildGrid({ active, days, workouts: rows.workouts, today, blockWeek });
  const completed = rows.workouts.filter(
    (workout) => workout.mesoId === active?.id && workout.status === "completed" && workout.date >= (active?.startedOn || workout.date),
  );
  const total = active ? active.weeks * days.length : 0;
  const todayWorkout = rows.workouts.find((workout) => workout.date === today && workout.mesoId === active?.id && workout.status === "completed");

  const recentSessions = [...rows.workouts]
    .filter((workout) => workout.status === "completed")
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12)
    .map((workout) => {
      const day = rows.trainingDays.find((item) => item.id === workout.trainingDayId);
      const setCount = rows.sets.filter((set) => set.workoutId === workout.id && set.completed).length;
      return {
        id: workout.id,
        date: workout.date,
        label: formatShortDate(workout.date),
        title: day ? `${day.label} · ${day.name}` : "Session",
        sets: setCount,
        sample: Boolean(workout.sample),
      };
    });

  return {
    today,
    showSample,
    exercises: rows.exercises,
    exercisesById,
    template,
    active,
    pastMesos,
    days,
    templateDays,
    plannedByDay,
    suggestions: suggestionEntries,
    workouts: rows.workouts,
    sets: rows.sets,
    feedback: rows.feedback,
    blockWeek: shownWeek,
    blockWeekRaw: blockWeek,
    weekTarget,
    blockFinished,
    grid,
    stats: {
      completed: completed.length,
      total,
      percent: total ? Math.round((completed.length / total) * 100) : 0,
    },
    weeklySets: weeklySets(rows, exercisesById, today),
    recentSessions,
    finishedToday: Boolean(todayWorkout),
  };
}

function buildGrid({ active, days, workouts, today, blockWeek }) {
  if (!active) return [];
  const weeks = [];
  for (let index = 1; index <= active.weeks; index += 1) {
    weeks.push({
      index,
      label: active.includesDeload && index === active.weeks ? "Deload" : `Wk ${index}`,
      deload: Boolean(active.includesDeload && index === active.weeks),
      cells: days.map((day) => {
        const match = workouts.find(
          (workout) =>
            workout.mesoId === active.id &&
            workout.trainingDayId === day.id &&
            workout.weekIndex === index &&
            workout.status === "completed" &&
            workout.date >= active.startedOn,
        );
        const isToday = day.weekday === weekdayIndex(today) && index === Math.min(blockWeek, active.weeks);
        let state = "upcoming";
        if (match) state = "done";
        else if (isToday) state = "current";
        else if (index < blockWeek) state = "missed";
        return { dayId: day.id, label: day.label, state };
      }),
    });
  }
  return weeks;
}

export function selectSession(days, today) {
  if (!days.length) return { day: null, relation: "rest" };
  const weekday = weekdayIndex(today);
  const exact = days.find((day) => day.weekday === weekday);
  if (exact) return { day: exact, relation: "today" };
  if (weekday === 6) {
    const next = days.find((day) => day.weekday === 1) || days[0];
    return { day: next, relation: "run-day" };
  }
  const later = days.find((day) => day.weekday > weekday);
  return { day: later || days[0], relation: "rest" };
}

export function sessionHeadline(selection, blockWeek) {
  if (!selection.day) return { eyebrow: "Gym", title: "No plan yet", dateNote: "" };
  const day = selection.day;
  const title = `Week ${blockWeek} · Day ${day.label} — ${day.name}`;
  if (selection.relation === "run-day") {
    return {
      eyebrow: `${day.focus}`,
      title: "Saturday — long run",
      dateNote: `No gym session today. Next up is ${day.label} · ${day.name} on ${weekdayName(day.weekday)}. Loads do not step up because the week turned over.`,
    };
  }
  if (selection.relation === "rest") {
    return {
      eyebrow: day.focus,
      title: "Off day",
      dateNote: `Next session is ${day.label} · ${day.name} on ${weekdayName(day.weekday)} at ${day.timeLabel}.`,
    };
  }
  return { eyebrow: day.focus, title, dateNote: "" };
}

export function buildExerciseProgress(view, exerciseId, range) {
  const exercise = view.exercisesById[exerciseId];
  if (!exercise) return null;
  const history = historyForExercise(exercise, {
    workouts: view.workouts,
    sets: view.sets,
    feedback: view.feedback,
  });
  const start = range === "all" ? "0000-01-01" : addDays(view.today, range === "6w" ? -42 : -92);
  const inRange = history.filter((perf) => perf.date >= start && perf.date <= view.today).reverse();
  const points = inRange.map((perf) => {
    const dose = doseOf(perf, exercise.unit);
    const load = typeof perf.loadKg === "number" ? perf.loadKg : 0;
    return {
      date: perf.date,
      label: formatShortDate(perf.date),
      dose,
      loadKg: load > 0 ? load : null,
      e1rm: epleyE1rm(load, perf.reps || dose),
      rir: perf.rir,
      variation: perf.variation,
    };
  });
  const loaded = points.filter((point) => point.e1rm != null);
  const useE1rm = loaded.length > 0;
  const series = (useE1rm ? loaded : points).map((point) => ({
    ...point,
    value: useE1rm ? point.e1rm : point.dose,
  }));
  const first = series[0]?.value;
  const last = series[series.length - 1]?.value;
  const delta = useE1rm && first && last && series.length > 1 ? Math.round(((last - first) / first) * 100) : null;
  const latest = series[series.length - 1];
  const recentFeedback = history.slice(0, 6).reverse().map((perf) => perf.feedback).filter(Boolean);
  return {
    exercise,
    points: series,
    useE1rm,
    latest,
    delta,
    sessions: [...points].reverse(),
    feedback: recentFeedback.map((row) => ({
      ...row,
      jointPain: normalizeJointPain(row.jointPain),
    })),
  };
}

export function doseSummary(plan, exercise) {
  const sets = plan.setsMin === plan.setsMax ? `${plan.setsMin}` : `${plan.setsMin}–${plan.setsMax}`;
  const reps = plan.repsMin === plan.repsMax ? `${plan.repsMin}` : `${plan.repsMin}–${plan.repsMax}`;
  const unit = exercise?.unit === "seconds" ? "s" : exercise?.unit === "steps" ? " steps" : "";
  const side = exercise?.sideNote ? ` ${exercise.sideNote}` : "";
  return `${sets} × ${reps}${unit}${side}`;
}

export function unitLabel(unit) {
  if (unit === "seconds") return "Sec";
  if (unit === "steps") return "Steps";
  return "Reps";
}

export function setsThisWeek(plan, weekTarget) {
  if (!weekTarget?.deload) return { min: plan.setsMin, max: plan.setsMax };
  const min = Math.max(1, Math.floor(plan.setsMin / 2));
  const max = Math.max(min, Math.floor(plan.setsMax / 2));
  return { min, max };
}
