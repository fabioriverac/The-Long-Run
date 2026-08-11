import "./Footer.css";

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <p className="footer__brand">Becoming Self</p>
          <p className="footer__tagline">
            Miles, meals, and the habits in between.
          </p>
        </div>
        <p className="footer__meta">
          © {year} Becoming Self. Built one honest week at a time.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
