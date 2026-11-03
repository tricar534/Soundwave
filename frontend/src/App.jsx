import { useState } from "react";
import Sidebar from "./components/Sidebar";
import PlaybackBar from "./components/PlaybackBar";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import LibraryPage from "./pages/LibraryPage";
import { login } from "./services/api";
import { extractAuthenticatedUser } from "./auth/authUser";
import LoginPage from "./pages/LoginPage";
import "./styles/app.css";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [currentTrack, setCurrentTrack] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [homeQuery, setHomeQuery] = useState("");
  // In-memory UI state only: no password, token, or session stored in browser storage.
  const [authenticatedUser, setAuthenticatedUser] = useState(null);

  async function handleLogin(credentials) {
    const response = await login(credentials);
    // Do not mark a user signed in merely because an HTTP request succeeded.
    const user = extractAuthenticatedUser(response);
    setAuthenticatedUser(user);
    setCurrentPage("home");
    return response;
  }

  function handleLogout() {
    // UI-only logout until the backend exposes an approved session-revocation endpoint.
    setAuthenticatedUser(null);
    setCurrentPage("login");
  }

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

      case "login":
        return <LoginPage onLogin={handleLogin} />;

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
        authenticatedUser={authenticatedUser}
        onLogout={handleLogout}
      />

      <main className="main-content">
        {renderPage()}
      </main>

      <PlaybackBar currentTrack={currentTrack} />
    </div>
  );
}

export default App;
