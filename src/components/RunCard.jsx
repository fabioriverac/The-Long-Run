import "./Cards.css";
import { formatDate } from "../utils/formatDate.js";

function RunCard({ run }) {
  const { title, date, distanceKm, pace, type, note } = run;

  return (
    <article className="card">
      <span className="card__tag">{type}</span>
      <h3 className="card__title">{title}</h3>
      <div className="card__meta">
        <span>{formatDate(date, { month: "short", day: "numeric" })}</span>
        <span>
          <strong>{distanceKm} km</strong>
        </span>
        <span>{pace}</span>
      </div>
      <p className="card__excerpt">{note}</p>
    </article>
  );
}

export default RunCard;
