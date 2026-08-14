import Card from "./Card.jsx";
import { formatDate } from "../utils/formatDate.js";

/**
 * Larger single-post preview used on the homepage to spotlight
 * the latest blog entry.
 */
function FeaturedPost({ post }) {
  const { slug, title, category, date, readTime, excerpt } = post;

  return (
    <Card
      featured
      to={`/blog/${slug}`}
      linkLabel="Read the post"
      tag={category}
      title={title}
      excerpt={excerpt}
      meta={[`${formatDate(date, { month: "long", day: "numeric", year: "numeric" })} · ${readTime}`]}
    />
  );
}

export default FeaturedPost;
