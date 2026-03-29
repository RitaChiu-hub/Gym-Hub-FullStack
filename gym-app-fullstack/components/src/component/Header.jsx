import Nav from "./Nav";
import { useAuth } from "../context/AuthContext";

function Header({ currentPage, setCurrentPage }) {
  const { user, logout } = useAuth();

  return (
    <header className="site-header">
      <div className="header-brand">
        <h1 className="site-title">IronPeak Gym</h1>
        <p className="site-tagline">Push Your Limits Every Day</p>
      </div>

      <Nav currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {user && (
        <div className="header-user">
          <span className={`user-badge user-badge--${user.role}`}>
            {user.role === "trainer" ? "Trainer" : user.role === "admin" ? "Admin" : "Member"}
          </span>
          <button
            className="user-name-btn"
            onClick={() => setCurrentPage("profile")}
            title="View profile"
          >
            {user.username}
          </button>
          <button className="nav-btn logout-btn" onClick={logout}>
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;