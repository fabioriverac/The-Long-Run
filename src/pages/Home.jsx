import Hero from "../components/Hero.jsx";
import SectionHeader from "../components/SectionHeader.jsx";
import PillarsGrid from "../components/PillarsGrid.jsx";
import RunCard from "../components/RunCard.jsx";
import RecipeCard from "../components/RecipeCard.jsx";
import FeaturedPost from "../components/FeaturedPost.jsx";
import { getLatestRuns } from "../data/latestRunsRepository.js";
import recipes from "../data/recipes.js";
import posts from "../data/posts.js";

function Home() {
  const latestRuns = getLatestRuns(3);
  const latestRecipes = recipes.slice(0, 3);
  const latestPost = posts[0];

  return (
    <>
      <Hero />

      <section className="section container">
        <h2 className="sr-only">The three pillars</h2>
        <PillarsGrid />
      </section>

      <section className="section container">
        <SectionHeader
          eyebrow="Training log"
          title="Latest runs"
          linkTo="/running"
          linkLabel="See all runs"
        />
        <div className="card-grid">
          {latestRuns.map((run) => (
            <RunCard run={run} key={run.id} />
          ))}
        </div>
      </section>

      <section className="section container">
        <SectionHeader
          eyebrow="From the kitchen"
          title="Latest recipes"
          linkTo="/cooking"
          linkLabel="See all recipes"
        />
        <div className="card-grid">
          {latestRecipes.map((recipe) => (
            <RecipeCard recipe={recipe} key={recipe.id} />
          ))}
        </div>
      </section>

      <section className="section container">
        <SectionHeader eyebrow="From the blog" title="Latest post" />
        <FeaturedPost post={latestPost} />
      </section>
    </>
  );
}

export default Home;
