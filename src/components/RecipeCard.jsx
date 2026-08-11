import "./Cards.css";

function RecipeCard({ recipe }) {
  const { title, category, time, excerpt } = recipe;

  return (
    <article className="card">
      <span className="card__tag card__tag--clay">{category}</span>
      <h3 className="card__title">{title}</h3>
      <div className="card__meta">
        <span>{time}</span>
      </div>
      <p className="card__excerpt">{excerpt}</p>
    </article>
  );
}

export default RecipeCard;
