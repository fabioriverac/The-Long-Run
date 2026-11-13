import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { exercisesForPicker, muscleColor } from "../lib/derive.js";
import { rirSchedule } from "../lib/progression.js";
import { useGymData } from "../useGymData.js";

export default function MesosScreen() {
  const { view, actions } = useGymData();
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(null);
  const navigate = useNavigate();
  useDocumentTitle("Mesocycles");
  if (!view?.active) return <p className="gym-loading">Loading your log…</p>;
  const maxSets = Math.max(8, ...view.weeklySets.map((row) => row.sets));
  return (
    <section>
      <div className="gym-row">
        <h1 className="gym-title">Mesocycles</h1>
        <button type="button" className="gym-pill" onClick={() => {
          setDraft({
            name: "New mesocycle",
            weeks: view.active.weeks,
            includesDeload: view.active.includesDeload !== false,
            days: view.templateDays.map((day) => ({
              label: day.label,
              name: day.name,
              weekday: day.weekday,
              timeLabel: day.timeLabel,
              focus: day.focus,
              isLight: day.isLight,
              warmup: day.warmup,
              exerciseIds: (view.plannedByDay[day.id] || []).filter((plan) => !plan.laterOption).map((plan) => plan.exerciseId),
            })),
          });
          setCreating(true);
        }} aria-label="Plan a new mesocycle">+</button>
      </div>
      <p className="gym-note">Your training, one block at a time.</p>
      <article className="gym-card gym-hero-card">
        <p className="gym-eyebrow">Current meso</p>
        <p className="gym-rir" style={{ display: "inline-block", marginTop: 8 }}>Week {view.blockWeek} of {view.active.weeks}</p>
        <h2>{view.active.name}</h2>
        <p className="gym-note">{view.days.length} days / week · {view.active.weeks} weeks including deload</p>
        <div className="gym-progress" aria-hidden="true"><span style={{ width: `${view.stats.percent}%` }} /></div>
        <div className="gym-statline">
          <span>{view.stats.completed} of {view.stats.total} workouts complete</span>
          <span>{view.stats.percent}%</span>
        </div>
      </article>
      {creating && draft ? (
        <form className="gym-card" onSubmit={async (event) => {
          event.preventDefault();
          await actions.startMeso(draft);
          setCreating(false);
        }}>
          <h2>Plan a new mesocycle</h2>
          <p className="gym-help">This archives the current block. Logged sessions stay in the history.</p>
          <label className="gym-field"><span>Name</span><input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
          <div className="gym-split">
            <label className="gym-field"><span>Weeks, including deload</span><input inputMode="numeric" value={draft.weeks} onChange={(event) => setDraft({ ...draft, weeks: Number(event.target.value) || 1 })} /></label>
            <label className="gym-checkline">
              <input type="checkbox" checked={draft.includesDeload} onChange={(event) => setDraft({ ...draft, includesDeload: event.target.checked })} />
              <span>Last week is a deload</span>
            </label>
          </div>
          <p className="gym-label">Target RIR by week</p>
          <div className="gym-chips">
            {rirSchedule(draft.weeks, draft.includesDeload).map((week) => (
              <span key={week.week} className="gym-chip">{week.deload ? "Deload" : `Wk ${week.week}`} · {week.rir}</span>
            ))}
          </div>
          {draft.days.map((day, dayIndex) => (
            <div key={day.label} style={{ marginTop: 14 }}>
              <p className="gym-eyebrow">{day.label} · {day.name}</p>
              {day.exerciseIds.map((exerciseId) => {
                const exercise = view.exercisesById[exerciseId];
                return (
                  <div key={exerciseId} className="gym-list-btn">
                    <span><span className="gym-muscle__bar" style={{ background: muscleColor(exercise?.muscle), display: "inline-block", marginRight: 8 }} />{exercise?.name}</span>
                    <button type="button" className="gym-linkish" onClick={() => setDraft({
                      ...draft,
                      days: draft.days.map((item, index) => index === dayIndex ? { ...item, exerciseIds: item.exerciseIds.filter((id) => id !== exerciseId) } : item),
                    })}>Remove</button>
                  </div>
                );
              })}
              <label className="gym-field">
                <span>Add by muscle</span>
                <select defaultValue="" onChange={(event) => {
                  const exerciseId = event.target.value;
                  if (!exerciseId) return;
                  setDraft({
                    ...draft,
                    days: draft.days.map((item, index) => index === dayIndex && !item.exerciseIds.includes(exerciseId) ? { ...item, exerciseIds: [...item.exerciseIds, exerciseId] } : item),
                  });
                  event.target.value = "";
                }}>
                  <option value="">Choose an exercise</option>
                  {exercisesForPicker(view.exercises).map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>{exercise.muscle} · {exercise.name}</option>
                  ))}
                </select>
              </label>
            </div>
          ))}
          <div className="gym-sheet__actions">
            <button type="button" className="gym-secondary" onClick={() => setCreating(false)}>Cancel</button>
            <button type="submit" className="gym-primary">Plan mesocycle</button>
          </div>
        </form>
      ) : null}
      <div className="gym-row">
        <h2>Training block</h2>
      </div>
      <p className="gym-legend"><span><i style={{ background: "#ff3b57" }} /> Current</span><span><i style={{ background: "#234536" }} /> Complete</span></p>
      <p className="gym-note">Target RIR steps down each week. The last week is a deload. Load still moves only one small step at a time.</p>
      <div className="gym-grid">
        <div className="gym-grid__row" style={{ gridTemplateColumns: `64px repeat(${view.days.length}, minmax(0, 1fr))` }}>
          <span />
          {view.days.map((day) => <span key={day.id} className="gym-grid__head">{day.label}</span>)}
        </div>
        {view.grid.map((week) => (
          <div key={week.index} className="gym-grid__row" style={{ gridTemplateColumns: `64px repeat(${view.days.length}, minmax(0, 1fr))` }}>
            <span className="gym-grid__week">{week.label}</span>
            {week.cells.map((cell) => (
              <button key={cell.dayId} type="button" className={`gym-cell is-${cell.state}`} onClick={() => navigate("/gym")} aria-label={`${week.label} ${cell.label} ${cell.state}`}>
                {cell.state === "done" ? "✓" : cell.state === "current" ? "•" : ""}
              </button>
            ))}
          </div>
        ))}
      </div>
      <div className="gym-row"><h2>Weekly sets by muscle</h2><span className="gym-muted">Week {view.blockWeek}</span></div>
      {view.weeklySets.length === 0 ? <p className="gym-note">No sets logged this week yet.</p> : view.weeklySets.map((row) => (
        <div key={row.muscle} className="gym-bar">
          <span>{row.muscle}</span>
          <div className="gym-bar__track"><span style={{ width: `${(row.sets / maxSets) * 100}%`, background: row.color }} /></div>
          <strong>{row.sets}</strong>
        </div>
      ))}
      <div className="gym-row"><h2>Muscle group stats</h2></div>
      {Array.from(new Set(view.days.flatMap((day) => (view.plannedByDay[day.id] || []).map((plan) => view.exercisesById[plan.exerciseId]?.muscle).filter(Boolean)))).map((muscle) => (
        <div key={muscle} className="gym-list-btn">
          <span><span className="gym-muscle__bar" style={{ background: muscleColor(muscle), display: "inline-block", marginRight: 8 }} />{muscle}</span>
          <span className="gym-weekcells">
            {view.grid.map((week) => {
              const count = view.sets.filter((set) => {
                const workout = view.workouts.find((row) => row.id === set.workoutId);
                return set.completed && workout?.weekIndex === week.index && view.exercisesById[set.exerciseId]?.muscle === muscle;
              }).length;
              return <i key={week.index} title={`${week.label}: ${count}`} style={{ opacity: count ? 1 : 0.45, background: count ? muscleColor(muscle) : undefined }} />;
            })}
          </span>
        </div>
      ))}
      <div className="gym-row"><h2>Session history</h2></div>
      {view.recentSessions.length === 0 ? <p className="gym-note">Finished sessions land here.</p> : view.recentSessions.map((session) => (
        <button key={session.id} type="button" className="gym-exercise" onClick={() => navigate(`/gym/history/${session.id}`)}>
          <span><strong>{session.title}</strong><br /><small>{session.label}</small></span>
          <small>{session.sets} sets</small>
        </button>
      ))}
      <div className="gym-row"><h2>Past mesocycles</h2></div>
      {view.pastMesos.length === 0 ? <p className="gym-note">Finished blocks will land here.</p> : view.pastMesos.map((meso) => (
        <div key={meso.id} className="gym-list-btn">
          <span><strong>{meso.name}</strong><br /><small>{meso.weeks} weeks · {meso.status}</small></span>
        </div>
      ))}
    </section>
  );
}
