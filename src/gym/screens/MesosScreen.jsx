import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDocumentTitle } from "../../hooks/useDocumentTitle.js";
import { useGymData } from "../useGymData.js";

export default function MesosScreen() {
  const { view, actions } = useGymData();
  const [confirming, setConfirming] = useState(false);
  const navigate = useNavigate();
  useDocumentTitle("Mesocycles");
  if (!view?.active) return <p className="gym-loading">Loading your log…</p>;
  const maxSets = Math.max(8, ...view.weeklySets.map((row) => row.sets));
  return (
    <section>
      <div className="gym-row">
        <h1 className="gym-title">Mesocycles</h1>
        <button type="button" className="gym-pill" onClick={() => setConfirming(true)} aria-label="Start a new mesocycle">+</button>
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
      {confirming ? (
        <div className="gym-card">
          <p>This archives the current block and starts a fresh copy of the template. Logged sessions stay in the history.</p>
          <div className="gym-sheet__actions">
            <button type="button" className="gym-secondary" onClick={() => setConfirming(false)}>Cancel</button>
            <button type="button" className="gym-primary" onClick={async () => { await actions.startMeso(); setConfirming(false); }}>Start meso</button>
          </div>
        </div>
      ) : null}
      <div className="gym-row">
        <h2>Training block</h2>
      </div>
      <p className="gym-legend"><span><i style={{ background: "#ff3b57" }} /> Current</span><span><i style={{ background: "#234536" }} /> Complete</span></p>
      <p className="gym-note">Deload is a label on the last week. Nothing gets heavier because the calendar moved.</p>
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
      <div className="gym-row"><h2>How you're tolerating it</h2></div>
      <p className="gym-label">Pain in recent sessions</p>
      <div className="gym-chips">
        {view.painTrend.length === 0 ? <span className="gym-muted">None logged yet.</span> : view.painTrend.map((chip) => (
          <span key={chip.id} className={`gym-chip is-${chip.tone}`}>{chip.label}</span>
        ))}
      </div>
      <p className="gym-label" style={{ marginTop: 12 }}>Next-morning first steps</p>
      <div className="gym-chips">
        {view.morningTrend.length === 0 ? <span className="gym-muted">No morning check-ins yet.</span> : view.morningTrend.map((chip) => (
          <span key={chip.id} className={`gym-chip is-${chip.tone}`}>{chip.label}</span>
        ))}
      </div>
      <div className="gym-row"><h2>Session history</h2></div>
      {view.recentSessions.length === 0 ? <p className="gym-note">Finished sessions land here.</p> : view.recentSessions.map((session) => (
        <div key={session.id} className="gym-list-btn">
          <span><strong>{session.title}</strong><br /><small>{session.label}{session.sample ? " · sample" : ""}</small></span>
          <small>{session.sets} sets</small>
        </div>
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
