import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useAsyncData } from "../../hooks/useAsyncData.js";
import { getTrainingStatus } from "../../data/trainingStatusRepository.js";
import { formatDate } from "../../utils/formatDate.js";
import { CHART_AXIS_PROPS, CHART_COLOR_TRAINING } from "../../lib/chartTheme.js";
import "./DashboardPanel.css";

const STATUS_COPY = {
  productive: "Fitness is trending up — current training is working.",
  peaking: "Sharpening for a race — short-term fitness is at its highest.",
  maintaining: "Holding steady — enough load to maintain current fitness.",
  recovery: "Low load — the body is recovering from recent training.",
  unproductive: "Load is high but fitness isn't responding — watch fatigue.",
  overreaching: "Training load is outpacing recovery.",
  detraining: "Fitness has started to decline from reduced training.",
  no_status: "Not enough recent data for a status.",
};

function TrainingStatusPanel() {
  const { data: snapshots, loading } = useAsyncData(() => getTrainingStatus(60), []);

  const sorted = useMemo(
    () => [...snapshots].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [snapshots],
  );

  const latestStatus = useMemo(() => [...sorted].reverse().find((s) => s.training_status)?.training_status, [sorted]);

  const vo2maxSeries = useMemo(
    () => sorted.filter((s) => s.vo2max != null).map((s) => ({ date: s.date, vo2max: s.vo2max })),
    [sorted],
  );

  if (loading) {
    return (
      <section className="dashboard-panel">
        <p className="dashboard-panel__empty">Loading training status…</p>
      </section>
    );
  }

  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel__head">
        <div>
          <span className="eyebrow">Fitness trend</span>
          <h3 className="dashboard-panel__title">VO2max &amp; training status</h3>
        </div>
        {latestStatus && <span className="dashboard-panel__badge">{latestStatus}</span>}
      </div>

      {latestStatus && STATUS_COPY[latestStatus] && (
        <p className="card__excerpt" style={{ marginBottom: "1rem" }}>
          {STATUS_COPY[latestStatus]}
        </p>
      )}

      {vo2maxSeries.length > 1 ? (
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={vo2maxSeries} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="date"
              tickFormatter={(d) => formatDate(d, { month: "short", day: "numeric" })}
              {...CHART_AXIS_PROPS}
            />
            <YAxis width={32} domain={["dataMin - 1", "dataMax + 1"]} {...CHART_AXIS_PROPS} />
            <Tooltip
              formatter={(value) => [value, "VO2max"]}
              labelFormatter={(d) => formatDate(d, { month: "short", day: "numeric", year: "numeric" })}
            />
            <Line
              type="monotone"
              dataKey="vo2max"
              stroke={CHART_COLOR_TRAINING}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <p className="dashboard-panel__empty">Not enough VO2max readings yet for a trend.</p>
      )}
    </section>
  );
}

export default TrainingStatusPanel;
