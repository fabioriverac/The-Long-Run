import { Link } from "react-router-dom";
import "./Card.css";

/**
 * Shared presentational card behind RunCard, RecipeCard, and PostCard (the
 * compact grid layout every list page uses) and FeaturedPost (a larger
 * "featured" variant Home uses to spotlight the latest post). Those four
 * were four near-identical copies of the same tag/title/meta/excerpt
 * structure with minor per-type differences — this is the one place that
 * structure lives now. Card itself knows nothing about runs, recipes, or
 * posts; each wrapper maps its own domain object onto these display props.
 *
 * @param {string} [to] - detail-page path; makes the whole card a link.
 *   Omit for content with no detail page (runs).
 * @param {string} [tag] - small label (run type / recipe category / post
 *   category).
 * @param {"olive"|"clay"} [tagVariant] - pill color for the grid variant's
 *   tag; the featured variant always renders its tag as an eyebrow instead.
 * @param {string} title
 * @param {Array<import("react").ReactNode>} [meta] - short meta
 *   items (date, distance, pace, read time, …), rendered as a gapped row.
 *   Callers decide the shape: several discrete items (grid cards) or one
 *   pre-joined string (featured's "date · read time").
 * @param {string} [excerpt]
 * @param {string} [linkLabel] - CTA text for the featured variant's
 *   separate "read more" link, shown alongside the meta row.
 * @param {boolean} [featured] - larger spotlight layout instead of the
 *   compact grid-card layout.
 */
function Card({ to, tag, tagVariant = "olive", title, meta = [], excerpt, linkLabel, featured = false }) {
  const metaRow = meta.length > 0 && (
    <div className="card__meta">
      {meta.map((item, index) => (
        <span key={index}>{item}</span>
      ))}
    </div>
  );

  if (featured) {
    return (
      <article className="card card--featured">
        {tag && <span className="eyebrow">{tag}</span>}
        <h3 className="card__title card__title--featured">{title}</h3>
        {excerpt && <p className="card__excerpt card__excerpt--featured">{excerpt}</p>}
        <div className="card__footer">
          {metaRow}
          {to && (
            <Link to={to} className="link-more">
              {linkLabel}
            </Link>
          )}
        </div>
      </article>
    );
  }

  const content = (
    <>
      {tag && (
        <span className={`card__tag ${tagVariant === "clay" ? "card__tag--clay" : ""}`}>{tag}</span>
      )}
      <h3 className="card__title">{title}</h3>
      {metaRow}
      {excerpt && <p className="card__excerpt">{excerpt}</p>}
    </>
  );

  return to ? (
    <Link to={to} className="card">
      {content}
    </Link>
  ) : (
    <article className="card">{content}</article>
  );
}

export default Card;
