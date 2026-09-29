import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LibraryPage from "./LibraryPage";

describe("LibraryPage", () => {
  it("renders the Library page header", () => {
    render(<LibraryPage />);

    expect(
      screen.getByText("Your Library")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Your saved music will appear here.")
    ).toBeInTheDocument();
  });

  it("renders the empty library state", () => {
    render(<LibraryPage />);

    expect(
      screen.getByText("No saved music yet")
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Albums, songs, artists, and playlists will appear here once they are added."
      )
    ).toBeInTheDocument();
  });
});