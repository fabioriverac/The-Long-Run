import { addDays } from "../lib/dates.js";

function safety(workoutId, overrides = {}) {
  return {
    id: `${workoutId}:session`,
    workoutId,
    kind: "session",
    painLocation: "",
    painDuring: 0,
    painQuality: "none",
    firstStepVsBaseline: null,
    swelling: "none",
    gaitChange: "none",
    lossOfControl: false,
    focalBonePain: false,
    notes: "",
    sample: true,
    deletedAt: null,
    serverReceivedAt: null,
    ...overrides,
  };
}

function morning(workoutId, overrides = {}) {
  return {
    id: `${workoutId}:next_morning`,
    workoutId,
    kind: "next_morning",
    painLocation: "",
    painDuring: null,
    painQuality: "none",
    firstStepVsBaseline: "same",
    swelling: "none",
    gaitChange: "none",
    lossOfControl: false,
    focalBonePain: false,
    notes: "",
    sample: true,
    deletedAt: null,
    serverReceivedAt: null,
    ...overrides,
  };
}

function feedback(workoutId, exerciseId, muscle, jointPain = "none") {
  return {
    id: `${workoutId}:${muscle}`,
    workoutId,
    exerciseId,
    muscle,
    appliedDelta: 0,
    jointPain,
    soreness: "just_in_time",
    pump: "moderate",
    workload: "pretty_good",
    sample: true,
    deletedAt: null,
    serverReceivedAt: null,
  };
}

/**
 * Illustrated history so the progress screens have a shape before Fabio's own log does.
 * Tagged sample: true and never queued for cloud sync. Doses stay inside Coach's rules.
 */
export function buildSampleHistory(today) {
  const workouts = [];
  const sets = [];
  const feedbackRows = [];
  const safetyChecks = [];

  const pushups = [6, 8, 9, 11];
  pushups.forEach((reps, index) => {
    const date = addDays(today, -7 * (pushups.length - index));
    const workoutId = `sample-w-push-${index + 1}`;
    const stamp = `${date}T15:10:00.000Z`;
    workouts.push({
      id: workoutId,
      mesoId: "meso-current",
      trainingDayId: "meso-day-c",
      weekIndex: -1 * (pushups.length - index),
      date,
      startedAt: stamp,
      finishedAt: stamp,
      status: "completed",
      notes: "",
      sample: true,
      createdAt: stamp,
      updatedAt: stamp,
      deletedAt: null,
      serverReceivedAt: null,
    });
    sets.push({
      id: `${workoutId}:set`,
      workoutId,
      plannedExerciseId: "meso-plan-c-ex-pushup",
      exerciseId: "ex-pushup",
      setNumber: 1,
      loadKg: null,
      loadLabel: "bodyweight",
      reps,
      seconds: null,
      steps: null,
      rir: 3,
      variation: "incline",
      completed: true,
      sample: true,
      createdAt: stamp,
      updatedAt: stamp,
      deletedAt: null,
      serverReceivedAt: null,
    });
    feedbackRows.push(feedback(workoutId, "ex-pushup", "Chest", index === 0 ? "low" : "none"));
    safetyChecks.push(safety(workoutId, { createdAt: stamp, updatedAt: stamp }));
    safetyChecks.push(morning(workoutId, { createdAt: stamp, updatedAt: stamp, firstStepVsBaseline: index === 3 ? "better" : "same" }));
    feedbackRows[feedbackRows.length - 1].createdAt = stamp;
    feedbackRows[feedbackRows.length - 1].updatedAt = stamp;
  });

  [8, 8].forEach((reps, index) => {
    const date = addDays(today, -14 + index * 7);
    const workoutId = `sample-w-calf-${index + 1}`;
    const stamp = `${date}T18:40:00.000Z`;
    workouts.push({
      id: workoutId,
      mesoId: "meso-current",
      trainingDayId: "meso-day-a",
      weekIndex: -2 + index,
      date,
      startedAt: stamp,
      finishedAt: stamp,
      status: "completed",
      notes: "",
      sample: true,
      createdAt: stamp,
      updatedAt: stamp,
      deletedAt: null,
      serverReceivedAt: null,
    });
    sets.push({
      id: `${workoutId}:set`,
      workoutId,
      plannedExerciseId: "meso-plan-a-ex-sl-calf",
      exerciseId: "ex-sl-calf",
      setNumber: 1,
      loadKg: null,
      loadLabel: "bodyweight",
      reps,
      seconds: null,
      steps: null,
      rir: 3,
      variation: "single-leg",
      completed: true,
      sample: true,
      createdAt: stamp,
      updatedAt: stamp,
      deletedAt: null,
      serverReceivedAt: null,
    });
    feedbackRows.push({
      ...feedback(workoutId, "ex-sl-calf", "Calves"),
      soreness: index === 1 ? "" : "just_in_time",
      createdAt: stamp,
      updatedAt: stamp,
    });
    safetyChecks.push(safety(workoutId, { createdAt: stamp, updatedAt: stamp }));
    safetyChecks.push(morning(workoutId, { createdAt: stamp, updatedAt: stamp }));
  });

  return { workouts, sets, feedback: feedbackRows, safetyChecks };
}
