import { useEffect, useMemo, useState } from "react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { FeedbackSheet, SafetySheet } from "../components/sheets.jsx";
import { CheckIcon } from "../components/ui.jsx";
import { useGymData } from "../useGymData.js";
import { formatLongDate } from "../lib/dates.js";
import { doseSummary, selectSession, sessionHeadline, shouldShowSuggestion, unitLabel } from "../lib/derive.js";
import { regressPlan } from "../lib/progression.js";
import { SYNC_NOT_READY } from "../sync/messages.js";

function doseFields(unit, value) {
  const dose = Number.isFinite(value) ? value : null;
  return {
    reps: unit === "reps" ? dose : null,
    seconds: unit === "seconds" ? dose : null,
    steps: unit === "steps" ? dose : null,
  };
}

function SetRow({ number, record, plan, unit, onCommit }) {
  const [load, setLoad] = useState(record?.loadKg ?? "");
  const [dose, setDose] = useState(record ? record.reps ?? record.seconds ?? record.steps ?? "" : "");
  const [rir, setRir] = useState(record?.rir ?? plan.targetRir);
  useEffect(() => {
    setLoad(record?.loadKg ?? "");
    setDose(record ? record.reps ?? record.seconds ?? record.steps ?? "" : "");
    setRir(record?.rir ?? plan.targetRir);
  }, [record, plan.targetRir]);
  const placeholderDose = String(plan.targetDose ?? "");
  const placeholderLoad = plan.loadLabel && plan.loadLabel !== "bodyweight" && plan.loadLabel !== "dumbbell" ? plan.loadLabel : "BW";

  function commit(completed) {
    const doseNumber = dose === "" ? Number(placeholderDose) : Number(dose);
    const typedLoad = load === "" ? null : Number(load);
    onCommit({
      loadKg: Number.isFinite(typedLoad) ? typedLoad : null,
      loadLabel: Number.isFinite(typedLoad) && typedLoad > 0 ? "dumbbell" : plan.loadLabel || "bodyweight",
      rir: rir === "" ? plan.targetRir : Number(rir),
      variation: plan.variation,
      completed,
      ...doseFields(unit, doseNumber),
    });
  }

  return (
    <div className={`gym-set ${record?.completed ? "is-done" : ""}`}>
      <span>{number}</span>
      <input
        aria-label={`Set ${number} weight kilograms`}
        inputMode="decimal"
        placeholder={placeholderLoad}
        value={load}
        onChange={(event) => setLoad(event.target.value)}
        onBlur={() => record && commit(Boolean(record.completed))}
      />
      <input
        aria-label={`Set ${number} ${unitLabel(unit)}`}
        inputMode="numeric"
        placeholder={placeholderDose}
        value={dose}
        onChange={(event) => setDose(event.target.value)}
        onBlur={() => record && commit(Boolean(record.completed))}
      />
      <input
        className="gym-rir-input"
        aria-label={`Set ${number} reps in reserve`}
        inputMode="numeric"
        value={rir}
        onChange={(event) => setRir(event.target.value)}
        onBlur={() => record && commit(Boolean(record.completed))}
      />
      <button
        type="button"
        className={`gym-check ${record?.completed ? "is-on" : ""}`}
        aria-pressed={Boolean(record?.completed)}
        aria-label={record?.completed ? `Mark set ${number} not done` : `Complete set ${number}`}
        onClick={() => commit(!record?.completed)}
      >
        <CheckIcon />
      </button>
    </div>
  );
}

function ExerciseCard({ plan, exercise, sets, entry, sampleOn, onCommit, onFeedback, onUpdate, onRegress }) {
  const numbers = [];
  const highest = sets.reduce((max, set) => Math.max(max, set.setNumber || 0), 0);
  const count = Math.max(plan.setsMin, highest);
  for (let index = 1; index <= count; index += 1) numbers.push(index);
  const suggestion = entry?.suggestion;
  const show = shouldShowSuggestion(suggestion);
  return (
    <article className="gym-card">
      <div className="gym-card__head">
        <div>
          <p className="gym-eyebrow">{exercise.muscle}</p>
          <h2>{exercise.name}</h2>
          <p className="gym-dose">
            {doseSummary(plan, exercise)} · target {plan.targetRir} RIR
          </p>
        </div>
        <details className="gym-menu">
          <summary aria-label={`Actions for ${exercise.name}`}>···</summary>
          <div className="gym-menu__pop">
            <button type="button" onClick={onFeedback}>Feedback</button>
            <button type="button" onClick={onRegress}>Use the regression</button>
          </div>
        </details>
      </div>
      {exercise.notes ? <p className="gym-help">{exercise.notes}</p> : null}
      {exercise.variationLadder?.length > 1 ? (
        <label className="gym-inline">
          <span>Variation</span>
          <select value={plan.variation || exercise.defaultVariation} onChange={(event) => onUpdate({ variation: event.target.value })}>
            {exercise.variationLadder.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </label>
      ) : null}
      {show ? (
        <div className={`gym-suggest ${suggestion.action === "stop" ? "is-stop" : ""}`}>
          <p>{suggestion.text}</p>
          {suggestion.clinician ? null : null}
          {suggestion.next && !sampleOn ? (
            <button type="button" className="gym-text-btn" onClick={() => onUpdate(suggestion.next)}>
              Use this next time
            </button>
          ) : null}
          {suggestion.next && sampleOn ? <p className="gym-hint">Turn off sample data before changing your plan.</p> : null}
        </div>
      ) : null}
      <div className="gym-sets">
        <div className="gym-sets__head">
          <span>Set</span>
          <span>Kg</span>
          <span>{unitLabel(exercise.unit)}</span>
          <span>RIR</span>
          <span />
        </div>
        {numbers.map((number) => (
          <SetRow
            key={number}
            number={number}
            record={sets.find((set) => set.setNumber === number)}
            plan={plan}
            unit={exercise.unit}
            onCommit={(patch) => onCommit(number, patch)}
          />
        ))}
      </div>
      {count < plan.setsMax ? (
        <button type="button" className="gym-add" onClick={() => onCommit(count + 1, { completed: false, ...doseFields(exercise.unit, plan.targetDose), rir: plan.targetRir, variation: plan.variation, loadKg: plan.loadKg, loadLabel: plan.loadLabel })}>
          + Add set
        </button>
      ) : null}
    </article>
  );
}

export default function WorkoutScreen() {
  const { ready, error, today, view, actions, sync } = useGymData();
  const [overrideId, setOverrideId] = useState(null);
  const [feedbackPlanId, setFeedbackPlanId] = useState(null);
  const [safetyOpen, setSafetyOpen] = useState(false);
  const [morningOpen, setMorningOpen] = useState(false);
  useDocumentTitle("Gym");

  const selection = view ? selectSession(view.days, today) : { day: null, relation: "rest" };
  const day = view?.days.find((item) => item.id === overrideId) || selection.day;
  const logging = Boolean(overrideId) || selection.relation === "today";
  const workout = useMemo(() => {
    if (!view || !day) return null;
    return view.workouts.find((row) => row.trainingDayId === day.id && row.date === today && row.mesoId === view.active?.id) || null;
  }, [view, day, today]);

  if (error) return <p className="gym-error">{error}</p>;
  if (!ready || !view || !day) return <p className="gym-loading">Loading your log…</p>;

  const headline = logging
    ? { eyebrow: day.focus, title: `Week ${view.blockWeek} · Day ${day.label} — ${day.name}`, dateNote: "" }
    : sessionHeadline(selection, view.blockWeek);
  const plans = view.plannedByDay[day.id] || [];
  const working = plans.filter((plan) => !plan.laterOption && !plan.optional);
  const optional = plans.filter((plan) => plan.optional && !plan.laterOption);
  const later = plans.filter((plan) => plan.laterOption);
  const setsFor = (plan) => (workout ? view.sets.filter((set) => set.plannedExerciseId === plan.id) : []);
  const done = workout ? view.sets.filter((set) => set.workoutId === workout.id && set.completed).length : 0;
  const plannedCount = working.reduce((sum, plan) => sum + plan.setsMin, 0);
  const feedbackPlan = plans.find((plan) => plan.id === feedbackPlanId);
  const feedbackExercise = feedbackPlan ? view.exercisesById[feedbackPlan.exerciseId] : null;
  const existingFeedback = feedbackPlan && workout
    ? view.feedback.find((row) => row.workoutId === workout.id && row.exerciseId === feedbackPlan.exerciseId)
    : null;
  const sessionSafety = workout ? view.safetyChecks.find((row) => row.workoutId === workout.id && row.kind === "session") : null;
  const priorHeel = view.safetyChecks.some((row) => /heel|ankle|plantar|arch/i.test(row.painLocation || ""));

  function renderPlan(plan) {
    const exercise = view.exercisesById[plan.exerciseId];
    if (!exercise) return null;
    return (
      <ExerciseCard
        key={plan.id}
        plan={plan}
        exercise={exercise}
        sets={setsFor(plan)}
        entry={view.suggestions[plan.id]}
        sampleOn={view.showSample}
        onCommit={(setNumber, patch) => actions.saveSet({ day, plan, setNumber, patch })}
        onFeedback={() => setFeedbackPlanId(plan.id)}
        onUpdate={(patch) => actions.updatePlanned(plan, patch)}
        onRegress={() => {
          const step = regressPlan(exercise, plan);
          if (step.next) actions.updatePlanned(plan, step.next);
        }}
      />
    );
  }

  return (
    <section>
      {view.showSample ? <p className="gym-banner">Sample history is on. It is not your training.</p> : null}
      {!sync.configured ? <p className="gym-note">{SYNC_NOT_READY}. Logging stays on this device.</p> : null}
      {view.pendingMorning ? (
        <div className="gym-banner">
          <strong>Next-morning check-in.</strong> How were the first steps after {view.pendingMorning.label}?
          <button type="button" className="gym-text-btn" onClick={() => setMorningOpen(true)}>Add it</button>
        </div>
      ) : null}
      {view.blockFinished ? (
        <p className="gym-banner">This block's weeks are done. Loads do not step up on their own — start another meso when you want one.</p>
      ) : null}
      <div className="gym-row">
        <p className="gym-eyebrow">{logging ? `Coach plan · ${day.isLight ? "Light day" : "Return phase"}` : "Schedule"}</p>
        {logging ? <p className="gym-count">{done} / {plannedCount} sets</p> : null}
      </div>
      <h1 className="gym-title">{headline.title}</h1>
      <div className="gym-meta-row">
        <p className="gym-date">{formatLongDate(today)}{logging ? ` · ${day.timeLabel}` : ""}</p>
        {logging ? <p className="gym-rir">Target · {day.targetRir} RIR</p> : null}
      </div>
      {headline.dateNote ? <p className="gym-note">{headline.dateNote}</p> : null}
      {!logging ? (
        <button type="button" className="gym-finish" onClick={() => setOverrideId(day.id)}>Log {day.label} early</button>
      ) : (
        <>
          <p className="gym-note">Rest {day.restMinSeconds}–{day.restMaxSeconds}s. {day.isLight ? "Sunday stays easy, about 4 RIR, except push-ups at 2–3." : "About 3 reps in reserve. No failure work."}</p>
          <details className="gym-card">
            <summary>Warm-up and mobility</summary>
            <p className="gym-help">{day.warmup}</p>
          </details>
          {working.map(renderPlan)}
          {optional.length ? (
            <details className="gym-card">
              <summary>Optional</summary>
              {optional.map(renderPlan)}
            </details>
          ) : null}
          {later.length ? (
            <details className="gym-card">
              <summary>Later options</summary>
              <p className="gym-help">Not in today's dose until you edit them into the plan.</p>
              {later.map((plan) => {
                const exercise = view.exercisesById[plan.exerciseId];
                return exercise ? <p key={plan.id} className="gym-note">{exercise.name}. {plan.notes}</p> : null;
              })}
            </details>
          ) : null}
          {workout?.status === "completed" ? (
            <p className="gym-note">Session saved on this device. Nothing progresses until the next morning's first steps are in.</p>
          ) : null}
          <button type="button" className="gym-finish" disabled={!done} onClick={() => setSafetyOpen(true)}>
            {workout?.status === "completed" ? "Update safety check" : "Finish workout →"}
          </button>
          {overrideId ? <button type="button" className="gym-linkish" onClick={() => setOverrideId(null)}>Back to today</button> : null}
        </>
      )}

      {feedbackPlan && feedbackExercise ? (
        <FeedbackSheet
          exercise={feedbackExercise}
          initial={existingFeedback}
          onClose={() => setFeedbackPlanId(null)}
          onSave={async (draft) => {
            await actions.saveFeedback({ day, exerciseId: feedbackExercise.id, draft });
            setFeedbackPlanId(null);
          }}
        />
      ) : null}
      {safetyOpen && workout ? (
        <SafetySheet
          title="Session safety"
          kind="session"
          initial={sessionSafety}
          priorHeel={priorHeel}
          finishLabel={workout.status === "completed" ? "Save check" : "Save and finish"}
          onClose={() => setSafetyOpen(false)}
          onSave={async (draft) => {
            await actions.saveSafety({ workoutId: workout.id, kind: "session", draft });
            if (workout.status !== "completed") await actions.finishWorkout(day);
            setSafetyOpen(false);
          }}
        />
      ) : null}
      {morningOpen && view.pendingMorning ? (
        <SafetySheet
          title="First steps this morning"
          kind="next_morning"
          priorHeel={priorHeel}
          finishLabel="Save check-in"
          onClose={() => setMorningOpen(false)}
          onSave={async (draft) => {
            await actions.saveSafety({ workoutId: view.pendingMorning.workout.id, kind: "next_morning", draft });
            setMorningOpen(false);
          }}
        />
      ) : null}
    </section>
  );
}
