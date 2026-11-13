import { useEffect, useMemo, useRef, useState } from "react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { MuscleFeedbackSheet, SorenessSheet, SwapSheet } from "../components/sheets.jsx";
import { CheckIcon, Sheet } from "../components/ui.jsx";
import { useGymData } from "../useGymData.js";
import { formatLongDate, weekdayName } from "../lib/dates.js";
import { lastSetLabel, muscleColor, selectSession, sessionAfterChoice, sessionHeadline, setsThisWeek, unitLabel } from "../lib/derive.js";
import { SYNC_NOT_READY } from "../sync/messages.js";

function doseFields(unit, value) {
  const dose = Number.isFinite(value) ? value : null;
  return {
    reps: unit === "reps" ? dose : null,
    seconds: unit === "seconds" ? dose : null,
    steps: unit === "steps" ? dose : null,
  };
}

function parseSkipped(notes) {
  const line = String(notes || "").split("\n").find((item) => item.startsWith("skipped:"));
  return new Set(line ? line.slice(8).split(",").filter(Boolean) : []);
}

function withSkipped(notes, ids) {
  const rest = String(notes || "")
    .split("\n")
    .filter((item) => item && !item.startsWith("skipped:"));
  if (ids.size) rest.push(`skipped:${[...ids].join(",")}`);
  return rest.join("\n");
}

function SetRow({ number, record, plan, unit, previous, onCommit }) {
  const [load, setLoad] = useState(record?.loadKg ?? "");
  const [dose, setDose] = useState(record ? record.reps ?? record.seconds ?? record.steps ?? "" : "");
  useEffect(() => {
    setLoad(record?.loadKg ?? "");
    setDose(record ? record.reps ?? record.seconds ?? record.steps ?? "" : "");
  }, [record]);
  const placeholderDose = String(plan.targetDose ?? "");
  const placeholderLoad = plan.loadLabel && plan.loadLabel !== "bodyweight" && plan.loadLabel !== "dumbbell" ? plan.loadLabel : "BW";

  function commit(completed) {
    const doseNumber = dose === "" ? Number(placeholderDose) : Number(dose);
    const typedLoad = load === "" ? null : Number(load);
    onCommit({
      loadKg: Number.isFinite(typedLoad) ? typedLoad : null,
      loadLabel: Number.isFinite(typedLoad) && typedLoad > 0 ? "dumbbell" : plan.loadLabel || "bodyweight",
      rir: plan.targetRir,
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
      <button
        type="button"
        className={`gym-check ${record?.completed ? "is-on" : ""}`}
        aria-pressed={Boolean(record?.completed)}
        aria-label={record?.completed ? `Mark set ${number} not done` : `Complete set ${number}`}
        onClick={() => commit(!record?.completed)}
      >
        <CheckIcon />
      </button>
      {previous ? <p className="gym-last">Last {previous}</p> : <p className="gym-last"> </p>}
    </div>
  );
}

function groupsFrom(plans, exercisesById, skipped) {
  const groups = [];
  for (const plan of plans) {
    if (plan.laterOption || skipped.has(plan.id)) continue;
    const exercise = exercisesById[plan.exerciseId];
    if (!exercise) continue;
    let group = groups.find((item) => item.muscle === exercise.muscle);
    if (!group) {
      group = { muscle: exercise.muscle, items: [] };
      groups.push(group);
    }
    group.items.push({ plan, exercise });
  }
  return groups;
}

export default function WorkoutScreen() {
  const { ready, error, today, view, actions, sync } = useGymData();
  const [overrideId, setOverrideId] = useState(null);
  const [choosing, setChoosing] = useState(false);
  const [sorenessMuscle, setSorenessMuscle] = useState(null);
  const dismissedSoreness = useRef(new Set());
  const dismissedFeedback = useRef(new Set());
  const [feedbackMuscle, setFeedbackMuscle] = useState(null);
  const [swap, setSwap] = useState(null);
  const [notesPlan, setNotesPlan] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  useDocumentTitle("Gym");

  const selection = view ? selectSession(view.days, today) : { day: null, relation: "rest" };
  const chosen = view ? sessionAfterChoice(view.days, today, overrideId) : { day: null, logging: false };
  const day = chosen.day;
  const logging = chosen.logging;
  const workout = useMemo(() => {
    if (!view || !day || !view.active) return null;
    return view.workouts.find((row) => row.trainingDayId === day.id && row.date === today && row.mesoId === view.active.id) || null;
  }, [view, day, today]);
  const skipped = parseSkipped(workout?.notes);

  const groups = useMemo(
    () => (view && day ? groupsFrom(view.plannedByDay[day.id] || [], view.exercisesById, parseSkipped(workout?.notes)) : []),
    [view, day, workout],
  );
  const weekTarget = useMemo(() => view?.weekTarget || { rir: 3, deload: false }, [view]);

  const dueSoreness = useMemo(() => {
    if (!view || !logging || !day) return [];
    const hidden = parseSkipped(workout?.notes);
    const muscles = [];
    for (const plan of view.plannedByDay[day.id] || []) {
      if (plan.laterOption || hidden.has(plan.id)) continue;
      const muscle = view.exercisesById[plan.exerciseId]?.muscle;
      if (muscle && !muscles.includes(muscle)) muscles.push(muscle);
    }
    const due = [];
    for (const muscle of muscles) {
      const previous = [...view.workouts]
        .filter((row) => row.status === "completed" && row.date < today)
        .sort((a, b) => b.date.localeCompare(a.date))
        .find((row) => view.sets.some((set) => set.workoutId === row.id && set.completed && view.exercisesById[set.exerciseId]?.muscle === muscle));
      if (!previous) continue;
      const feedback = view.feedback.find((row) => row.workoutId === previous.id && row.muscle === muscle);
      if (!feedback?.soreness) due.push({ muscle, workoutId: previous.id, feedback });
    }
    return due;
  }, [view, logging, day, today, workout]);

  useEffect(() => {
    if (sorenessMuscle) return;
    const next = dueSoreness.find((item) => !dismissedSoreness.current.has(item.muscle));
    if (next) setSorenessMuscle(next);
  }, [dueSoreness, sorenessMuscle]);

  useEffect(() => {
    if (!view || !workout || feedbackMuscle || sorenessMuscle) return;
    const ready = groups.find((group) => {
      const complete = group.items.every(({ plan }) => {
        const logged = view.sets.filter((set) => set.workoutId === workout.id && set.plannedExerciseId === plan.id && set.completed);
        return logged.length >= setsThisWeek(plan, weekTarget).min;
      });
      const existing = view.feedback.find((row) => row.workoutId === workout.id && row.muscle === group.muscle);
      return complete && !existing?.jointPain && !dismissedFeedback.current.has(group.muscle);
    });
    if (ready) setFeedbackMuscle(ready.muscle);
  }, [view, workout, groups, feedbackMuscle, sorenessMuscle, weekTarget]);

  if (error) return <p className="gym-error">{error}</p>;
  if (!ready || !view || !day || !view.active) return <p className="gym-loading">Loading your log…</p>;

  const headline = logging
    ? { title: `Week ${view.blockWeek} · Day ${day.label}` }
    : sessionHeadline(selection, view.blockWeek);
  const setsFor = (plan) => (workout ? view.sets.filter((set) => set.workoutId === workout.id && set.plannedExerciseId === plan.id) : []);
  const done = workout ? view.sets.filter((set) => set.workoutId === workout.id && set.completed).length : 0;

  async function commitSet(plan, setNumber, patch) {
    await actions.saveSet({ day, plan: { ...plan, targetRir: weekTarget.rir }, setNumber, patch });
  }

  return (
    <section>
      {!sync.configured && sync.checked ? <p className="gym-note">{SYNC_NOT_READY}. Logging stays on this device.</p> : null}
      <p className="gym-kicker">{view.active.name}</p>
      <h1 className="gym-title">{logging ? headline.title : headline.title}</h1>
      <div className="gym-meta-row">
        <p className="gym-date">{formatLongDate(today)}{logging ? ` · ${day.name}` : ""}</p>
        {logging ? <p className="gym-rir">{weekTarget.deload ? "Deload" : "Target"} · {weekTarget.rir} RIR</p> : null}
      </div>
      <button type="button" className="gym-choose" onClick={() => setChoosing(true)}>
        <span>Choose workout</span>
        <span aria-hidden="true">›</span>
      </button>
      {!logging ? <p className="gym-note">{headline.dateNote}</p> : null}
      {!logging ? (
        <div className="gym-daylist">
          {view.days.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`gym-daycard ${item.id === selection.day?.id ? "is-next" : ""}`}
              onClick={() => setOverrideId(item.id)}
            >
              <span>
                <strong>{item.label} · {item.name}</strong>
                <small>{weekdayName(item.weekday)} · {item.timeLabel}</small>
              </span>
              <span aria-hidden="true">›</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          {weekTarget.deload ? <p className="gym-note">Deload. Sets are cut back and the load stays put.</p> : null}
          {groups.map((group) => {
            const setCount = group.items.reduce((sum, { plan }) => sum + setsFor(plan).filter((set) => set.completed).length, 0);
            return (
              <section key={group.muscle}>
                <div className="gym-muscle">
                  <span className="gym-muscle__bar" style={{ background: muscleColor(group.muscle) }} />
                  <strong>{group.muscle}</strong>
                  <span>{setCount} sets</span>
                </div>
                {group.items.map(({ plan, exercise }) => {
                  const logged = setsFor(plan);
                  const target = setsThisWeek(plan, weekTarget);
                  const numbers = [];
                  const highest = logged.reduce((max, set) => Math.max(max, set.setNumber || 0), 0);
                  const count = Math.max(target.min, highest);
                  for (let index = 1; index <= count; index += 1) numbers.push(index);
                  const suggestion = view.suggestions[plan.id]?.suggestion;
                  return (
                    <article key={plan.id} className="gym-card">
                      <div className="gym-card__head">
                        <div>
                          <h2>{exercise.name}</h2>
                          <p className="gym-dose">{target.min === target.max ? target.min : `${target.min}–${target.max}`} × {plan.targetDose ?? plan.repsMin}{exercise.sideNote ? ` ${exercise.sideNote}` : ""} · RIR {weekTarget.rir}</p>
                        </div>
                        <details className="gym-menu">
                          <summary aria-label={`Actions for ${exercise.name}`}>···</summary>
                          <div className="gym-menu__pop">
                            <button type="button" onClick={() => setSwap({ plan, exercise })}>Swap</button>
                            <button type="button" onClick={() => { setNotesPlan(plan); setNoteDraft(plan.notes || exercise.notes || ""); }}>Notes</button>
                            <button type="button" onClick={() => actions.setWorkoutNotes(day, withSkipped(workout?.notes, new Set([...skipped, plan.id])))}>Skip</button>
                          </div>
                        </details>
                      </div>
                      {suggestion?.flagSwap ? <p className="gym-suggest">{suggestion.text}</p> : null}
                      {suggestion && !suggestion.flagSwap && suggestion.action !== "hold" && suggestion.text ? <p className="gym-help">{suggestion.text}</p> : null}
                      <div className="gym-sets">
                        <div className="gym-sets__head gym-sets__head--log">
                          <span>Set</span>
                          <span>Kg</span>
                          <span>{unitLabel(exercise.unit)}</span>
                          <span />
                        </div>
                        {numbers.map((number) => (
                          <SetRow
                            key={number}
                            number={number}
                            record={logged.find((set) => set.setNumber === number)}
                            plan={{ ...plan, targetRir: weekTarget.rir }}
                            unit={exercise.unit}
                            previous={lastSetLabel(view.sets, view.workouts, exercise, number, today)}
                            onCommit={(patch) => commitSet(plan, number, patch)}
                          />
                        ))}
                      </div>
                      {count < target.max ? (
                        <button type="button" className="gym-add" onClick={() => commitSet(plan, count + 1, { completed: false, ...doseFields(exercise.unit, plan.targetDose), rir: weekTarget.rir, variation: plan.variation, loadKg: plan.loadKg, loadLabel: plan.loadLabel })}>
                          + Add set
                        </button>
                      ) : null}
                    </article>
                  );
                })}
              </section>
            );
          })}
          <button type="button" className="gym-finish" disabled={!done} onClick={() => actions.finishWorkout(day)}>
            {workout?.status === "completed" ? "Workout saved" : "Finish workout"}
          </button>
          {overrideId ? <button type="button" className="gym-linkish" onClick={() => setOverrideId(null)}>Back to today</button> : null}
        </>
      )}

      {choosing ? (
        <Sheet title="Choose workout" kicker={view.active.name} onClose={() => setChoosing(false)}>
          {view.days.map((item) => (
            <button
              key={item.id}
              type="button"
              className="gym-exercise"
              onClick={() => {
                setOverrideId(item.id === selection.day?.id && selection.relation === "today" ? null : item.id);
                setChoosing(false);
              }}
            >
              <span>
                <strong>{item.label} · {item.name}</strong><br />
                <small>{weekdayName(item.weekday)} · {item.timeLabel} · {item.targetRir} RIR</small>
              </span>
              <span>{item.id === day.id ? "Now" : "Do today"}</span>
            </button>
          ))}
        </Sheet>
      ) : null}
      {sorenessMuscle ? (
        <SorenessSheet
          muscle={sorenessMuscle.muscle}
          onClose={() => {
            dismissedSoreness.current.add(sorenessMuscle.muscle);
            setSorenessMuscle(null);
          }}
          onSave={async (soreness) => {
            await actions.saveMuscleFeedback({
              workoutId: sorenessMuscle.workoutId,
              muscle: sorenessMuscle.muscle,
              patch: { soreness },
              day,
              apply: true,
            });
            setSorenessMuscle(null);
          }}
        />
      ) : null}
      {feedbackMuscle && workout ? (
        <MuscleFeedbackSheet
          muscle={feedbackMuscle}
          onClose={() => {
            dismissedFeedback.current.add(feedbackMuscle);
            setFeedbackMuscle(null);
          }}
          onSave={async (draft) => {
            await actions.saveMuscleFeedback({
              workoutId: workout.id,
              muscle: feedbackMuscle,
              patch: draft,
              day,
              apply: true,
            });
            setFeedbackMuscle(null);
          }}
        />
      ) : null}
      {swap ? (
        <SwapSheet
          muscle={swap.exercise.muscle}
          exercises={view.exercises}
          currentId={swap.exercise.id}
          onClose={() => setSwap(null)}
          onPick={async (exercise) => {
            await actions.updatePlanned(swap.plan, {
              exerciseId: exercise.id,
              variation: exercise.defaultVariation || "standard",
              perSide: Boolean(exercise.perSide),
              loadLabel: exercise.equipment === "band" ? "light" : "bodyweight",
              loadKg: null,
            });
            setSwap(null);
          }}
        />
      ) : null}
      {notesPlan ? (
        <form
          className="gym-card"
          onSubmit={async (event) => {
            event.preventDefault();
            await actions.updatePlanned(notesPlan, { notes: noteDraft });
            setNotesPlan(null);
          }}
        >
          <label className="gym-field">
            <span>Notes</span>
            <textarea rows={3} value={noteDraft} onChange={(event) => setNoteDraft(event.target.value)} />
          </label>
          <button type="submit" className="gym-primary" style={{ width: "100%", marginTop: 8 }}>Save note</button>
        </form>
      ) : null}
    </section>
  );
}
