import Card from "./Card.jsx";
import { formatDate } from "../utils/formatDate.js";

function PostCard({ post }) {
  const { slug, title, category, date, readTime, excerpt } = post;

  return (
    <Card
      to={`/blog/${slug}`}
      tag={category}
      title={title}
      meta={[formatDate(date, { month: "short", day: "numeric", year: "numeric" }), readTime]}
      excerpt={excerpt}
    />
  );
}

export default PostCard;
