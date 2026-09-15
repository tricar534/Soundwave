import { useState } from "react";
import Sidebar from "./components/Sidebar";
import PlaybackBar from "./components/PlaybackBar";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import LibraryPage from "./pages/LibraryPage";
import "./styles/app.css";

function App() {
  const [currentPage, setCurrentPage] = useState("home");

  function renderPage() {
    switch (currentPage) {
      case "search":
        return <SearchPage />;

      case "library":
        return <LibraryPage />;

      case "home":
      default:
        return <HomePage />;
    }
  }

  return (
    <div className="app">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
      />

      <main className="main-content">
        {renderPage()}
      </main>

      <PlaybackBar />
    </div>
  );
}

export default App;