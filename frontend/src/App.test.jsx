
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import * as api from "./services/api";
import { mockTracks } from "./test/apiMocks";

// SW-220: Mock API responses so navigation tests do not
// require a running backend or PostgreSQL database.
vi.mock("./services/api");

beforeEach(() => {
  mockTracks.success();
  vi.mocked(api.getHealth).mockResolvedValue({ status: "ok" });
});

describe("App search navigation", () => {
  // SW-220: Verify unfinished Home searches survive navigation.
  it("preserves Home search input after visiting Library", () => {
    render(<App />);

    const homeInput = screen.getByRole("searchbox", {
      name: "Search music",
    });

    // Type without submitting the search.
    fireEvent.change(homeInput, {
      target: { value: "hello" },
    });

    // Leave Home and return.
    fireEvent.click(screen.getByRole("button", { name: "Library" }));
    fireEvent.click(screen.getByRole("button", { name: "Home" }));

    // App should restore the unfinished search draft.
    expect(
      screen.getByRole("searchbox", { name: "Search music" })
    ).toHaveValue("hello");
  });

  // SW-220: Verify query submission and Search input persistence.
  it("submits Home search and preserves Search input", async () => {
    render(<App />);

    const homeInput = screen.getByRole("searchbox", {
      name: "Search music",
    });

    // Enter a query on Home and submit it.
    fireEvent.change(homeInput, {
      target: { value: "Real" },
    });

    fireEvent.submit(homeInput.closest("form"));

    // Search opens with the submitted query.
    const searchInput = screen.getByPlaceholderText("Search Soundwave");
    expect(searchInput).toHaveValue("Real");

    // The matching backend fixture track should appear.
    expect(await screen.findByText("Real Track")).toBeInTheDocument();

    // Edit the query directly on Search.
    fireEvent.change(searchInput, {
      target: { value: "unknown" },
    });

    expect(
      screen.getByText("No songs, artists, or playlists found.")
    ).toBeInTheDocument();

    // Navigate away from Search and return.
    fireEvent.click(screen.getByRole("button", { name: "Library" }));
    fireEvent.click(screen.getByRole("button", { name: "Search" }));

    // The edited Search query should be preserved.
    expect(
      screen.getByPlaceholderText("Search Soundwave")
    ).toHaveValue("unknown");

    // Submitting another Home query should replace it.
    fireEvent.click(screen.getByRole("button", { name: "Home" }));

    const restoredHomeInput = screen.getByRole("searchbox", {
      name: "Search music",
    });

    fireEvent.change(restoredHomeInput, {
      target: { value: "Real" },
    });

    fireEvent.submit(restoredHomeInput.closest("form"));

    expect(
      screen.getByPlaceholderText("Search Soundwave")
    ).toHaveValue("Real");

    expect(await screen.findByText("Real Track")).toBeInTheDocument();
  });
});
