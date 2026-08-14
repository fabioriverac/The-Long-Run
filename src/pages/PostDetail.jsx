import { Link, Navigate, useParams } from "react-router-dom";
import { getPostBySlug } from "../data/postsRepository.js";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";
import { formatDate } from "../utils/formatDate.js";
import "./Detail.css";

function PostDetail() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  useDocumentTitle(post?.title);

  // No matching post (bad/stale slug) — back to the list rather than a
  // generic 404, since "post not found, here's every post" is a more
  // useful landing spot than the site-wide not-found page.
  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const { title, category, date, readTime, excerpt, body } = post;

  return (
    <>
      <section className="page-header container">
        <span className="eyebrow">{category}</span>
        <h1>{title}</h1>
        <p className="page-header__lede">{excerpt}</p>
      </section>

      <section className="section container detail__body">
        <p className="detail__meta">
          <span>{formatDate(date, { month: "long", day: "numeric", year: "numeric" })}</span>
          <span>{readTime}</span>
        </p>
        {body.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
        <Link to="/blog" className="link-more detail__back">
          ← All posts
        </Link>
      </section>
    </>
  );
}

export default PostDetail;
