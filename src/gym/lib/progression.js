/**
 * Dose decisions for Coach's plan.
 * Reps (or time, or steps) move first, then the smallest load, one exercise at a time.
 * A later calendar week never escalates anything. Pain at or under 3/10 is not clearance.
 * Nothing here prescribes a max test or a set to failure.
 */

export const MIN_CLEAR_SESSIONS = 2;

export const CLINICIAN_NOTE =
  "Focal bone pain, not being able to bear weight, or swelling that stands out is a reason to pause and check with a clinician before you load this again.";

export const PHYSIO_NOTE =
  "Heel or inner-ankle symptoms that keep showing up are worth a physio visit, even when a session felt manageable.";

export const PAIN_NOT_CLEARANCE_NOTE =
  "A pain score of 3/10 or lower is not, by itself, a reason to add reps or load.";

export const EPLEY_CAPTION = "Epley estimate · Not a tested max";

const HEEL_PATTERN = /heel|inner ankle|inner-ankle|plantar|posterior tib|arch/i;
const GAIT_BAD = new Set(["slight", "limping", "cannot_bear_weight"]);
const PROGRESS_ACTIONS = new Set(["add_reps", "add_load", "add_variation"]);

export function epleyE1rm(loadKg, reps) {
  if (typeof loadKg !== "number" || typeof reps !== "number") return null;
  if (!Number.isFinite(loadKg) || !Number.isFinite(reps)) return null;
  if (!(loadKg > 0) || !(reps > 0)) return null;
  const raw = reps === 1 ? loadKg : loadKg * (1 + reps / 30);
  return Math.round(raw * 10) / 10;
}

export function isRedFlag(safety) {
  if (!safety) return false;
  return Boolean(
    safety.focalBonePain ||
      safety.swelling === "significant" ||
      safety.gaitChange === "cannot_bear_weight",
  );
}

export function persistentHeelOrAnkle(history) {
  let hits = 0;
  for (const perf of (history || []).slice(0, 4)) {
    const loc = `${perf.safety?.painLocation || ""} ${perf.morning?.painLocation || ""}`;
    if (HEEL_PATTERN.test(loc)) hits += 1;
  }
  return hits >= 2;
}

export function doseOf(perf, unit) {
  if (!perf) return 0;
  if (unit === "seconds") return perf.seconds ?? perf.reps ?? 0;
  if (unit === "steps") return perf.steps ?? perf.reps ?? 0;
  return perf.reps ?? 0;
}

export function evaluateSession(perf, plan) {
  const safety = perf?.safety || null;
  const morning = perf?.morning ?? null;
  const feedback = perf?.feedback ?? null;
  const reasons = [];
  const redFlag = isRedFlag(safety) || isRedFlag(morning);

  if (!safety) reasons.push("safety_missing");
  if (redFlag) reasons.push("red_flag");
  if (safety?.painQuality === "sharp" || safety?.painQuality === "increasing") reasons.push("pain_quality");
  if (safety?.lossOfControl) reasons.push("loss_of_control");
  if (safety && GAIT_BAD.has(safety.gaitChange)) reasons.push("gait");
  if (safety?.swelling === "mild") reasons.push("swelling_mild");
  if (typeof safety?.painDuring === "number" && safety.painDuring >= 4) reasons.push("pain_high");
  if (feedback?.jointPain === "a_lot" || feedback?.jointPain === "moderate") reasons.push("joint_pain");
  if (feedback?.soreness === "still_sore") reasons.push("still_sore");
  if (feedback?.workload === "too_much") reasons.push("workload");

  const targetRir = plan?.targetRir ?? 3;
  const rir = perf?.rir;
  if (rir === 0) reasons.push("failure");
  else if (typeof rir === "number" && rir < targetRir) reasons.push("rir_low");
  else if (rir == null) reasons.push("rir_missing");

  let morningPending = false;
  let morningWorse = false;
  if (!morning) {
    morningPending = true;
    reasons.push("morning_pending");
  } else {
    if (morning.firstStepVsBaseline === "worse" || morning.firstStepVsBaseline === "much_worse") {
      morningWorse = true;
      reasons.push("morning_worse");
    }
    if (morning.swelling === "mild" || morning.swelling === "significant") reasons.push("morning_swelling");
    if (GAIT_BAD.has(morning.gaitChange)) reasons.push("morning_gait");
  }

  const regress =
    redFlag ||
    reasons.includes("pain_quality") ||
    reasons.includes("loss_of_control") ||
    reasons.includes("gait") ||
    reasons.includes("pain_high") ||
    feedback?.jointPain === "a_lot" ||
    morningWorse;

  const blocked = [
    "safety_missing",
    "red_flag",
    "pain_quality",
    "loss_of_control",
    "gait",
    "swelling_mild",
    "pain_high",
    "joint_pain",
    "still_sore",
    "workload",
    "failure",
    "rir_low",
    "rir_missing",
    "morning_pending",
    "morning_worse",
    "morning_swelling",
    "morning_gait",
  ];
  const clear = blocked.every((reason) => !reasons.includes(reason));

  return { clear, regress, redFlag, morningPending, morningWorse, reasons };
}

function holdText(evaluation, plan) {
  const rir = plan?.targetRir ?? 3;
  if (evaluation.reasons.includes("failure")) {
    return `That set went to failure. Keep about ${rir} reps in reserve — this plan does not work to failure.`;
  }
  if (evaluation.reasons.includes("rir_low")) {
    return `Closer to failure than the plan. Hold the dose and leave about ${rir} reps in reserve.`;
  }
  if (evaluation.reasons.includes("rir_missing")) {
    return `Add an RIR before this can change. The plan stays about ${rir} reps from failure.`;
  }
  if (evaluation.reasons.includes("swelling_mild")) return "Mild swelling is a reason to hold, not to add anything.";
  if (evaluation.reasons.includes("still_sore")) return "Still sore from last time. Hold the dose.";
  if (evaluation.reasons.includes("workload")) return "That session felt like too much. Hold the dose.";
  if (evaluation.reasons.includes("joint_pain")) {
    return "Joint pain above low holds the dose. Low pain is not a green light on its own.";
  }
  if (evaluation.reasons.includes("safety_missing")) return "Add the session safety check before changing the dose.";
  if (evaluation.reasons.includes("morning_pending")) {
    return "Wait for the next morning's first steps before adding anything.";
  }
  return "Hold the dose until a session is clearly well tolerated.";
}

function dosePatch(plan, last, patch) {
  return {
    targetDose: patch.dose,
    variation: patch.variation ?? last.variation ?? plan.variation ?? "standard",
    loadKg: patch.loadKg === undefined ? (last.loadKg ?? plan.loadKg ?? null) : patch.loadKg,
    loadLabel: patch.loadLabel ?? last.loadLabel ?? plan.loadLabel ?? "bodyweight",
  };
}

function advanceDose(exercise, plan, last) {
  const step = exercise.doseStep || 1;
  const current = doseOf(last, exercise.unit);
  const max = plan.repsMax;
  const min = plan.repsMin;
  const ladder = exercise.variationLadder || [];
  const variation = last.variation || plan.variation || ladder[0]?.id || exercise.defaultVariation || "standard";
  const rank = Math.max(0, ladder.findIndex((item) => item.id === variation));
  const unitWord = exercise.unit === "seconds" ? `${step} seconds` : exercise.unit === "steps" ? `${step} step` : "a rep";

  const onRegression =
    exercise.regression &&
    variation === exercise.regression.variation &&
    plan.variation &&
    variation !== plan.variation;

  if (current < max) {
    const nextDose = Math.min(max, current + step);
    return {
      action: "add_reps",
      reason: "reps_first",
      text: `Add ${unitWord} (${current} → ${nextDose}) and keep about ${plan.targetRir} RIR.`,
      next: dosePatch(plan, last, { dose: nextDose, variation }),
    };
  }

  if (onRegression) {
    return {
      action: "add_variation",
      reason: "return_from_regression",
      text: `${exercise.regression.label} is at the top of the range. You can try the main version again at ${min}, still leaving about ${plan.targetRir} RIR.`,
      next: dosePatch(plan, last, {
        dose: min,
        variation: plan.variation,
        loadKg: plan.loadKg ?? null,
        loadLabel: plan.loadLabel || "bodyweight",
      }),
    };
  }

  if (ladder.length && rank < ladder.length - 1) {
    const nextVar = ladder[rank + 1];
    return {
      action: "add_variation",
      reason: "harder_variation",
      text: `The dose is at the top of the range. Try ${nextVar.label} and start back at ${min}, with about ${plan.targetRir} RIR.`,
      next: dosePatch(plan, last, { dose: min, variation: nextVar.id, loadKg: null, loadLabel: "bodyweight" }),
    };
  }

  if (exercise.progression === "reps_then_leverage") {
    const ceiling =
      exercise.id === "ex-pushup"
        ? "At the top of the push-up variations in this plan. Upper body beyond push-ups isn't part of the programme yet — add your own exercise when you and Coach agree."
        : "At the top of the variations agreed for this exercise. Nothing harder is part of the plan yet.";
    return { action: "hold", reason: "ceiling", text: ceiling, next: null };
  }

  if (exercise.equipment === "band") {
    const bands = ["light", "medium", "heavy"];
    const label = last.loadLabel || plan.loadLabel || "light";
    const index = Math.max(0, bands.indexOf(label));
    if (index < bands.length - 1) {
      const nextLabel = bands[index + 1];
      return {
        action: "add_load",
        reason: "smallest_load",
        text: `Reps are topped out. Step the band to ${nextLabel} and return to ${min}.`,
        next: dosePatch(plan, last, { dose: min, loadLabel: nextLabel, loadKg: null }),
      };
    }
    return {
      action: "hold",
      reason: "ceiling",
      text: "The band is already at the heaviest step in the plan. Hold here.",
      next: null,
    };
  }

  const currentKg = typeof last.loadKg === "number" && last.loadKg > 0 ? last.loadKg : 0;
  const increment = exercise.loadStepKg || 1;
  const nextKg = Math.round((currentKg + increment) * 10) / 10;
  const from = currentKg > 0 ? `${currentKg} kg` : "bodyweight";
  return {
    action: "add_load",
    reason: "smallest_load",
    text: `Reps are at the top of the range. Add the smallest load (${from} → ${nextKg} kg) and return to ${min} reps. Keep about ${plan.targetRir} RIR.`,
    next: dosePatch(plan, last, { dose: min, loadKg: nextKg, loadLabel: "dumbbell" }),
  };
}

function regressDose(exercise, plan, last) {
  const step = exercise.doseStep || 1;
  const current = doseOf(last, exercise.unit);
  const min = plan.repsMin;
  const ladder = exercise.variationLadder || [];
  const variation = last.variation || plan.variation || exercise.defaultVariation || "standard";
  const rank = Math.max(0, ladder.findIndex((item) => item.id === variation));

  if (current > min) {
    const nextDose = Math.max(min, current - step);
    return {
      text: `Back off to ${nextDose}${exercise.unit === "seconds" ? "s" : ""} and keep the same variation.`,
      next: dosePatch(plan, last, { dose: nextDose, variation }),
    };
  }

  if (ladder.length && rank > 0) {
    const prev = ladder[rank - 1];
    return {
      text: `Use the easier variation (${prev.label}) and start at ${min}.`,
      next: dosePatch(plan, last, { dose: min, variation: prev.id, loadKg: null, loadLabel: "bodyweight" }),
    };
  }

  if (exercise.regression && variation !== exercise.regression.variation) {
    return {
      text: `Switch to the regression: ${exercise.regression.label}.`,
      next: dosePatch(plan, last, {
        dose: min,
        variation: exercise.regression.variation,
        loadKg: null,
        loadLabel: plan.loadLabel === "light" || plan.loadLabel === "medium" || plan.loadLabel === "heavy" ? "light" : "bodyweight",
      }),
    };
  }

  const currentKg = typeof last.loadKg === "number" ? last.loadKg : 0;
  if (currentKg > 0) {
    return {
      text: "Drop the external load and repeat the same reps.",
      next: dosePatch(plan, last, { dose: min, loadKg: null, loadLabel: "bodyweight", variation }),
    };
  }

  return {
    text: "This is already the easiest step in the plan. Skip it today if symptoms are still up.",
    next: dosePatch(plan, last, { dose: min, variation, loadKg: null, loadLabel: last.loadLabel || "bodyweight" }),
  };
}

export function suggestProgression({ exercise, plan, history }) {
  const sessions = history || [];
  const physio = persistentHeelOrAnkle(sessions);
  let streak = 0;
  for (const perf of sessions) {
    if (!evaluateSession(perf, plan).clear) break;
    streak += 1;
  }
  const base = { streak, clinician: false, physio, next: null };

  if (!sessions.length) {
    return { ...base, action: "hold", reason: "no_history", text: "Log this exercise before changing the dose." };
  }

  const evaluation = evaluateSession(sessions[0], plan);
  if (evaluation.redFlag) {
    return {
      ...base,
      action: "stop",
      reason: "red_flag",
      clinician: true,
      text: `Stop this exercise for now. ${CLINICIAN_NOTE}`,
    };
  }
  if (evaluation.regress) {
    const stepped = regressDose(exercise, plan, sessions[0]);
    return {
      ...base,
      action: "regress",
      reason: evaluation.morningWorse ? "morning_worse" : evaluation.reasons.find((reason) => reason !== "morning_pending") || "symptoms",
      text: stepped.text,
      next: stepped.next,
    };
  }
  if (evaluation.reasons.includes("failure")) {
    return { ...base, action: "hold", reason: "failure", text: holdText(evaluation, plan) };
  }
  if (evaluation.morningPending) {
    return { ...base, action: "hold", reason: "morning_pending", text: holdText(evaluation, plan) };
  }
  if (!evaluation.clear) {
    return {
      ...base,
      action: "hold",
      reason: evaluation.reasons[0] || "not_clear",
      text: holdText(evaluation, plan),
    };
  }
  if (streak < MIN_CLEAR_SESSIONS) {
    return {
      ...base,
      action: "hold",
      reason: "need_repeat",
      text: "Hold the dose. It needs to feel this manageable more than once, with calm next mornings, before anything goes up.",
    };
  }

  return { ...base, ...advanceDose(exercise, plan, sessions[0]), streak };
}

export function coordinateSuggestions(entries) {
  const ready = entries.filter((entry) => PROGRESS_ACTIONS.has(entry.suggestion?.action));
  if (ready.length <= 1) return entries;
  const ranked = [...ready].sort((a, b) => {
    const streakDiff = (b.suggestion.streak || 0) - (a.suggestion.streak || 0);
    if (streakDiff !== 0) return streakDiff;
    return a.sortOrder - b.sortOrder;
  });
  const winner = ranked[0];
  return entries.map((entry) => {
    if (entry.id === winner.id || !PROGRESS_ACTIONS.has(entry.suggestion?.action)) return entry;
    return {
      ...entry,
      suggestion: {
        ...entry.suggestion,
        action: "hold",
        reason: "one_at_a_time",
        next: null,
        text: `Hold. ${winner.name} is the one exercise due a step up. Change one thing at a time.`,
      },
    };
  });
}

export function shouldShowSuggestion(suggestion) {
  if (!suggestion) return false;
  if (suggestion.action === "stop" || suggestion.action === "regress" || PROGRESS_ACTIONS.has(suggestion.action)) {
    return true;
  }
  return suggestion.reason === "one_at_a_time" || suggestion.reason === "failure" || suggestion.reason === "ceiling";
}

/** Manual one-step regression from the current plan targets, for the overflow menu. */
export function regressPlan(exercise, plan) {
  const fakeLast = {
    reps: plan.targetDose,
    seconds: exercise.unit === "seconds" ? plan.targetDose : null,
    steps: exercise.unit === "steps" ? plan.targetDose : null,
    loadKg: plan.loadKg,
    loadLabel: plan.loadLabel,
    variation: plan.variation,
  };
  return regressDose(exercise, plan, fakeLast);
}
