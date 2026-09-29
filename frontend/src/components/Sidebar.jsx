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

function Sidebar({ currentPage, onNavigate }) {
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
                  currentPage == item.id ? "page" : undefined
                }
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-bottom">
        <button type="button" className="nav-button">
          Settings
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;