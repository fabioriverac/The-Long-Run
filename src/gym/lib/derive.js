import { addDays, formatLongDate, formatShortDate, weekdayIndex, weekdayName, weekIndex } from "./dates.js";
import { coordinateSuggestions, doseOf, epleyE1rm, shouldShowSuggestion, suggestProgression } from "./progression.js";

const MUSCLE_COLORS = ["#ff6b8a", "#5eb0ff", "#f0a05a", "#67c587", "#c9a0ff", "#f2d06b", "#8fd0d8"];

export function visibleRows(rows, showSample) {
  return (rows || []).filter((row) => row && !row.deletedAt && (showSample || !row.sample));
}

function byId(rows) {
  return Object.fromEntries(rows.map((row) => [row.id, row]));
}

function performanceFrom(workout, sets, safety, feedback, exercise) {
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
    safety: safety.find((row) => row.workoutId === workout.id && row.kind === "session") || null,
    morning: safety.find((row) => row.workoutId === workout.id && row.kind === "next_morning") || null,
    feedback: feedback.find((row) => row.workoutId === workout.id && row.exerciseId === exercise.id) || null,
  };
}

export function historyForExercise(exercise, rows) {
  const workouts = rows.workouts
    .filter((workout) => workout.status === "completed")
    .sort((a, b) => b.date.localeCompare(a.date) || b.updatedAt.localeCompare(a.updatedAt));
  const history = [];
  for (const workout of workouts) {
    const sets = rows.sets.filter((set) => set.workoutId === workout.id && set.exerciseId === exercise.id);
    const perf = performanceFrom(workout, sets, rows.safetyChecks, rows.feedback, exercise);
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
      entries.push({
        id: plan.id,
        name: exercise.name,
        sortOrder: day.sortOrder * 100 + plan.sortOrder,
        suggestion: suggestProgression({ exercise, plan, history }),
        basedOnSample: history.some((perf) => perf.sample),
      });
    }
  }
  return Object.fromEntries(coordinateSuggestions(entries).map((entry) => [entry.id, entry]));
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
    .map(([muscle, sets], index) => ({ muscle, sets, color: MUSCLE_COLORS[index % MUSCLE_COLORS.length] }))
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
  const blockFinished = Boolean(active && blockWeek > active.weeks);
  const grid = buildGrid({ active, days, workouts: rows.workouts, today, blockWeek });
  const completed = rows.workouts.filter(
    (workout) => workout.mesoId === active?.id && workout.status === "completed" && workout.date >= (active?.startedOn || workout.date),
  );
  const total = active ? active.weeks * days.length : 0;
  const todayWorkout = rows.workouts.find((workout) => workout.date === today && workout.mesoId === active?.id && workout.status === "completed");
  const pending = rows.workouts
    .filter((workout) => {
      if (workout.status !== "completed" || workout.date >= today) return false;
      const morning = rows.safetyChecks.find((row) => row.workoutId === workout.id && row.kind === "next_morning");
      return !morning;
    })
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  const pendingDay = pending ? days.find((day) => day.id === pending.trainingDayId) || templateDays.find((day) => day.id === pending.trainingDayId) : null;

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
    safetyChecks: rows.safetyChecks,
    blockWeek: Math.min(blockWeek, active?.weeks || blockWeek),
    blockWeekRaw: blockWeek,
    blockFinished,
    grid,
    stats: {
      completed: completed.length,
      total,
      percent: total ? Math.round((completed.length / total) * 100) : 0,
    },
    weeklySets: weeklySets(rows, exercisesById, today),
    recentSessions,
    painTrend: trendChips(rows.safetyChecks, "session", today),
    morningTrend: trendChips(rows.safetyChecks, "next_morning", today),
    pendingMorning: pending
      ? { workout: pending, dayName: pendingDay ? `${pendingDay.label} · ${pendingDay.name}` : "Session", label: formatLongDate(pending.date) }
      : null,
    finishedToday: Boolean(todayWorkout),
  };
}

function trendChips(checks, kind, today) {
  return checks
    .filter((row) => row.kind === kind)
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))
    .slice(0, 8)
    .reverse()
    .map((row) => ({
      id: row.id,
      label:
        kind === "next_morning"
          ? morningLabel(row.firstStepVsBaseline)
          : painLabel(row),
      tone: toneFor(kind === "next_morning" ? row.firstStepVsBaseline : row.painQuality || row.swelling),
      date: today,
    }));
}

function painLabel(row) {
  if (row.focalBonePain) return "Bone pain";
  if (row.swelling === "significant") return "Swelling";
  if (row.gaitChange === "cannot_bear_weight") return "No weight";
  if (row.gaitChange === "limping") return "Limping";
  if (row.painQuality === "sharp" || row.painQuality === "increasing") return "Sharp";
  if (row.painLocation && row.painLocation !== "None") return row.painLocation.replace("Left ", "");
  if ((row.painDuring || 0) > 0) return String(row.painDuring);
  return "None";
}

function morningLabel(value) {
  if (value === "better") return "Better";
  if (value === "worse") return "Worse";
  if (value === "much_worse") return "Much worse";
  return "Same";
}

function toneFor(value) {
  if (value === "better" || value === "none" || value === "None") return "good";
  if (value === "same" || value === "dull") return "ok";
  return "bad";
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
    safetyChecks: view.safetyChecks,
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
  const feedback = history.slice(0, 6).reverse().map((perf) => perf.feedback?.jointPain || "none");
  const recentPain = feedback.slice(-3);
  return {
    exercise,
    points: series,
    useE1rm,
    latest,
    delta,
    sessions: [...points].reverse(),
    jointPain: feedback,
    quietPain: recentPain.length >= 3 && recentPain.every((value) => value === "none"),
    mornings: history.slice(0, 6).reverse().map((perf) => perf.morning?.firstStepVsBaseline || "missing"),
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

export { shouldShowSuggestion };
