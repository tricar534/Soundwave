import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import EmptyState from "./EmptyState";

// SW-95: EmptyState user-facing message tests.

describe("EmptyState", () => {
  it("renders the provided title and message", () => {
    render(
      <EmptyState
        title="No saved music yet"
        message="Saved music will appear here."
      />
    );

    expect(screen.getByText("No saved music yet")).toBeInTheDocument();
    expect(
      screen.getByText("Saved music will appear here.")
    ).toBeInTheDocument();
  });

  it("renders the title as a level-3 heading", () => {
    render(
      <EmptyState
        title="No saved music yet"
        message="Saved music will appear here."
      />
    );

    expect(
      screen.getByRole("heading", { level: 3, name: "No saved music yet" })
    ).toBeInTheDocument();
  });

  it("displays the Library page's no-content message", () => {
    // Same copy LibraryPage passes in, verified at the component level.
    render(
      <EmptyState
        title="No saved music yet"
        message="Albums, songs, artists, and playlists will appear here once they are added."
      />
    );

    expect(
      screen.getByText(
        "Albums, songs, artists, and playlists will appear here once they are added."
      )
    ).toBeInTheDocument();
  });

  it.each([
    ["No playlists yet", "Create a playlist to see it here."],
    ["Nothing played recently", "Songs you play will show up here."],
  ])("renders arbitrary empty-state copy (%s)", (title, message) => {
    render(<EmptyState title={title} message={message} />);

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it("renders only the title and message, with no media content", () => {
    const { container } = render(
      <EmptyState title="No saved music yet" message="Nothing here." />
    );

    const root = container.querySelector(".empty-state");

    expect(root.children).toHaveLength(2);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
