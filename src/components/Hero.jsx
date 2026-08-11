import { Link } from "react-router-dom";
import "./Hero.css";

function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        <span className="eyebrow">Fitness · Cooking · Personal growth</span>
        <h1 className="hero__title">
          Built one honest mile, one good meal, one small habit at a time.
        </h1>
        <p className="hero__subtitle">
          I'm training for a sub-3 hour marathon, cooking my way through a
          crowded pantry, and paying closer attention to the habits that hold
          the rest of it together. This is where I write it all down.
        </p>
        <div className="hero__actions">
          <Link to="/running" className="btn btn-primary">
            Follow the training log
          </Link>
          <Link to="/about" className="btn btn-outline">
            About this project
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Hero;
