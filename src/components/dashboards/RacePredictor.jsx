import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { getTrainingStatus } from "../../data/trainingStatusRepository.js";
import { formatDuration } from "../../utils/formatPace.js";
import { formatDate } from "../../utils/formatDate.js";
import { CHART_AXIS_PROPS, CHART_COLOR_GOAL, CHART_COLOR_TRAINING } from "../../lib/chartTheme.js";
import "./DashboardPanel.css";

const SUB_3_SECONDS = 3 * 60 * 60;

function RacePredictor() {
  const snapshots = getTrainingStatus(60);

  const sorted = useMemo(
    () => [...snapshots].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [snapshots],
  );

  const latest = useMemo(
    () => [...sorted].reverse().find((s) => s.race_predictor_marathon_seconds != null),
    [sorted],
  );

  const chartData = useMemo(
    () =>
      sorted
        .filter((s) => s.race_predictor_marathon_seconds != null)
        .map((s) => ({ date: s.date, marathonSeconds: s.race_predictor_marathon_seconds })),
    [sorted],
  );

  // Computed explicitly rather than a Recharts domain expression string —
  // see TrainingStatusPanel.jsx for why. Includes the sub-3 reference line
  // in the range so it's never clipped off-chart.
  const marathonDomain = useMemo(() => {
    if (chartData.length === 0) return undefined;
    const values = [...chartData.map((point) => point.marathonSeconds), SUB_3_SECONDS];
    return [Math.min(...values) - 300, Math.max(...values) + 300];
  }, [chartData]);

  if (!latest) {
    return (
      <section className="dashboard-panel">
        <div className="dashboard-panel__head">
          <span className="eyebrow">Race predictor</span>
        </div>
        <p className="dashboard-panel__empty">
          No race predictions yet — Garmin generates these after a few solid runs.
        </p>
      </section>
    );
  }

  const marathonGapSeconds = latest.race_predictor_marathon_seconds - SUB_3_SECONDS;

  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel__head">
        <div>
          <span className="eyebrow">Race predictor</span>
          <h2 className="dashboard-panel__title">Projected marathon time</h2>
        </div>
        <span className="dashboard-panel__badge">
          {marathonGapSeconds > 0 ? `${formatDuration(marathonGapSeconds)} off sub-3` : "Sub-3 pace"}
        </span>
      </div>

      <div className="dashboard-stats">
        <Stat label="5K" seconds={latest.race_predictor_5k_seconds} />
        <Stat label="10K" seconds={latest.race_predictor_10k_seconds} />
        <Stat label="Half" seconds={latest.race_predictor_half_marathon_seconds} />
        <Stat label="Marathon" seconds={latest.race_predictor_marathon_seconds} highlight />
      </div>

      {chartData.length > 1 && (
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatDate(d, { month: "short", day: "numeric" })}
              {...CHART_AXIS_PROPS}
            />
            <YAxis
              tickFormatter={(s) => formatDuration(s)}
              width={56}
              domain={marathonDomain}
              {...CHART_AXIS_PROPS}
            />
            <Tooltip
              formatter={(value) => [formatDuration(value), "Marathon"]}
              labelFormatter={(d) => formatDate(d, { month: "short", day: "numeric", year: "numeric" })}
            />
            <ReferenceLine y={SUB_3_SECONDS} stroke={CHART_COLOR_GOAL} strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="marathonSeconds"
              stroke={CHART_COLOR_TRAINING}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  );
}

function Stat({ label, seconds, highlight }) {
  return (
    <div className="dashboard-stat">
      <span className={`dashboard-stat__value ${highlight ? "dashboard-stat__value--goal" : ""}`}>
        {seconds != null ? formatDuration(seconds) : "—"}
      </span>
      <span className="dashboard-stat__label">{label}</span>
    </div>
  );
}

export default RacePredictor;
