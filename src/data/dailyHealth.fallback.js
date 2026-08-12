// Static fallback for daily_health — see runs.fallback.js. Shape matches
// real Garmin daily health data (sampled live). spo2_avg is intentionally
// always null here — this device never reports it.
const dailyHealth = [
  { date: "2026-08-11", steps: 19369, resting_hr: 48, avg_stress: 22, max_stress: 92, respiration_avg: 13, spo2_avg: null, intensity_minutes_moderate: 2, intensity_minutes_vigorous: 61 },
  { date: "2026-08-10", steps: 7594, resting_hr: 51, avg_stress: 26, max_stress: 93, respiration_avg: 13, spo2_avg: null, intensity_minutes_moderate: 0, intensity_minutes_vigorous: 0 },
  { date: "2026-08-09", steps: 10795, resting_hr: 49, avg_stress: 25, max_stress: 95, respiration_avg: 13, spo2_avg: null, intensity_minutes_moderate: 4, intensity_minutes_vigorous: 48 },
  { date: "2026-08-08", steps: 13008, resting_hr: 52, avg_stress: 35, max_stress: 83, respiration_avg: 14, spo2_avg: null, intensity_minutes_moderate: 1, intensity_minutes_vigorous: 75 },
  { date: "2026-08-06", steps: 6089, resting_hr: 48, avg_stress: 22, max_stress: 88, respiration_avg: 14, spo2_avg: null, intensity_minutes_moderate: 0, intensity_minutes_vigorous: 0 },
  { date: "2026-08-05", steps: 20835, resting_hr: 47, avg_stress: 26, max_stress: 98, respiration_avg: 14, spo2_avg: null, intensity_minutes_moderate: 3, intensity_minutes_vigorous: 61 },
];

export default dailyHealth;
