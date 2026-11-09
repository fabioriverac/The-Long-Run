import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <Link to="/" className="footer__brand">
            <img src="/the-long-run-logo.svg" alt="The Long Run" />
          </Link>
          <p className="footer__tagline">
            Miles, meals, and the habits in between.
          </p>
        </div>
        <p className="footer__meta">
          © {year} The Long Run. Built one honest week at a time.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
