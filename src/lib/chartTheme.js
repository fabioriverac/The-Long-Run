// Chart colors, as literal hex — not CSS custom properties. Recharts (SVG)
// needs resolved color values for its own internal calculations (gradients,
// active-dot fills), so these mirror the tokens in src/index.css rather
// than referencing var(--color-*) directly in chart props.
//
// Each dashboard chart here is a single series, so per dataviz guidance it
// needs no categorical palette/legend — just one consistent, meaningful
// hue per chart. Two hues are used across the whole dashboard, grouped by
// what the metric represents:
export const CHART_COLOR_TRAINING = "#c1683f"; // clay — training/performance metrics
export const CHART_COLOR_RECOVERY = "#6c7154"; // olive — recovery/wellness metrics
export const CHART_COLOR_MUTED = "#7a6f61"; // muted ink — axes, gridlines, goal lines
export const CHART_COLOR_GOAL = "#8f4a2e"; // rust — goal/reference lines

export const CHART_AXIS_PROPS = {
  stroke: CHART_COLOR_MUTED,
  fontSize: 12,
  tickLine: false,
  axisLine: { stroke: "rgba(44, 38, 32, 0.12)" },
};
