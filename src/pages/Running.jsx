import RunCard from "../components/RunCard.jsx";
import RacePredictor from "../components/dashboards/RacePredictor.jsx";
import TrainingStatusPanel from "../components/dashboards/TrainingStatusPanel.jsx";
import WeeklyVolumeChart from "../components/dashboards/WeeklyVolumeChart.jsx";
import RecoveryPanel from "../components/dashboards/RecoveryPanel.jsx";
import { useAsyncData } from "../hooks/useAsyncData.js";
import { getAllRuns } from "../data/runsRepository.js";

function Running() {
  const { data: runs, loading: runsLoading } = useAsyncData(() => getAllRuns(), []);

  return (
    <>
      <section className="page-header container">
        <span className="eyebrow">Fitness</span>
        <h1>Chasing sub-3</h1>
        <p className="page-header__lede">
          A training log for the long build toward a sub-3 hour marathon —
          the workouts that worked, the ones that didn't, and everything in
          between. Numbers below sync from Garmin.
        </p>
      </section>

      <section className="section container">
        <div className="dashboard-grid">
          <RacePredictor />
          <TrainingStatusPanel />
        </div>
      </section>

      <section className="section container">
        <div className="dashboard-grid">
          <WeeklyVolumeChart />
          <RecoveryPanel />
        </div>
      </section>

      <section className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">Training log</span>
            <h2>Recent runs</h2>
          </div>
        </div>
        {runsLoading ? (
          <p className="card__meta">Loading runs…</p>
        ) : (
          <div className="card-grid">
            {runs.map((run) => (
              <RunCard run={run} key={run.id ?? run.garmin_activity_id} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default Running;
