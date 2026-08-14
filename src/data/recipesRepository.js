import recipes from "./recipes.js";

// Mock data today, imported directly — but pages depend on this module
// boundary, not on recipes.js itself, so swapping in a real API/CMS later
// only touches this file. Same pattern as runsRepository.js.

/** All recipes, in source order. */
export function getAllRecipes() {
  return recipes;
}

/** A single recipe by slug, or undefined if no recipe has that slug. */
export function getRecipeBySlug(slug) {
  return recipes.find((recipe) => recipe.slug === slug);
}
