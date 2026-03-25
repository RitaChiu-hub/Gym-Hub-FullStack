import Nav from "./Nav";

function Header({ currentPage, setCurrentPage }) {
  return (
    <header className="site-header">
      <div className="header-brand">
        <h1 className="site-title">IronPeak Gym</h1>
        <p className="site-tagline">Push Your Limits Every Day</p>
      </div>
      <Nav currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </header>
  );
}

export default Header;