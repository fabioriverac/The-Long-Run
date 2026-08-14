import { Link, Navigate, useParams } from "react-router-dom";
import { getRecipeBySlug } from "../data/recipesRepository.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import "./Detail.css";

function RecipeDetail() {
  const { slug } = useParams();
  const recipe = getRecipeBySlug(slug);

  useDocumentTitle(recipe?.title);

  // No matching recipe (bad/stale slug) — back to the list rather than a
  // generic 404, since "recipe not found, here's every recipe" is a more
  // useful landing spot than the site-wide not-found page.
  if (!recipe) {
    return <Navigate to="/cooking" replace />;
  }

  const { title, category, time, excerpt, body } = recipe;

  return (
    <>
      <section className="page-header container">
        <span className="eyebrow">{category}</span>
        <h1>{title}</h1>
        <p className="page-header__lede">{excerpt}</p>
      </section>

      <section className="section container detail__body">
        <p className="detail__meta">
          <span>{time}</span>
        </p>
        {body.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        <Link to="/cooking" className="link-more detail__back">
          ← All recipes
        </Link>
      </section>
    </>
  );
}

export default RecipeDetail;
