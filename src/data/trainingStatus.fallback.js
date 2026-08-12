// Static fallback for training_status_snapshots — see runs.fallback.js for
// why fallbacks exist. Shape matches real Garmin training_status data
// (sampled live): vo2max is sparse (not every day), race predictor times
// are in seconds. training_readiness_score is intentionally always null
// here — this device (Forerunner 245 Music) never reports it.
const trainingStatus = [
  {
    date: "2026-08-11",
    vo2max: 51.3,
    training_status: "productive",
    training_readiness_score: null,
    race_predictor_5k_seconds: 1224,
    race_predictor_10k_seconds: 2583,
    race_predictor_half_marathon_seconds: 5932,
    race_predictor_marathon_seconds: 13773,
  },
  {
    date: "2026-08-05",
    vo2max: 51.4,
    training_status: "productive",
    training_readiness_score: null,
    race_predictor_5k_seconds: null,
    race_predictor_10k_seconds: null,
    race_predictor_half_marathon_seconds: null,
    race_predictor_marathon_seconds: null,
  },
  {
    date: "2026-07-29",
    vo2max: 51.5,
    training_status: "peaking",
    training_readiness_score: null,
    race_predictor_5k_seconds: null,
    race_predictor_10k_seconds: null,
    race_predictor_half_marathon_seconds: null,
    race_predictor_marathon_seconds: null,
  },
  {
    date: "2026-07-22",
    vo2max: 51.6,
    training_status: "productive",
    training_readiness_score: null,
    race_predictor_5k_seconds: null,
    race_predictor_10k_seconds: null,
    race_predictor_half_marathon_seconds: null,
    race_predictor_marathon_seconds: null,
  },
  {
    date: "2026-07-15",
    vo2max: 51.7,
    training_status: "productive",
    training_readiness_score: null,
    race_predictor_5k_seconds: null,
    race_predictor_10k_seconds: null,
    race_predictor_half_marathon_seconds: null,
    race_predictor_marathon_seconds: null,
  },
];

export default trainingStatus;
