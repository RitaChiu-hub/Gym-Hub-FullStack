import { useState } from "react";
import Button from "./Button";
import Modal from "./Modal";

function TextPage({ setCurrentPage }) {
  const [clicked, setClicked] = useState(false);

  const handleLearnMore = () => {
    setClicked(!clicked); 
  };

  return (
    <article className="text-page">
      <section className="about-intro">
        <h2>About IronPeak Gym</h2>
        <p>
          Founded in 2010, IronPeak Gym has been Boston's premier fitness
          destination for over a decade. We believe that fitness is not just
          a habit — it's a lifestyle. Our state-of-the-art facility is
          designed to help you reach your goals, whether you're a beginner
          or a seasoned athlete.
        </p>
      </section>

      <section className="about-mission">
        <h2>Our Mission</h2>
        <p>
          Our mission is simple: to empower every member to become the
          strongest version of themselves. We provide world-class equipment,
          certified personal trainers, and a supportive community that
          pushes you to achieve more every single day.
        </p>
        <p>
          We are committed to inclusivity — every body type, every fitness
          level, every goal is welcome at IronPeak. We celebrate progress,
          not perfection.
        </p>
      </section>

      <section className="about-values">
        <h2>Our Values</h2>
        <ul className="values-list">
          <li>
            <strong>Community:</strong> We grow stronger together.
          </li>
          <li>
            <strong>Consistency:</strong> Show up. Every. Day.
          </li>
          <li>
            <strong>Coaching:</strong> Expert guidance at every step.
          </li>
          <li>
            <strong>Commitment:</strong> We are here for your long-term
            success.
          </li>
        </ul>
      </section>

      <section className="about-actions">
        <Button type="button" visual="button" onClick={handleLearnMore}>
          Learn More About Our Story
        </Button>

        {clicked && (
          <p className="click-feedback" role="status">
            IronPeak was started by two former college athletes who
            wanted to bring elite-level training to everyday people.
            Today we serve over 2,000 members!
          </p>
        )}

        <Modal />
      </section>
    </article>
  );
}

export default TextPage;