import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SearchPage from "./SearchPage";

describe("SearchPage", () => {
  it("renders the initial mock search results", () => {
    render(<SearchPage />);

    expect(screen.getByText("Nightfall")).toBeInTheDocument();
    expect(screen.getByText("Night Drive")).toBeInTheDocument();
  });

  it("filters results based on the search query", () => {
    render(<SearchPage />);

    const searchInput = screen.getByPlaceholderText("Search Soundwave");

    fireEvent.change(searchInput, {
      target: { value: "Nightfall" },
    });

    expect(screen.getByText("Nightfall")).toBeInTheDocument();
    expect(screen.queryByText("Night Drive")).not.toBeInTheDocument();
  });
});