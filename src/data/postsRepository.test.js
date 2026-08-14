import { describe, expect, it } from "vitest";
import posts from "./posts.js";
import { getAllPosts, getPostBySlug } from "./postsRepository.js";

describe("getAllPosts", () => {
  it("returns every post", () => {
    expect(getAllPosts()).toBe(posts);
    expect(getAllPosts()).toHaveLength(3);
  });
});

describe("getPostBySlug", () => {
  it("finds a post by its slug", () => {
    const post = getPostBySlug("twelve-weeks-of-consistency");
    expect(post).toBeDefined();
    expect(post.title).toBe("What twelve weeks of consistency actually looks like");
  });

  it("returns undefined for an unknown slug", () => {
    expect(getPostBySlug("does-not-exist")).toBeUndefined();
  });
});

describe("posts data integrity", () => {
  it("every post has a unique, non-empty slug", () => {
    const slugs = posts.map((p) => p.slug);
    expect(slugs.every((s) => typeof s === "string" && s.length > 0)).toBe(true);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every post has a non-empty body distinct from its excerpt", () => {
    for (const post of posts) {
      expect(Array.isArray(post.body)).toBe(true);
      expect(post.body.length).toBeGreaterThan(0);
      expect(post.body.every((p) => typeof p === "string" && p.length > 0)).toBe(true);
      expect(post.body.join(" ")).not.toBe(post.excerpt);
    }
  });
});
