import { useState } from "react";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useGymData } from "../useGymData.js";
import { doseSummary } from "../lib/derive.js";

function NumberField({ label, value, onCommit }) {
  const [draft, setDraft] = useState(String(value ?? ""));
  return (
    <label className="gym-field">
      <span>{label}</span>
      <input
        inputMode="numeric"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          const next = Number(draft);
          if (Number.isFinite(next)) onCommit(next);
        }}
      />
    </label>
  );
}

export default function TemplatesScreen() {
  const { view, actions } = useGymData();
  const [which, setWhich] = useState("template");
  useDocumentTitle("Templates");
  if (!view?.template) return <p className="gym-loading">Loading your log…</p>;
  const meso = which === "template" ? view.template : view.active;
  const days = which === "template" ? view.templateDays : view.days;
  return (
    <section>
      <h1 className="gym-title">Templates</h1>
      <p className="gym-note">Coach's A / B / C plan is editable. The workout uses the current meso, which starts as a copy.</p>
      <div className="gym-seg">
        <button type="button" className={which === "template" ? "is-on" : undefined} onClick={() => setWhich("template")}>Template</button>
        <button type="button" className={which === "current" ? "is-on" : undefined} onClick={() => setWhich("current")}>Current meso</button>
      </div>
      <article className="gym-card">
        <h2>{meso.name}</h2>
        <p className="gym-help">{meso.notes}</p>
      </article>
      {which === "template" ? (
        <button type="button" className="gym-finish" onClick={() => actions.copyTemplateOntoMeso()}>Send template to current meso</button>
      ) : null}
      {days.map((day) => (
        <article key={day.id} className="gym-card">
          <p className="gym-eyebrow">{day.label} · {day.timeLabel} · {day.targetRir} RIR</p>
          <h2>{day.name}</h2>
          <p className="gym-help">{day.focus}</p>
          {(view.plannedByDay[day.id] || []).map((plan) => {
            const exercise = view.exercisesById[plan.exerciseId];
            if (!exercise) return null;
            return (
              <div key={plan.id} style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                <strong>{exercise.name}</strong>
                <p className="gym-dose">{doseSummary(plan, exercise)}{plan.optional ? " · optional" : ""}{plan.laterOption ? " · later" : ""}</p>
                {exercise.regression ? <p className="gym-help">Regression: {exercise.regression.label}</p> : null}
                <div className="gym-split">
                  <NumberField label="Sets min" value={plan.setsMin} onCommit={(setsMin) => actions.updatePlanned(plan, { setsMin })} />
                  <NumberField label="Sets max" value={plan.setsMax} onCommit={(setsMax) => actions.updatePlanned(plan, { setsMax })} />
                  <NumberField label="Reps min" value={plan.repsMin} onCommit={(repsMin) => actions.updatePlanned(plan, { repsMin, targetDose: repsMin })} />
                  <NumberField label="Reps max" value={plan.repsMax} onCommit={(repsMax) => actions.updatePlanned(plan, { repsMax })} />
                </div>
                <label className="gym-checkline">
                  <input type="checkbox" checked={plan.optional} onChange={(event) => actions.updatePlanned(plan, { optional: event.target.checked })} />
                  <span>Optional</span>
                </label>
                <label className="gym-checkline">
                  <input type="checkbox" checked={plan.laterOption} onChange={(event) => actions.updatePlanned(plan, { laterOption: event.target.checked })} />
                  <span>Later option</span>
                </label>
                <button type="button" className="gym-linkish" onClick={() => actions.removePlanned(plan)}>Remove from this day</button>
              </div>
            );
          })}
          <label className="gym-field">
            <span>Add an exercise</span>
            <select
              defaultValue=""
              onChange={(event) => {
                if (!event.target.value) return;
                actions.addPlanned(day, event.target.value);
                event.target.value = "";
              }}
            >
              <option value="">Choose from the library</option>
              {view.exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
            </select>
          </label>
        </article>
      ))}
    </section>
  );
}
