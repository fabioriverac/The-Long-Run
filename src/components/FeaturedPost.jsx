import { Link } from "react-router-dom";
import "./FeaturedPost.css";
import { formatDate } from "../utils/formatDate.js";

/**
 * Larger single-post preview used on the homepage to spotlight
 * the latest blog entry.
 */
function FeaturedPost({ post }) {
  const { slug, title, category, date, readTime, excerpt } = post;

  return (
    <article className="featured-post">
      <span className="eyebrow">{category}</span>
      <h3 className="featured-post__title">{title}</h3>
      <p className="featured-post__excerpt">{excerpt}</p>
      <div className="featured-post__footer">
        <span className="card__meta">
          {formatDate(date, { month: "long", day: "numeric", year: "numeric" })} · {readTime}
        </span>
        <Link to={`/blog/${slug}`} className="link-more">
          Read the post
        </Link>
      </div>
    </article>
  );
}

export default FeaturedPost;
