import { useState } from "react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useGymData } from "../useGymData.js";
import { weekdayName } from "../lib/dates.js";
import { doseSummary, exercisesForPicker } from "../lib/derive.js";

const WEEKDAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

export default function TemplatesScreen() {
  const { view, actions } = useGymData();
  const [dayId, setDayId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ name: "", weekday: 4, timeLabel: "18:30" });
  useDocumentTitle("Templates");
  if (!view?.template) return <p className="gym-loading">Loading your log…</p>;
  const day = view.templateDays.find((item) => item.id === dayId);
  const plans = day ? view.plannedByDay[day.id] || [] : [];
  return (
    <section>
      <h1 className="gym-title">Templates</h1>
      <p className="gym-note">Saved workouts. A, B, and C are Coach's. Start a mesocycle from them, or build another day.</p>
      {!day ? (
        <>
          {view.templateDays.map((item) => {
            const count = (view.plannedByDay[item.id] || []).filter((plan) => !plan.laterOption).length;
            return (
              <button key={item.id} type="button" className="gym-exercise" onClick={() => setDayId(item.id)}>
                <span>
                  <strong>{item.label} · {item.name}</strong><br />
                  <small>{weekdayName(item.weekday)} · {item.timeLabel} · {item.targetRir} RIR · {count} exercises</small>
                </span>
                <span aria-hidden="true">›</span>
              </button>
            );
          })}
          <button type="button" className="gym-finish" onClick={() => setAdding((value) => !value)}>{adding ? "Close" : "New workout"}</button>
          {adding ? (
            <form className="gym-card" onSubmit={async (event) => {
              event.preventDefault();
              if (!draft.name.trim()) return;
              await actions.addWorkoutDay(draft);
              setDraft({ name: "", weekday: 4, timeLabel: "18:30" });
              setAdding(false);
            }}>
              <label className="gym-field"><span>Name</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Arms, core…" /></label>
              <div className="gym-split">
                <label className="gym-field">
                  <span>Day</span>
                  <select value={draft.weekday} onChange={(event) => setDraft({ ...draft, weekday: Number(event.target.value) })}>
                    {WEEKDAYS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                  </select>
                </label>
                <label className="gym-field"><span>Time</span><input value={draft.timeLabel} onChange={(event) => setDraft({ ...draft, timeLabel: event.target.value })} /></label>
              </div>
              <button type="submit" className="gym-primary" style={{ width: "100%", marginTop: 12 }}>Save workout</button>
            </form>
          ) : null}
          <button type="button" className="gym-secondary" style={{ width: "100%", marginTop: 12 }} onClick={() => actions.startMeso({ name: view.template.name, weeks: view.template.weeks, includesDeload: view.template.includesDeload })}>
            Start mesocycle from these
          </button>
        </>
      ) : (
        <>
          <button type="button" className="gym-back" onClick={() => setDayId(null)}>‹ Templates</button>
          <p className="gym-eyebrow">{day.label} · {weekdayName(day.weekday)} · {day.timeLabel}</p>
          <h2>{day.name}</h2>
          <p className="gym-help">{day.focus} · rest {day.restMinSeconds}–{day.restMaxSeconds}s · {day.targetRir} RIR</p>
          {plans.map((plan, index) => {
            const exercise = view.exercisesById[plan.exerciseId];
            if (!exercise) return null;
            return (
              <article key={plan.id} className="gym-card">
                <strong>{exercise.name}</strong>
                <p className="gym-dose">{doseSummary(plan, exercise)}{plan.optional ? " · optional" : ""}</p>
                <div className="gym-split">
                  <button type="button" className="gym-secondary" disabled={index === 0} onClick={() => actions.movePlan(plan, -1)}>Up</button>
                  <button type="button" className="gym-secondary" disabled={index === plans.length - 1} onClick={() => actions.movePlan(plan, 1)}>Down</button>
                </div>
                <button type="button" className="gym-linkish" onClick={() => actions.removePlanned(plan)}>Remove</button>
              </article>
            );
          })}
          <label className="gym-field">
            <span>Add an exercise</span>
            <select defaultValue="" onChange={(event) => {
              if (!event.target.value) return;
              actions.addPlanned(day, event.target.value);
              event.target.value = "";
            }}>
              <option value="">Choose from the library</option>
              {exercisesForPicker(view.exercises).map((exercise) => (
                <option key={exercise.id} value={exercise.id}>{exercise.muscle} · {exercise.name}</option>
              ))}
            </select>
          </label>
        </>
      )}
    </section>
  );
}
