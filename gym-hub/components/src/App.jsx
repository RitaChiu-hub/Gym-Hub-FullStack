import { useState } from "react";
import Header from "./Header";
import Footer from "./Footer";
import TextPage from "./TextPage";
import CardsPage from "./CardsPage";
import PanelsPage from "./PanelsPage";
import "./App.css";

function App() {
  const [currentPage, setCurrentPage] = useState("text");

  return (
    <>
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main>
        {currentPage === "text" && (
          <TextPage setCurrentPage={setCurrentPage} />
        )}
        {currentPage === "cards" && (
          <CardsPage setCurrentPage={setCurrentPage} />
        )}
        {currentPage === "panels" && (
          <PanelsPage setCurrentPage={setCurrentPage} />
        )}
      </main>
      <Footer />
    </>
  );
}

export default App;