import { Link } from "react-router-dom";
import "./Cards.css";

function RecipeCard({ recipe }) {
  const { slug, title, category, time, excerpt } = recipe;

  return (
    <Link to={`/cooking/${slug}`} className="card">
      <span className="card__tag card__tag--clay">{category}</span>
      <h3 className="card__title">{title}</h3>
      <div className="card__meta">
        <span>{time}</span>
      </div>
      <p className="card__excerpt">{excerpt}</p>
    </Link>
  );
}

export default RecipeCard;
