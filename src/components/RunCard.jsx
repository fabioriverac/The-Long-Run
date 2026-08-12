import "./Cards.css";
import { formatDate } from "../utils/formatDate.js";
import { formatPace } from "../utils/formatPace.js";

function RunCard({ run }) {
  const { title, date, distance_km: distanceKm, duration_seconds: durationSeconds, type, note } = run;

  return (
    <article className="card">
      <span className="card__tag">{type}</span>
      <h3 className="card__title">{title}</h3>
      <div className="card__meta">
        <span>{formatDate(date, { month: "short", day: "numeric" })}</span>
        <span>
          <strong>{distanceKm} km</strong>
        </span>
        <span>{formatPace(distanceKm, durationSeconds)}</span>
      </div>
      {note && <p className="card__excerpt">{note}</p>}
    </article>
  );
}

export default RunCard;
