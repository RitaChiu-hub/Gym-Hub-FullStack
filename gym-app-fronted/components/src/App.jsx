import { useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ClassesProvider } from "./context/ClassesContext";
import Header from "./component/Header";
import Footer from "./component/Footer";
import TextPage from "./pages/TextPage";
import CardsPage from "./pages/CardsPage";
import PanelsPage from "./pages/PanelsPage";
import ProfilePage from "./pages/ProfilePage";
import LoginPage from "./pages/LoginPage";
import "./App.css";

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState("text");

  if (!user) return <LoginPage />;

  return (
    <>
      <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main>
        {currentPage === "text"    && <TextPage    setCurrentPage={setCurrentPage} />}
        {currentPage === "cards"   && <CardsPage   setCurrentPage={setCurrentPage} />}
        {currentPage === "panels"  && <PanelsPage  setCurrentPage={setCurrentPage} />}
        {currentPage === "profile" && <ProfilePage />}
      </main>
      <Footer />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <ClassesProvider>
        <AppContent />
      </ClassesProvider>
    </AuthProvider>
  );
}

export default App;