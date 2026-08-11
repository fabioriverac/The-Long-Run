import PillarsGrid from "../components/PillarsGrid.jsx";
import "./About.css";

function About() {
  return (
    <>
      <section className="page-header container">
        <span className="eyebrow">About</span>
        <h1>Becoming Self</h1>
        <p className="page-header__lede">
          This is a personal record of building a life around three things I
          care about: showing up for training, cooking food I'm proud of, and
          paying attention to the habits that quietly decide everything else.
        </p>
      </section>

      <section className="section container about__body">
        <p>
          Becoming Self started as a training log and grew into something
          wider. Chasing a sub-3 hour marathon takes more than mileage — it
          takes sleep, food, and a mind that doesn't quit on a bad day. So
          this site holds all three: the runs, the recipes, and the notes on
          staying consistent when nothing about it feels dramatic.
        </p>
        <p>
          There's no single finish line here. Just a long run, told in
          public, one week at a time.
        </p>
      </section>

      <section className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">The three pillars</span>
            <h2>What this site covers</h2>
          </div>
        </div>
        <PillarsGrid />
      </section>
    </>
  );
}

export default About;
