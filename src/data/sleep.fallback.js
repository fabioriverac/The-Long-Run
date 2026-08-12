// Static fallback for sleep_nights — see runs.fallback.js. Shape matches
// real Garmin sleep data (sampled live). sleep_score and avg_hrv are
// intentionally always null here — this device never reports them.
const sleep = [
  { date: "2026-08-11", sleep_start: "2026-08-10T20:04:00.000Z", sleep_end: "2026-08-11T03:15:00.000Z", total_sleep_seconds: 25860, deep_sleep_seconds: 2880, light_sleep_seconds: 16380, rem_sleep_seconds: 6600, awake_seconds: 0, sleep_score: null, avg_hrv: null, body_battery_change: 74 },
  { date: "2026-08-10", sleep_start: "2026-08-09T21:10:00.000Z", sleep_end: "2026-08-10T04:51:00.000Z", total_sleep_seconds: 27540, deep_sleep_seconds: 2760, light_sleep_seconds: 16920, rem_sleep_seconds: 7860, awake_seconds: 120, sleep_score: null, avg_hrv: null, body_battery_change: 65 },
  { date: "2026-08-09", sleep_start: "2026-08-08T20:36:00.000Z", sleep_end: "2026-08-09T04:39:00.000Z", total_sleep_seconds: 28920, deep_sleep_seconds: 2160, light_sleep_seconds: 16620, rem_sleep_seconds: 10140, awake_seconds: 60, sleep_score: null, avg_hrv: null, body_battery_change: 77 },
  { date: "2026-08-06", sleep_start: "2026-08-05T20:47:00.000Z", sleep_end: "2026-08-06T03:30:00.000Z", total_sleep_seconds: 24180, deep_sleep_seconds: 2460, light_sleep_seconds: 15120, rem_sleep_seconds: 6600, awake_seconds: 0, sleep_score: null, avg_hrv: null, body_battery_change: 60 },
  { date: "2026-08-05", sleep_start: "2026-08-04T20:37:00.000Z", sleep_end: "2026-08-05T03:36:00.000Z", total_sleep_seconds: 25140, deep_sleep_seconds: 2280, light_sleep_seconds: 14820, rem_sleep_seconds: 8040, awake_seconds: 0, sleep_score: null, avg_hrv: null, body_battery_change: 63 },
];

export default sleep;
