function LibraryPage() {
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Your Library</h2>
          <p>Your saved music will appear here.</p>
        </div>
      </header>

      <section className="empty-state">
        <h3>No saved music yet</h3>
        <p>
          Albums, songs, artists, and playlists
          will appear here once they are added.
        </p>
      </section>
    </div>
  );
}

export default LibraryPage;