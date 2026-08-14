import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import "./Navbar.css";

const links = [
  { to: "/", label: "Home" },
  { to: "/running", label: "Running" },
  { to: "/cooking", label: "Cooking" },
  { to: "/blog", label: "Blog" },
  { to: "/about", label: "About" },
];

const NAV_ID = "navbar-links";

function Navbar() {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef(null);

  // Close on Escape and return focus to the toggle button, matching the
  // standard disclosure-menu keyboard pattern — without this, a keyboard
  // user who opens the mobile menu has no way to dismiss it but tabbing
  // through every link first.
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <NavLink to="/" className="navbar__brand" onClick={() => setOpen(false)}>
          The Long Run
        </NavLink>

        <button
          ref={toggleRef}
          type="button"
          className="navbar__toggle"
          aria-expanded={open}
          aria-controls={NAV_ID}
          aria-label="Toggle navigation"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav id={NAV_ID} className={`navbar__links ${open ? "navbar__links--open" : ""}`}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                `navbar__link ${isActive ? "navbar__link--active" : ""}`
              }
              onClick={() => setOpen(false)}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
