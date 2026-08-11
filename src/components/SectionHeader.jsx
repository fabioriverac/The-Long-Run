import { Link } from "react-router-dom";

/**
 * Reusable "eyebrow + title" heading used above content sections,
 * with an optional "see more" link on the right.
 */
function SectionHeader({ eyebrow, title, linkTo, linkLabel }) {
  return (
    <div className="section-head">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
      </div>
      {linkTo && (
        <Link to={linkTo} className="link-more">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export default SectionHeader;
