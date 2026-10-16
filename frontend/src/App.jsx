import { useState } from "react";
import Sidebar from "./components/Sidebar";
import PlaybackBar from "./components/PlaybackBar";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import LibraryPage from "./pages/LibraryPage";
import "./styles/app.css";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [currentTrack, setCurrentTrack] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  function handleHomeSearch(query) {
    setSearchQuery(query);
    setCurrentPage("search");
  }

  function renderPage() {
    switch (currentPage) {
      case "search":
        return (<SearchPage
          onSelectTrack={setCurrentTrack}
          initialQuery={searchQuery}
        />);

      case "library":
        return <LibraryPage />;

      case "home":
      default:
        return (
          <HomePage
            onSelectTrack={setCurrentTrack}
            onOpenSearch={handleHomeSearch}
          />
        );
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

      <PlaybackBar currentTrack={currentTrack} />
    </div>
  );
}

export default App;
