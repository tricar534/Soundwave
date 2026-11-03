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
  // The Library is the only protected view for this sprint's frontend guard.
  // Home and Search remain public, and no React Router is used in this app.
  const [intendedPage, setIntendedPage] = useState(null);

  function handleNavigate(page) {
    if (page === "library" && !authenticatedUser) {
      setIntendedPage("library");
      setCurrentPage("login");
      return;
    }

    // Leaving Sign in cancels an old redirect, so a later login does not
    // unexpectedly return someone to a page they no longer requested.
    setIntendedPage(null);
    setCurrentPage(page);
  }

  async function handleLogin(credentials) {
    const response = await login(credentials);
    // Do not mark a user signed in merely because an HTTP request succeeded.
    const user = extractAuthenticatedUser(response);
    setAuthenticatedUser(user);
    setCurrentPage(intendedPage === "library" ? "library" : "home");
    setIntendedPage(null);
    return response;
  }

  function handleLogout() {
    // UI-only logout until the backend exposes an approved session-revocation endpoint.
    setAuthenticatedUser(null);
    setIntendedPage(null);
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
        // Defense in depth if another navigation path sets the page directly.
        return authenticatedUser ? <LibraryPage /> : (
          <LoginPage onLogin={handleLogin} accessMessage="Sign in to access your Library." />
        );

      case "login":
        return <LoginPage
          onLogin={handleLogin}
          accessMessage={intendedPage === "library" ? "Sign in to access your Library." : ""}
        />;

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
        onNavigate={handleNavigate}
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
