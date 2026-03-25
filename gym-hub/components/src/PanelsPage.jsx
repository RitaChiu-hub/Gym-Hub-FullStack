import { useState } from "react";
import Button from "./Button";

const panels = [
  {
    id: "equipment",
    title: "World-Class Equipment",
    description:
      "Our gym features over 200 pieces of premium equipment — from free weights and cable machines to cardio zones and turf areas. Everything is regularly maintained and updated.",
    imageSrc: "/images/equipment.jpg",
    imageAlt: "Rows of dumbbells and weight equipment at IronPeak Gym",
  },
  {
    id: "trainers",
    title: "Certified Personal Trainers",
    description:
      "Our team of 20+ certified trainers specializes in strength, mobility, weight loss, and sports performance. Book a free consultation to get your personalized plan.",
    imageSrc: "/images/trainers.jpg",
    imageAlt: "A personal trainer helping a member with proper form",
  },
  {
    id: "nutrition",
    title: "Nutrition Bar & Lounge",
    description:
      "Fuel your workout at our in-house nutrition bar. We offer protein shakes, fresh smoothies, and healthy snacks to power your recovery after every session.",
    imageSrc: "/images/nutrition.jpg",
    imageAlt: "A healthy smoothie and nutrition snacks at the IronPeak nutrition bar",
  },
];

function Panel({ panel, reversed }) {
  const [clicked, setClicked] = useState(false);

  return (
    <article className={`facility-panel ${reversed ? "facility-panel--reversed" : ""}`}>
      <img
        className="panel-image"
        src={panel.imageSrc}
        alt={panel.imageAlt}
      />
      <div className="panel-content">
        <h3 className="panel-title">{panel.title}</h3>
        <p className="panel-description">{panel.description}</p>
        <Button
          type="button"
          visual="link"
          onClick={() => setClicked(!clicked)}
        >
          Learn More
        </Button>
        {clicked && (
          <p className="panel-feedback" role="status">
            More details about {panel.title} coming soon!
          </p>
        )}
      </div>
    </article>
  );
}

function PanelsPage() {
  return (
    <section className="panels-page">
      <h2 className="page-heading">Our Facilities</h2>
      <p className="page-subheading">
        Everything you need for your best workout, all under one roof.
      </p>
      <div className="panels-list">
        {panels.map((panel, index) => (
          <Panel key={panel.id} panel={panel} reversed={index % 2 !== 0} />
        ))}
      </div>
    </section>
  );
}

export default PanelsPage;