import { useMemo } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { useAsyncData } from "../../hooks/useAsyncData.js";
import { getDailyHealth } from "../../data/dailyHealthRepository.js";
import { getSleep } from "../../data/sleepRepository.js";
import { formatDuration } from "../../utils/formatPace.js";
import { CHART_COLOR_RECOVERY } from "../../lib/chartTheme.js";
import "./DashboardPanel.css";

// Each metric here is its own single-series sparkline rather than one
// combined multi-axis chart — steps, HR, and sleep duration are on
// incompatible scales, and dataviz guidance is clear that two y-axes on
// one chart is the #1 chart mistake. Four small, honest charts instead.
function RecoveryPanel() {
  const { data: health, loading: healthLoading } = useAsyncData(() => getDailyHealth(14), []);
  const { data: sleep, loading: sleepLoading } = useAsyncData(() => getSleep(14), []);

  const loading = healthLoading || sleepLoading;

  const restingHrSeries = useMemo(
    () =>
      [...health]
        .filter((d) => d.resting_hr != null)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((d) => ({ date: d.date, value: d.resting_hr })),
    [health],
  );

  const stressSeries = useMemo(
    () =>
      [...health]
        .filter((d) => d.avg_stress != null)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((d) => ({ date: d.date, value: d.avg_stress })),
    [health],
  );

  const sleepSeries = useMemo(
    () =>
      [...sleep]
        .filter((n) => n.total_sleep_seconds != null)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((n) => ({ date: n.date, value: n.total_sleep_seconds })),
    [sleep],
  );

  const batterySeries = useMemo(
    () =>
      [...sleep]
        .filter((n) => n.body_battery_change != null)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map((n) => ({ date: n.date, value: n.body_battery_change })),
    [sleep],
  );

  const latestRestingHr = restingHrSeries.at(-1)?.value;
  const latestSleep = sleepSeries.at(-1)?.value;
  const latestStress = stressSeries.at(-1)?.value;
  const latestBattery = batterySeries.at(-1)?.value;

  if (loading) {
    return (
      <section className="dashboard-panel">
        <p className="dashboard-panel__empty">Loading recovery data…</p>
      </section>
    );
  }

  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel__head">
        <div>
          <span className="eyebrow">Recovery</span>
          <h3 className="dashboard-panel__title">Recovery &amp; readiness</h3>
        </div>
      </div>

      <div className="recovery-grid">
        <RecoveryMetric label="Resting HR" value={latestRestingHr ? `${latestRestingHr} bpm` : "—"} series={restingHrSeries} />
        <RecoveryMetric label="Last night's sleep" value={latestSleep ? formatDuration(latestSleep) : "—"} series={sleepSeries} />
        <RecoveryMetric label="Avg stress" value={latestStress ?? "—"} series={stressSeries} />
        <RecoveryMetric label="Body battery gained" value={latestBattery != null ? `+${latestBattery}` : "—"} series={batterySeries} />
      </div>
    </section>
  );
}

function RecoveryMetric({ label, value, series }) {
  return (
    <div className="recovery-metric">
      <span className="dashboard-stat__value">{value}</span>
      <span className="dashboard-stat__label">{label}</span>
      {series.length > 1 && (
        <ResponsiveContainer width="100%" height={40}>
          <LineChart data={series}>
            <Line
              type="monotone"
              dataKey="value"
              stroke={CHART_COLOR_RECOVERY}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default RecoveryPanel;
