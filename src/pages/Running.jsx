import RunCard from "../components/RunCard.jsx";
import runs from "../data/runs.js";
import "./Running.css";

const stats = [
  { label: "Goal", value: "Sub-3:00" },
  { label: "Current PR", value: "3:08:41" },
  { label: "Weekly mileage", value: "~70 km" },
  { label: "Race day", value: "Oct 2026" },
];

function Running() {
  return (
    <>
      <section className="page-header container">
        <span className="eyebrow">Fitness</span>
        <h1>Chasing sub-3</h1>
        <p className="page-header__lede">
          A training log for the long build toward a sub-3 hour marathon —
          the workouts that worked, the ones that didn't, and everything in
          between.
        </p>
      </section>

      <section className="section container">
        <div className="stats-row">
          {stats.map((stat) => (
            <div className="stat" key={stat.label}>
              <span className="stat__value">{stat.value}</span>
              <span className="stat__label">{stat.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Training log</span>
            <h2>Recent runs</h2>
          </div>
        </div>
        <div className="card-grid">
          {runs.map((run) => (
            <RunCard run={run} key={run.id} />
          ))}
        </div>
      </section>
    </>
  );
}

export default Running;
