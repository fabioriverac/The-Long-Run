import posts from "./posts.js";

// Mock data today, imported directly — but pages depend on this module
// boundary, not on posts.js itself, so swapping in a real API/CMS later
// only touches this file. Same pattern as runsRepository.js.

/** All posts, in source order (most recent first). */
export function getAllPosts() {
  return posts;
}

/** A single post by slug, or undefined if no post has that slug. */
export function getPostBySlug(slug) {
  return posts.find((post) => post.slug === slug);
}
