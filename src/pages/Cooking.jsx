import RecipeCard from "../components/RecipeCard.jsx";
import recipes from "../data/recipes.js";

function Cooking() {
  return (
    <>
      <section className="page-header container">
        <span className="eyebrow">Cooking</span>
        <h1>Food worth making again</h1>
        <p className="page-header__lede">
          Weeknight staples, meal-prep workhorses that survive a heavy
          training week, and dishes discovered along the way — restaurants,
          other people's kitchens, and the occasional happy accident.
        </p>
      </section>

      <section className="section container">
        <div className="card-grid">
          {recipes.map((recipe) => (
            <RecipeCard recipe={recipe} key={recipe.id} />
          ))}
        </div>
      </section>
    </>
  );
}

export default Cooking;
