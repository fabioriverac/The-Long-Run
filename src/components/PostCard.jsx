import { Link } from "react-router-dom";
import "./Cards.css";
import { formatDate } from "../utils/formatDate.js";

function PostCard({ post }) {
  const { slug, title, category, date, readTime, excerpt } = post;

  return (
    <Link to={`/blog/${slug}`} className="card">
      <span className="card__tag">{category}</span>
      <h3 className="card__title">{title}</h3>
      <div className="card__meta">
        <span>
          {formatDate(date, { month: "short", day: "numeric", year: "numeric" })}
        </span>
        <span>{readTime}</span>
      </div>
      <p className="card__excerpt">{excerpt}</p>
    </Link>
  );
}

export default PostCard;
