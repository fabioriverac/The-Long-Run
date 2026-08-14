import { describe, expect, it } from "vitest";
import recipes from "./recipes.js";
import { getAllRecipes, getRecipeBySlug } from "./recipesRepository.js";

describe("getAllRecipes", () => {
  it("returns every recipe", () => {
    expect(getAllRecipes()).toBe(recipes);
    expect(getAllRecipes()).toHaveLength(3);
  });
});

describe("getRecipeBySlug", () => {
  it("finds a recipe by its slug", () => {
    const recipe = getRecipeBySlug("brown-butter-miso-pasta");
    expect(recipe).toBeDefined();
    expect(recipe.title).toBe("Brown butter miso pasta");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getRecipeBySlug("does-not-exist")).toBeUndefined();
  });
});

describe("recipes data integrity", () => {
  it("every recipe has a unique, non-empty slug", () => {
    const slugs = recipes.map((r) => r.slug);
    expect(slugs.every((s) => typeof s === "string" && s.length > 0)).toBe(true);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every recipe has a non-empty body distinct from its excerpt", () => {
    for (const recipe of recipes) {
      expect(Array.isArray(recipe.body)).toBe(true);
      expect(recipe.body.length).toBeGreaterThan(0);
      expect(recipe.body.every((p) => typeof p === "string" && p.length > 0)).toBe(true);
      expect(recipe.body.join(" ")).not.toBe(recipe.excerpt);
    }
  });
});
