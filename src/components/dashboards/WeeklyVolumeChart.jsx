import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getAllRuns } from "../../data/runsRepository.js";
import { groupByWeek } from "../../utils/groupByWeek.js";
import { formatDate } from "../../utils/formatDate.js";
import { CHART_AXIS_PROPS, CHART_COLOR_TRAINING } from "../../lib/chartTheme.js";
import "./DashboardPanel.css";

const WEEKS_SHOWN = 12;

function WeeklyVolumeChart() {
  const runs = getAllRuns();

  const weeks = useMemo(() => groupByWeek(runs).slice(-WEEKS_SHOWN), [runs]);

  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel__head">
        <div>
          <span className="eyebrow">Volume</span>
          <h2 className="dashboard-panel__title">Weekly mileage</h2>
        </div>
      </div>

      {weeks.length > 0 ? (
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weeks} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis
              dataKey="weekStart"
              tickFormatter={(d) => formatDate(d, { month: "short", day: "numeric" })}
              {...CHART_AXIS_PROPS}
            />
            <YAxis width={40} tickFormatter={(v) => `${v}`} {...CHART_AXIS_PROPS} />
            <Tooltip
              formatter={(value) => [`${value} km`, "Distance"]}
              labelFormatter={(d) => `Week of ${formatDate(d, { month: "short", day: "numeric" })}`}
            />
            <Bar dataKey="distanceKm" fill={CHART_COLOR_TRAINING} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <p className="dashboard-panel__empty">No runs logged yet.</p>
      )}
    </section>
  );
}

export default WeeklyVolumeChart;
