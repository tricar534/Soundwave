import PageHeader from "../components/PageHeader";
import EmptyState from "../components/EmptyState";

function LibraryPage() {
  return (
    <div className="page">
      <PageHeader
        title="Your Library"
        description="Your saved music will appear here."
      />

      <EmptyState
        title="No saved music yet"
        message="Albums, songs, artists, and playlists will appear here once they are added."
      />
    </div>
  );
}

export default LibraryPage;