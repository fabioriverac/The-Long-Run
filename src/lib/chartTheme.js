// Chart colors, as literal hex — not CSS custom properties. Recharts (SVG)
// needs resolved color values for its own internal calculations (gradients,
// active-dot fills), so these mirror the tokens in src/index.css rather
// than referencing var(--color-*) directly in chart props.
//
// Each dashboard chart is a single series, so it needs no categorical
// palette — one black stroke for the series, grey for axes and the
// sub-3 reference line so that line stays readable against the series.
export const CHART_COLOR_TRAINING = "#000000";
export const CHART_COLOR_RECOVERY = "#5c5c5c";
export const CHART_COLOR_MUTED = "#5c5c5c";
export const CHART_COLOR_GOAL = "#8a8a8a";

export const CHART_AXIS_PROPS = {
  stroke: CHART_COLOR_MUTED,
  fontSize: 12,
  tickLine: false,
  axisLine: { stroke: "rgba(0, 0, 0, 0.16)" },
};
