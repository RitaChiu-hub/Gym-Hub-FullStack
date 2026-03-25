import { useState } from "react";
import Button from "./Button";

const classes = [
  {
    id: "yoga",
    title: "Yoga Flow",
    description:
      "Find your balance and calm with our Yoga Flow class. Improve flexibility and reduce stress through guided breathing and posture work.",
    schedule: "Mon / Wed / Fri — 7:00 AM",
    linkToPage: "panels",
    linkLabel: "See Our Facilities →",
  },
  {
    id: "hiit",
    title: "HIIT Training",
    description:
      "Push your limits with High-Intensity Interval Training. Burn calories fast with 45-minute sessions that combine cardio and strength.",
    schedule: "Tue / Thu — 6:00 PM",
    linkToPage: "panels",
    linkLabel: "See Our Facilities →",
  },
  {
    id: "boxing",
    title: "Boxing Fundamentals",
    description:
      "Learn proper technique, footwork, and combinations in a high-energy group setting. Great for stress relief and full-body conditioning.",
    schedule: "Mon / Wed — 7:00 PM",
    linkToPage: "panels",
    linkLabel: "See Our Facilities →",
  },
  {
    id: "cycling",
    title: "Spin Cycling",
    description:
      "An intense cardio cycling class set to high-energy music. Our certified instructors will guide you through hills and sprints.",
    schedule: "Sat / Sun — 9:00 AM",
    linkToPage: "panels",
    linkLabel: "See Our Facilities →",
  },
];

function ClassCard({ gymClass, setCurrentPage }) {
  const [joined, setJoined] = useState(false);

  const handleJoin = () => {
    setJoined(!joined); 
  };

  return (
    <article className="class-card">
      <h3 className="card-title">{gymClass.title}</h3>
      <p className="card-description">{gymClass.description}</p>
      <p className="card-schedule">
        <strong>Schedule:</strong> {gymClass.schedule}
      </p>
      <div className="card-actions">
        <Button type="button" visual="button" onClick={handleJoin}>
          Join Class
        </Button>
        {joined && (
          <p className="card-feedback" role="status">
            You joined {gymClass.title}!
          </p>
        )}
        {gymClass.linkToPage && (
          <button
            className="btn-link"
            onClick={() => setCurrentPage(gymClass.linkToPage)}
          >
            {gymClass.linkLabel}
          </button>
        )}
      </div>
    </article>
  );
}

function CardsPage({ setCurrentPage }) {
  return (
    <section className="cards-page">
      <h2 className="page-heading">Our Classes</h2>
      <p className="page-subheading">
        Find the class that fits your lifestyle. All levels welcome.
      </p>
      <ul className="cards-list">
        {classes.map((gymClass) => (
          <li key={gymClass.id}>
            <ClassCard gymClass={gymClass} setCurrentPage={setCurrentPage} />
          </li>
        ))}
      </ul>
    </section>
  );
}

export default CardsPage;