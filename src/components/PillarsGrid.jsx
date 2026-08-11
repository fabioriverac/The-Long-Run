import { Link } from "react-router-dom";
import pillars from "../data/pillars.js";
import "./PillarsGrid.css";

function PillarsGrid() {
  return (
    <div className="pillars-grid">
      {pillars.map((pillar) => (
        <Link to={pillar.path} key={pillar.id} className="pillar">
          <span className="eyebrow">{pillar.label}</span>
          <h3 className="pillar__title">{pillar.title}</h3>
          <p className="pillar__description">{pillar.description}</p>
          <span className="link-more">{pillar.cta}</span>
        </Link>
      ))}
    </div>
  );
}

export default PillarsGrid;
