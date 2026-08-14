import { Link } from "react-router-dom";
import { useDocumentTitle } from "../hooks/useDocumentTitle.js";

function NotFound() {
  useDocumentTitle("Page not found");
  return (
    <section className="page-header container">
      <span className="eyebrow">404</span>
      <h1>This trail doesn't exist</h1>
      <p className="page-header__lede">
        The page you're looking for took a wrong turn somewhere.
      </p>
      <Link to="/" className="btn btn-primary">
        Back home
      </Link>
    </section>
  );
}

export default NotFound;
