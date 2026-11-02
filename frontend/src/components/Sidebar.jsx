import ApiStatus from "./ApiStatus";

const navigationItems = [
  {
    id: "home",
    label: "Home",
  },
  {
    id: "search",
    label: "Search",
  },
  {
    id: "library",
    label: "Library",
  },
];

function Sidebar({ currentPage, onNavigate, authenticatedUser = null, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>Soundwave</h1>
      </div>

      <nav aria-label="Main navigation">
        <ul className="sidebar-nav">
          {navigationItems.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={
                  currentPage === item.id
                    ? "nav-button active"
                    : "nav-button"
                }
                onClick={() => onNavigate(item.id)}
                aria-current={
                  currentPage === item.id ? "page" : undefined
                }
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-bottom">
        {authenticatedUser ? (
          <div className="sidebar-auth" aria-label="Account status">
            <p className="sidebar-auth-user">Signed in as {authenticatedUser.displayName}</p>
            <button type="button" className="nav-button" onClick={onLogout}>
              Sign out
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={currentPage === "login" ? "nav-button active" : "nav-button"}
            onClick={() => onNavigate("login")}
            aria-current={currentPage === "login" ? "page" : undefined}
          >
            Sign in
          </button>
        )}

          <div className="sidebar-status">
            <ApiStatus />
          </div>

        <button type="button" className="nav-button">
          Settings
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;