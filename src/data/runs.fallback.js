// Static fallback training log — shown when Supabase isn't configured yet
// (no VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY) or a query fails/returns
// empty, so the site never shows a broken or blank state. Once the Garmin
// sync has run at least once, real data from Supabase takes over — see
// src/data/runsRepository.js.
//
// Shape matches the `runs` table: raw distance_km/duration_seconds, pace
// is computed at render time by src/utils/formatPace.js.
const runs = [
  {
    id: "run-01",
    garmin_activity_id: null,
    title: "Easy shakeout along the river",
    date: "2026-08-09",
    distance_km: 8,
    duration_seconds: 2496, // 5:12 /km
    avg_hr: 138,
    max_hr: 151,
    type: "Easy",
    note: "Legs still a little heavy from Sunday's long run, kept it conversational and just enjoyed the light.",
  },
  {
    id: "run-02",
    garmin_activity_id: null,
    title: "Marathon-pace intervals",
    date: "2026-08-06",
    distance_km: 14,
    duration_seconds: 3570, // 4:15 /km
    avg_hr: 158,
    max_hr: 171,
    type: "Workout",
    note: "6 x 1 mile at goal sub-3 pace with 90s float recovery. Splits tightened up nicely in the back half.",
  },
  {
    id: "run-03",
    garmin_activity_id: null,
    title: "Long run — rolling hills",
    date: "2026-08-03",
    distance_km: 29,
    duration_seconds: 8352, // 4:48 /km
    avg_hr: 149,
    max_hr: 168,
    type: "Long run",
    note: "Longest of the block so far. Practiced race-day fueling: gel every 25 minutes, sipped water at every aid table.",
  },
];

export default runs;
