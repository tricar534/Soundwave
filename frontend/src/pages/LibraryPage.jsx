import PageHeader from "../components/PageHeader";

function LibraryPage() {
  return (
    <div className="page">
      <PageHeader
        title="Your Library"
        description="Your saved music will appear here."
      />

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