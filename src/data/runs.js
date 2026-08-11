// Mock training log data. Swap for a real API / Garmin export later.
const runs = [
  {
    id: "run-01",
    title: "Easy shakeout along the river",
    date: "2026-08-09",
    distanceKm: 8,
    pace: "5:12 /km",
    type: "Easy",
    note: "Legs still a little heavy from Sunday's long run, kept it conversational and just enjoyed the light.",
  },
  {
    id: "run-02",
    title: "Marathon-pace intervals",
    date: "2026-08-06",
    distanceKm: 14,
    pace: "4:15 /km",
    type: "Workout",
    note: "6 x 1 mile at goal sub-3 pace with 90s float recovery. Splits tightened up nicely in the back half.",
  },
  {
    id: "run-03",
    title: "Long run — rolling hills",
    date: "2026-08-03",
    distanceKm: 29,
    pace: "4:48 /km",
    type: "Long run",
    note: "Longest of the block so far. Practiced race-day fueling: gel every 25 minutes, sipped water at every aid table.",
  },
];

export default runs;
