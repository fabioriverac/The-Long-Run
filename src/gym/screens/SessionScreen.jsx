import { Link, useParams } from "react-router-dom";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useGymData } from "../useGymData.js";
import { formatLongDate } from "../lib/dates.js";
import { muscleColor, unitLabel } from "../lib/derive.js";

export default function SessionScreen() {
  const { workoutId } = useParams();
  const { view } = useGymData();
  const workout = view?.workouts.find((row) => row.id === workoutId);
  useDocumentTitle(workout ? formatLongDate(workout.date) : "Session");
  if (!view) return <p className="gym-loading">Loading your log…</p>;
  if (!workout) return <p className="gym-error">That session isn't on this device.</p>;
  const day = (view.allDays || view.days).find((item) => item.id === workout.trainingDayId);
  const sets = view.sets
    .filter((set) => set.workoutId === workout.id && set.completed)
    .sort((a, b) => a.setNumber - b.setNumber);
  const exerciseIds = [...new Set(sets.map((set) => set.exerciseId))];
  return (
    <section>
      <Link to="/gym/mesos" className="gym-back">‹ Mesos</Link>
      <p className="gym-eyebrow">{day ? `${day.label} · ${day.name}` : "Session"}</p>
      <h1 className="gym-title">{formatLongDate(workout.date)}</h1>
      <p className="gym-note">{sets.length} sets</p>
      {exerciseIds.map((exerciseId) => {
        const exercise = view.exercisesById[exerciseId];
        if (!exercise) return null;
        const rows = sets.filter((set) => set.exerciseId === exerciseId);
        return (
          <article key={exerciseId} className="gym-card">
            <p className="gym-eyebrow" style={{ color: muscleColor(exercise.muscle) }}>{exercise.muscle}</p>
            <h2>{exercise.name}</h2>
            {rows.map((set) => {
              const amount = exercise.unit === "seconds" ? set.seconds ?? set.reps : exercise.unit === "steps" ? set.steps ?? set.reps : set.reps;
              const dose = exercise.unit === "seconds" ? `${amount ?? "—"} ${unitLabel(exercise.unit).toLowerCase()}` : exercise.unit === "steps" ? `${amount ?? "—"} steps` : `${amount ?? "—"} reps`;
              const load = set.loadKg > 0 ? `${set.loadKg} kg` : "BW";
              return <p key={set.id} className="gym-note">Set {set.setNumber} · {load} × {dose}{set.rir != null ? ` · RIR ${set.rir}` : ""}</p>;
            })}
          </article>
        );
      })}
    </section>
  );
}
