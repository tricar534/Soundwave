import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SearchPage from "./SearchPage";

describe("SearchPage", () => {
  it("renders the initial mock search results", () => {
    render(<SearchPage />);

    expect(screen.getByText("Midnight Drive")).toBeInTheDocument();
    expect(screen.getByText("Chill Waves")).toBeInTheDocument();
  });

  it("filters results based on the search query", () => {
    render(<SearchPage />);

    const searchInput = screen.getByPlaceholderText("Search Soundwave");

    fireEvent.change(searchInput, {
      target: { value: "Midnight" },
    });

    expect(screen.getByText("Midnight Drive")).toBeInTheDocument();
    expect(screen.queryByText("Chill Waves")).not.toBeInTheDocument();
  });
});