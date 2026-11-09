import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useGymData } from "../useGymData.js";
import { buildExerciseProgress, unitLabel } from "../lib/derive.js";
import { EPLEY_CAPTION } from "../lib/progression.js";

const RANGES = [
  { id: "6w", label: "6 weeks" },
  { id: "3m", label: "3 months" },
  { id: "all", label: "All time" },
];

export default function ExerciseProgressScreen() {
  const { exerciseId } = useParams();
  const { view, actions } = useGymData();
  const navigate = useNavigate();
  const [range, setRange] = useState("6w");
  const progress = view ? buildExerciseProgress(view, exerciseId, range) : null;
  useDocumentTitle(progress?.exercise.name || "Exercise");
  if (!view) return <p className="gym-loading">Loading your log…</p>;
  if (!progress) return <p className="gym-error">That exercise isn't in the library.</p>;
  const { exercise, points, useE1rm, latest, delta, sessions, jointPain, quietPain, mornings } = progress;
  return (
    <section>
      <Link to="/gym/exercises" className="gym-back">‹ Exercises</Link>
      <p className="gym-eyebrow">{exercise.muscle}</p>
      <h1 className="gym-title">{exercise.name}</h1>
      <p className="gym-note">{exercise.equipment}{exercise.sideNote ? ` · ${exercise.sideNote}` : ""}{view.showSample ? " · sample history included" : ""}</p>
      <div className="gym-seg" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {RANGES.map((item) => (
          <button key={item.id} type="button" className={range === item.id ? "is-on" : undefined} onClick={() => setRange(item.id)}>{item.label}</button>
        ))}
      </div>
      <article className="gym-card">
        <p className="gym-eyebrow">{useE1rm ? "Estimated one-rep max" : "Reps trend"}</p>
        <div className="gym-metric">
          <strong>
            {latest ? latest.value : "—"}
            {latest ? <span>{useE1rm ? "kg" : unitLabel(exercise.unit).toLowerCase()}</span> : null}
          </strong>
          {delta != null ? <span className="gym-delta">{delta > 0 ? "↗" : "→"} {delta}% estimated</span> : null}
        </div>
        {points.length ? (
          <div className="gym-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="mesoFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff3b57" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#ff3b57" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tick={{ fill: "#9a9aa3", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis hide domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip contentStyle={{ background: "#1c1c20", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10 }} />
                <Area type="monotone" dataKey="value" stroke="#ff3b57" strokeWidth={2.5} fill="url(#mesoFill)" dot={{ r: 3, fill: "#ff3b57" }} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="gym-note">Log a few sessions and the trend will show up here.</p>
        )}
        <p className="gym-help">
          {useE1rm
            ? EPLEY_CAPTION
            : "No external load yet, so this is reps rather than a max. An Epley estimate shows up once you add weight — and it is still not a tested max."}
        </p>
      </article>
      <div className="gym-row"><h2>Recent sessions</h2></div>
      {sessions.length === 0 ? <p className="gym-note">No sessions in this range.</p> : (
        <table className="gym-table">
          <thead>
            <tr><th>Date</th><th>Weight</th><th>{unitLabel(exercise.unit)}</th><th>e1RM</th></tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.date}>
                <td>{session.label}</td>
                <td>{session.loadKg ? `${session.loadKg} kg` : "BW"}</td>
                <td>{session.dose}</td>
                <td>{session.e1rm != null ? `${session.e1rm} kg` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="gym-row"><h2>Joint-pain check-ins</h2></div>
      <div className="gym-chips">
        {jointPain.length === 0 ? <span className="gym-muted">None yet.</span> : jointPain.map((value, index) => (
          <span key={`${value}-${index}`} className={`gym-chip ${value === "none" ? "" : "is-ok"}`}>{value === "a_lot" ? "A lot" : value === "none" ? "None" : value}</span>
        ))}
      </div>
      {quietPain ? <p className="gym-note">No pain reported in your last 3 sessions.</p> : null}
      <div className="gym-row"><h2>Next-morning trend</h2></div>
      <div className="gym-chips">
        {mornings.length === 0 ? <span className="gym-muted">No check-ins yet.</span> : mornings.map((value, index) => (
          <span key={`${value}-${index}`} className={`gym-chip ${value === "worse" || value === "much_worse" ? "is-bad" : ""}`}>{value === "missing" ? "Missing" : value}</span>
        ))}
      </div>
      {exercise.custom ? (
        <button
          type="button"
          className="gym-linkish"
          onClick={async () => {
            await actions.deleteExercise(exercise);
            navigate("/gym/exercises");
          }}
        >
          Remove this exercise
        </button>
      ) : null}
    </section>
  );
}
