import Card from "./Card.jsx";

function RecipeCard({ recipe }) {
  const { slug, title, category, time, excerpt } = recipe;

  return (
    <Card
      to={`/cooking/${slug}`}
      tag={category}
      tagVariant="clay"
      title={title}
      meta={[time]}
      excerpt={excerpt}
    />
  );
}

export default RecipeCard;
