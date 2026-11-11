/**
 * Session-to-session targets.
 * Soreness, workload, and pump move a muscle's set count by at most one.
 * Joint pain holds or reduces load and flags a swap.
 * Load still moves one small step at a time, and only after the rep range is full.
 * Week number changes the target RIR. It does not add weight by itself.
 */

export const EPLEY_CAPTION = "Epley estimate · Not a tested max";
export const MIN_SETS = 1;
export const MAX_SETS = 5;

export function epleyE1rm(loadKg, reps) {
  if (typeof loadKg !== "number" || typeof reps !== "number") return null;
  if (!Number.isFinite(loadKg) || !Number.isFinite(reps)) return null;
  if (!(loadKg > 0) || !(reps > 0)) return null;
  const raw = reps === 1 ? loadKg : loadKg * (1 + reps / 30);
  return Math.round(raw * 10) / 10;
}

export function doseOf(perf, unit) {
  if (!perf) return 0;
  if (unit === "seconds") return perf.seconds ?? perf.reps ?? 0;
  if (unit === "steps") return perf.steps ?? perf.reps ?? 0;
  return perf.reps ?? 0;
}

/** Old joint-pain values stay in the database. The UI speaks the current three. */
export function normalizeJointPain(value) {
  if (value === "low" || value === "moderate" || value === "some") return "some";
  if (value === "a_lot") return "a_lot";
  if (value === "none") return "none";
  return null;
}

export function rirForWeek(weekIndex, totalWeeks, includesDeload = true) {
  const weeks = Math.max(1, Number(totalWeeks) || 1);
  const week = Math.min(Math.max(1, Number(weekIndex) || 1), weeks);
  if (includesDeload && weeks > 1 && week === weeks) return { week, rir: 3, deload: true };
  const accumulation = includesDeload && weeks > 1 ? weeks - 1 : weeks;
  const fromEnd = accumulation - week;
  return { week, rir: Math.max(0, Math.min(3, fromEnd)), deload: false };
}

export function rirSchedule(totalWeeks, includesDeload = true) {
  const weeks = Math.max(1, Number(totalWeeks) || 1);
  return Array.from({ length: weeks }, (_, index) => rirForWeek(index + 1, weeks, includesDeload));
}

/**
 * Next week's set change for one muscle.
 * Recovered early + easy/pretty good adds a set, unless the pump was already amazing.
 * Just on time, or pushed limits, holds. Still sore, or too much, takes one set away.
 */
export function setChangeFromFeedback({ soreness, workload, pump } = {}) {
  if (soreness === "still_sore" || workload === "too_much") {
    return { delta: -1, reason: soreness === "still_sore" ? "still_sore" : "too_much" };
  }
  if (soreness === "just_in_time" || workload === "pushed_limits") {
    return { delta: 0, reason: soreness === "just_in_time" ? "just_in_time" : "pushed_limits" };
  }
  const recovered = soreness === "never" || soreness === "healed_early";
  const manageable = workload === "easy" || workload === "pretty_good";
  if (recovered && manageable) {
    if (pump === "amazing") return { delta: 0, reason: "pump_high" };
    return { delta: 1, reason: "recovered_early" };
  }
  return { delta: 0, reason: "incomplete" };
}

export function clampSets(sets) {
  const value = Math.round(Number(sets));
  if (!Number.isFinite(value)) return MIN_SETS;
  return Math.min(MAX_SETS, Math.max(MIN_SETS, value));
}

function stepDown(exercise, plan, last) {
  const variation = last?.variation || plan.variation || exercise?.defaultVariation || "standard";
  const ladder = exercise?.variationLadder || [];
  const rank = Math.max(0, ladder.findIndex((item) => item.id === variation));
  if (ladder.length && rank > 0) {
    return {
      variation: ladder[rank - 1].id,
      loadKg: null,
      loadLabel: "bodyweight",
      targetDose: plan.repsMin,
    };
  }
  if (exercise?.regression && variation !== exercise.regression.variation) {
    return {
      variation: exercise.regression.variation,
      loadKg: null,
      loadLabel: plan.loadLabel === "medium" || plan.loadLabel === "heavy" ? "light" : plan.loadLabel || "bodyweight",
      targetDose: plan.repsMin,
    };
  }
  const kg = typeof last?.loadKg === "number" ? last.loadKg : plan.loadKg;
  if (kg > 0) {
    const nextKg = Math.max(0, Math.round((kg - (exercise?.loadStepKg || 1)) * 10) / 10);
    return {
      variation,
      loadKg: nextKg > 0 ? nextKg : null,
      loadLabel: nextKg > 0 ? "dumbbell" : "bodyweight",
      targetDose: plan.repsMin,
    };
  }
  return {
    variation,
    loadKg: plan.loadKg ?? null,
    loadLabel: plan.loadLabel || "bodyweight",
    targetDose: plan.repsMin,
  };
}

function stepUp(exercise, plan, last) {
  const unit = exercise?.unit || "reps";
  const step = exercise?.doseStep || 1;
  const achieved = last ? doseOf(last, unit) : plan.targetDose ?? plan.repsMin;
  const variation = last?.variation || plan.variation || exercise?.defaultVariation || "standard";
  const ladder = exercise?.variationLadder || [];
  const rank = Math.max(0, ladder.findIndex((item) => item.id === variation));
  if (achieved < plan.repsMax) {
    return {
      action: "add_reps",
      reason: "reps_first",
      flagSwap: false,
      text: "Add a little to the dose. Same load.",
      next: {
        targetDose: Math.min(plan.repsMax, achieved + step),
        variation,
        loadKg: last?.loadKg ?? plan.loadKg ?? null,
        loadLabel: last?.loadLabel || plan.loadLabel || "bodyweight",
      },
    };
  }
  if (exercise?.progression === "reps_then_leverage" && ladder.length) {
    if (rank < ladder.length - 1) {
      return {
        action: "add_variation",
        reason: "harder_variation",
        flagSwap: false,
        text: `Dose is full. Next time try ${ladder[rank + 1].label}, back at the low end.`,
        next: {
          targetDose: plan.repsMin,
          variation: ladder[rank + 1].id,
          loadKg: null,
          loadLabel: "bodyweight",
        },
      };
    }
    return {
      action: "hold",
      reason: "ceiling",
      flagSwap: false,
      text: "This is the top of the variations in the plan.",
      next: { targetDose: plan.repsMax, variation, loadKg: null, loadLabel: "bodyweight" },
    };
  }
  if (exercise?.equipment === "band") {
    const bands = ["light", "medium", "heavy"];
    const label = last?.loadLabel || plan.loadLabel || "light";
    const index = Math.max(0, bands.indexOf(label));
    if (index < bands.length - 1) {
      return {
        action: "add_load",
        reason: "smallest_load",
        flagSwap: false,
        text: `Reps are full. Step the band to ${bands[index + 1]} and start the reps again.`,
        next: { targetDose: plan.repsMin, variation, loadKg: null, loadLabel: bands[index + 1] },
      };
    }
    return {
      action: "hold",
      reason: "ceiling",
      flagSwap: false,
      text: "The band is already as heavy as this plan goes.",
      next: { targetDose: plan.repsMax, variation, loadKg: null, loadLabel: label },
    };
  }
  const currentKg = typeof last?.loadKg === "number" && last.loadKg > 0 ? last.loadKg : 0;
  const increment = Math.min(1, exercise?.loadStepKg || 1);
  const nextKg = Math.round((currentKg + increment) * 10) / 10;
  return {
    action: "add_load",
    reason: "smallest_load",
    flagSwap: false,
    text: `Reps are full. Add ${increment} kg and start the reps again.`,
    next: { targetDose: plan.repsMin, variation, loadKg: nextKg, loadLabel: "dumbbell" },
  };
}

export function nextExerciseDose({ exercise, plan, last, jointPain, deload = false }) {
  const pain = normalizeJointPain(jointPain);
  const variation = last?.variation || plan.variation || exercise?.defaultVariation || "standard";
  const held = {
    targetDose: plan.targetDose ?? plan.repsMin,
    variation,
    loadKg: last?.loadKg ?? plan.loadKg ?? null,
    loadLabel: last?.loadLabel || plan.loadLabel || "bodyweight",
  };
  if (deload) {
    return {
      action: "deload",
      reason: "deload",
      flagSwap: false,
      text: "Deload week. Fewer sets, same load, reps in reserve.",
      next: { ...held, targetDose: plan.repsMin },
    };
  }
  if (pain === "a_lot") {
    return {
      action: "reduce_load",
      reason: "joint_pain",
      flagSwap: true,
      text: "Joints hurt a lot. Use an easier version next time, or swap the exercise.",
      next: stepDown(exercise, plan, last),
    };
  }
  if (pain === "some") {
    return {
      action: "hold_load",
      reason: "joint_pain",
      flagSwap: true,
      text: "Some joint pain. Hold the load, and swap the exercise if you want a different one.",
      next: held,
    };
  }
  if (!last) {
    return { action: "hold", reason: "no_history", flagSwap: false, text: "", next: held };
  }
  return stepUp(exercise, plan, last);
}

export function plansAfterFeedback(plans, exercisesById, input) {
  const change = setChangeFromFeedback(input);
  const templateSets = input.templateSets || {};
  const previousDelta = Number.isFinite(input.appliedDelta) ? input.appliedDelta : 0;
  const performances = input.performances || {};
  const nextPlans = plans.map((plan, index) => {
    const exercise = exercisesById[plan.exerciseId];
    const dose = nextExerciseDose({
      exercise,
      plan,
      last: performances[plan.exerciseId] || null,
      jointPain: input.jointPain,
      deload: Boolean(input.deload),
    });
    let setsMin = plan.setsMin;
    let setsMax = plan.setsMax;
    if (!input.deload && index === 0 && change.reason !== "incomplete") {
      const anchor = templateSets[plan.exerciseId] ?? plan.setsMin - previousDelta;
      setsMin = clampSets(anchor + change.delta);
      const maxAnchor = (templateSets[`${plan.exerciseId}:max`] ?? plan.setsMax) - (templateSets[plan.exerciseId] != null ? 0 : previousDelta);
      setsMax = Math.max(setsMin, clampSets(maxAnchor + change.delta));
    }
    return {
      ...plan,
      ...dose.next,
      setsMin,
      setsMax,
      recommendation: dose,
    };
  });
  return { plans: nextPlans, appliedDelta: change.reason === "incomplete" ? previousDelta : change.delta, change };
}
