import { useAuth } from "../context/AuthContext";

function Nav({ currentPage, setCurrentPage }) {
  const { user } = useAuth();

  return (
    <nav className="main-nav" aria-label="Main navigation">
      <ul className="nav-list">
        <li>
          <button
            className={`nav-btn ${currentPage === "text" ? "nav-btn--active" : ""}`}
            onClick={() => setCurrentPage("text")}
          >
            About
          </button>
        </li>
        <li>
          <button
            className={`nav-btn ${currentPage === "cards" ? "nav-btn--active" : ""}`}
            onClick={() => setCurrentPage("cards")}
          >
            Classes
          </button>
        </li>
        <li>
          <button
            className={`nav-btn ${currentPage === "panels" ? "nav-btn--active" : ""}`}
            onClick={() => setCurrentPage("panels")}
          >
            Facilities
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Nav;