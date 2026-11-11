import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { useGymData } from "../useGymData.js";

export function Icon({ name }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };
  if (name === "workout") {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3.5v3M16 3.5v3M4 10h16" />
      </svg>
    );
  }
  if (name === "mesos") {
    return (
      <svg {...common}>
        <path d="M4 7.5h6l1.5 2H20v9.5H4z" />
      </svg>
    );
  }
  if (name === "templates") {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="6.5" height="6.5" rx="1.4" />
        <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.4" />
        <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.4" />
        <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.4" />
      </svg>
    );
  }
  if (name === "exercises") {
    return (
      <svg {...common}>
        <path d="M6 9v6M18 9v6M3.5 10.5v3M20.5 10.5v3M6 12h12" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="7" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="17" cy="12" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" aria-hidden="true">
      <path d="M5 12.5 9.2 17 19 7" />
    </svg>
  );
}

const TABS = [
  { to: "/gym", label: "Workout", icon: "workout", end: true },
  { to: "/gym/mesos", label: "Mesos", icon: "mesos" },
  { to: "/gym/templates", label: "Templates", icon: "templates" },
  { to: "/gym/exercises", label: "Exercises", icon: "exercises" },
  { to: "/gym/more", label: "More", icon: "more" },
];

export function TabBar() {
  return (
    <nav className="gym-tabs" aria-label="Gym">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to} end={tab.end} className={({ isActive }) => (isActive ? "is-active" : undefined)}>
          <Icon name={tab.icon} />
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}

export function TopBar() {
  const { view, actions } = useGymData();
  if (!view) return <header className="gym-top" />;
  return (
    <header className="gym-top">
      <div>
        <p className="gym-kicker">The Long Run / Gym</p>
        <p className="gym-logo">meso.</p>
      </div>
      <button type="button" className={`gym-pill ${view.showSample ? "is-on" : ""}`} onClick={() => actions.toggleSample()} aria-pressed={view.showSample}>
        {view.showSample ? "Sample on" : "Sample data"}
      </button>
    </header>
  );
}

export function Sheet({ title, kicker, onClose, children }) {
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event) {
      if (event.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector("button, input, select, textarea")?.focus();
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, []);
  return (
    <div className="gym-sheet-back" onMouseDown={onClose}>
      <div
        className="gym-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={ref}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="gym-sheet__handle" />
        <div className="gym-sheet__head">
          <div>
            {kicker ? <p className="gym-eyebrow">{kicker}</p> : null}
            <h2>{title}</h2>
          </div>
          <button type="button" className="gym-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ChoiceGroup({ label, hint, value, options, onChange, columns }) {
  return (
    <fieldset className="gym-choice">
      <legend>{label}</legend>
      {hint ? <p className="gym-hint">{hint}</p> : null}
      <div className="gym-choice__grid" style={{ gridTemplateColumns: `repeat(${columns || options.length}, minmax(0, 1fr))` }}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={value === option.value ? "is-on" : undefined}
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
