import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useGymData } from "../useGymData.js";

export default function ExercisesScreen() {
  const { view, actions } = useGymData();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("All");
  const [draft, setDraft] = useState({ name: "", muscle: "", equipment: "bodyweight", unit: "reps", perSide: false, regression: "", notes: "" });
  useDocumentTitle("Exercises");
  const groups = useMemo(() => {
    const filtered = (view?.exercises || []).filter((exercise) => exercise.equipment !== "machine" && exercise.name.toLowerCase().includes(query.toLowerCase()) && (muscle === "All" || exercise.muscle === muscle));
    const map = new Map();
    for (const exercise of filtered) {
      const list = map.get(exercise.muscle) || [];
      list.push(exercise);
      map.set(exercise.muscle, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [view, query, muscle]);
  if (!view) return <p className="gym-loading">Loading your log…</p>;
  return (
    <section>
      <h1 className="gym-title">Exercises</h1>
      <p className="gym-note">Coach's running-support work, plus bodyweight upper body. No machines.</p>
      <div className="gym-filters">
        {["All", ...new Set((view?.exercises || []).map((exercise) => exercise.muscle))].map((item) => (
          <button key={item} type="button" className={muscle === item ? "is-on" : undefined} onClick={() => setMuscle(item)}>{item}</button>
        ))}
      </div>
      <label className="gym-field">
        <span>Search</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Calf, push-up, hip…" />
      </label>
      <button type="button" className="gym-finish" onClick={() => setOpen((value) => !value)}>{open ? "Close form" : "Add an exercise"}</button>
      {open ? (
        <form
          className="gym-card"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!draft.name.trim()) return;
            await actions.addExercise({
              name: draft.name.trim(),
              muscle: draft.muscle.trim() || "Other",
              equipment: draft.equipment,
              unit: draft.unit,
              perSide: draft.perSide,
              notes: draft.notes,
              regression: draft.regression ? { variation: "regression", label: draft.regression } : null,
            });
            setDraft({ name: "", muscle: "", equipment: "bodyweight", unit: "reps", perSide: false, regression: "", notes: "" });
            setOpen(false);
          }}
        >
          <label className="gym-field"><span>Name</span><input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
          <label className="gym-field"><span>Muscle</span><input value={draft.muscle} onChange={(event) => setDraft({ ...draft, muscle: event.target.value })} placeholder="Back, biceps…" /></label>
          <div className="gym-split">
            <label className="gym-field">
              <span>Equipment</span>
              <select value={draft.equipment} onChange={(event) => setDraft({ ...draft, equipment: event.target.value })}>
                <option value="bodyweight">Bodyweight</option>
                <option value="band">Band</option>
                <option value="dumbbell">Light dumbbell</option>
              </select>
            </label>
            <label className="gym-field">
              <span>Count</span>
              <select value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })}>
                <option value="reps">Reps</option>
                <option value="seconds">Seconds</option>
                <option value="steps">Steps</option>
              </select>
            </label>
          </div>
          <label className="gym-field"><span>Regression</span><input value={draft.regression} onChange={(event) => setDraft({ ...draft, regression: event.target.value })} placeholder="Easier version" /></label>
          <label className="gym-field"><span>Notes</span><textarea rows={2} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} /></label>
          <label className="gym-checkline">
            <input type="checkbox" checked={draft.perSide} onChange={(event) => setDraft({ ...draft, perSide: event.target.checked })} />
            <span>Per side</span>
          </label>
          <button type="submit" className="gym-primary" style={{ width: "100%", marginTop: 12 }}>Save exercise</button>
        </form>
      ) : null}
      {groups.map(([muscle, exercises]) => (
        <div key={muscle}>
          <p className="gym-eyebrow" style={{ marginTop: 18 }}>{muscle}</p>
          {exercises.map((exercise) => (
            <Link key={exercise.id} to={`/gym/exercises/${exercise.id}`} className="gym-exercise">
              <span>
                <strong>{exercise.name}</strong><br />
                <small>{exercise.equipment}{exercise.regression ? ` · regress: ${exercise.regression.label}` : ""}{exercise.custom ? " · yours" : ""}</small>
              </span>
              <span aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      ))}
    </section>
  );
}
