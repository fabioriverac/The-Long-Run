import Card from "./Card.jsx";
import { formatDate } from "../utils/formatDate.js";
import { formatPace } from "../utils/formatPace.js";

function RunCard({ run }) {
  const { title, date, distance_km: distanceKm, duration_seconds: durationSeconds, type, note } = run;

  return (
    <Card
      tag={type}
      title={title}
      meta={[
        // Year included — runs.json can span a year boundary (the log is a
        // rolling 365-day window, not a calendar year), so "Aug 12" alone
        // is ambiguous about which August.
        formatDate(date, { month: "short", day: "numeric", year: "numeric" }),
        <strong key="distance">{distanceKm} km</strong>,
        formatPace(distanceKm, durationSeconds),
      ]}
      excerpt={note || undefined}
    />
  );
}

export default RunCard;
