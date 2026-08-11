import { Link } from "react-router-dom";
import "./FeaturedPost.css";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

/**
 * Larger single-post preview used on the homepage to spotlight
 * the latest blog entry.
 */
function FeaturedPost({ post }) {
  const { title, category, date, readTime, excerpt } = post;

  return (
    <article className="featured-post">
      <span className="eyebrow">{category}</span>
      <h3 className="featured-post__title">{title}</h3>
      <p className="featured-post__excerpt">{excerpt}</p>
      <div className="featured-post__footer">
        <span className="card__meta">
          {dateFormatter.format(new Date(date))} · {readTime}
        </span>
        <Link to="/blog" className="link-more">
          Read the post
        </Link>
      </div>
    </article>
  );
}

export default FeaturedPost;
