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
  const [homeQuery, setHomeQuery] = useState("");

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
          // Save Search input changes in App so they survive page navigation.
          onQueryChange={setSearchQuery}
        />);

      case "library":
        return <LibraryPage />;

      case "home":
      default:
        return (
          <HomePage
            onSelectTrack={setCurrentTrack}
            onOpenSearch={handleHomeSearch}
            homeQuery={homeQuery}
            onHomeQueryChange={setHomeQuery}
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
