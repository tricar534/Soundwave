import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SearchPage from "./SearchPage";
import * as api from "../services/api";
import {
  mockTracks,
  mockSearch,
  silenceConsoleError,
} from "../test/apiMocks";

// SW-MS: SearchPage now loads the browse catalog via getTracks (SW-97
// fixtures) and runs real searches via GET /api/search (new mockSearch
// fixtures), instead of filtering the catalog in the browser against a
// hardcoded sample-data fallback.

vi.mock("../services/api");

const CATALOG_LOADING = "Loading catalog...";
const CATALOG_EMPTY = "No tracks in the catalog yet.";
const CATALOG_UNAVAILABLE = "Backend unavailable. Please try again later.";
const SEARCHING = "Searching...";
const SEARCH_ERROR = "Search failed. Please try again.";
const NO_RESULTS = "No songs, artists, or playlists found.";

function search(value) {
  fireEvent.change(screen.getByPlaceholderText("Search Soundwave"), {
    target: { value },
  });
}

const realTrack = {
  id: "101",
  albumId: "1",
  title: "Real Track",
  trackNumber: 1,
  durationMs: 200000,
  isAvailable: true,
};

describe("SearchPage", () => {
  describe("catalog browse view (no active query)", () => {
    // MS-REG-02: catalog loading state still shown before getTracks resolves.
    it("shows the loading message while getTracks is pending", async () => {
      vi.mocked(api.getTracks).mockReturnValue(new Promise(() => {}));

      render(<SearchPage />);

      expect(screen.getByText(CATALOG_LOADING)).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Search" })
      ).toBeInTheDocument();
    });

    // MS-REG-01: full catalog still loads via getTracks when there is no query.
    it("displays backend tracks once getTracks resolves", async () => {
      mockTracks.success();

      render(<SearchPage />);

      expect(await screen.findByText("Real Track")).toBeInTheDocument();
      expect(screen.queryByText(CATALOG_LOADING)).not.toBeInTheDocument();
    });

    // MS-REG-03: catalog empty state still shown when there are no real tracks.
    it("shows the empty-catalog status when getTracks returns no tracks", async () => {
      mockTracks.empty();

      render(<SearchPage />);

      expect(await screen.findByText(CATALOG_EMPTY)).toBeInTheDocument();
      expect(screen.queryByText(CATALOG_LOADING)).not.toBeInTheDocument();
    });

    // MS-REG-04: catalog unavailable state still shown on a real backend
    // failure (SW-MS: no more silent fallback to fake sample tracks).
    it("shows the unavailable status on an HTTP error, with no sample content", async () => {
      const consoleError = silenceConsoleError();
      mockTracks.httpError(500);

      render(<SearchPage />);

      expect(await screen.findByText(CATALOG_UNAVAILABLE)).toBeInTheDocument();
      expect(screen.queryByText("Midnight Drive")).not.toBeInTheDocument();
      expect(consoleError).toHaveBeenCalled();
    });

    it("shows the unavailable status on a network failure, with no sample content", async () => {
      const consoleError = silenceConsoleError();
      mockTracks.networkFailure();

      render(<SearchPage />);

      expect(await screen.findByText(CATALOG_UNAVAILABLE)).toBeInTheDocument();
      expect(screen.queryByText("Chill Waves")).not.toBeInTheDocument();
      expect(consoleError).toHaveBeenCalled();
    });

    // MS-REG-05: selecting a track from the catalog still notifies the parent.
    it("allows selecting a real backend track from the catalog", async () => {
      mockTracks.success();
      const onSelectTrack = vi.fn();

      render(<SearchPage onSelectTrack={onSelectTrack} />);

      const track = await screen.findByText("Real Track");
      fireEvent.click(track);

      expect(onSelectTrack).toHaveBeenCalledTimes(1);
      expect(onSelectTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "101",
          title: "Real Track",
          subtitle: "Soundwave",
          type: "Song",
        })
      );
    });

    // MS-REG-06: initialQuery (SW-220) still seeds the input and still
    // triggers a real search rather than a client-side filter.
    it("runs a real search immediately when initialQuery is set", async () => {
      mockTracks.success();
      mockSearch.success([realTrack]);

      render(<SearchPage initialQuery="Real" />);

      expect(
        screen.getByPlaceholderText("Search Soundwave")
      ).toHaveValue("Real");

      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(await screen.findByText("Real Track")).toBeInTheDocument();
      expect(api.searchTracks).toHaveBeenCalledWith("Real");
    });
  });

  describe("active search (GET /api/search)", () => {
    // MS-INT-01: typing a query calls the backend search endpoint and
    // renders the tracks it returns.
    it("calls searchTracks and renders matching tracks for a valid query", async () => {
      mockTracks.success();
      mockSearch.success([realTrack]);

      render(<SearchPage />);
      await screen.findByText("Real Track");

      search("midnight");
      expect(screen.getByText(SEARCHING)).toBeInTheDocument();

      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(await screen.findByText("Real Track")).toBeInTheDocument();
      expect(api.searchTracks).toHaveBeenCalledWith("midnight");
    });

    // MS-INT-02: a nonexistent query returns a true empty state, not
    // fake sample data.
    it("shows a true empty state for a nonexistent query", async () => {
      mockTracks.success();
      mockSearch.empty();

      render(<SearchPage />);
      await screen.findByText("Real Track");

      search("zzznosuchtrack491");
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(await screen.findByText(NO_RESULTS)).toBeInTheDocument();
      expect(screen.queryByText("Real Track")).not.toBeInTheDocument();
      expect(api.searchTracks).toHaveBeenCalledWith("zzznosuchtrack491");
    });

    // MS-INT-03: clearing the query returns to the full catalog view
    // instead of an empty filtered list.
    it("returns to the full catalog view when the query is cleared", async () => {
      mockTracks.success();
      mockSearch.empty();

      render(<SearchPage />);
      await screen.findByText("Real Track");

      search("zzznosuchtrack491");
      await new Promise((resolve) => setTimeout(resolve, 350));
      await screen.findByText(NO_RESULTS);

      search("");

      expect(await screen.findByText("Real Track")).toBeInTheDocument();
      expect(screen.queryByText(NO_RESULTS)).not.toBeInTheDocument();
    });

    // MS-INT-04: a failed backend search shows a real error state, not
    // fake sample data (the SW-MS fallback-removal requirement).
    it("shows a search error state when the backend search fails, with no sample content", async () => {
      const consoleError = silenceConsoleError();
      mockTracks.success();
      mockSearch.httpError(500);

      render(<SearchPage />);
      await screen.findByText("Real Track");

      search("midnight");
      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(await screen.findByText(SEARCH_ERROR)).toBeInTheDocument();
      expect(screen.queryByText("Midnight Drive")).not.toBeInTheDocument();
      expect(consoleError).toHaveBeenCalled();
    });

    // MS-INT-05: rapid typing debounces to a single backend call rather
    // than one request per keystroke.
    it("debounces rapid typing into a single search call", async () => {
      mockTracks.success();
      mockSearch.success([realTrack]);

      render(<SearchPage />);
      await screen.findByText("Real Track");

      search("m");
      search("mi");
      search("mid");

      await new Promise((resolve) => setTimeout(resolve, 350));

      expect(api.searchTracks).toHaveBeenCalledTimes(1);
      expect(api.searchTracks).toHaveBeenCalledWith("mid");
    });

    // SW-220 regression: Search still reports input changes to App.
    it("reports Search input changes to App", async () => {
      mockTracks.success();
      mockSearch.empty();
      const onQueryChange = vi.fn();

      render(<SearchPage onQueryChange={onQueryChange} />);
      await screen.findByText("Real Track");

      search("Signal");

      expect(onQueryChange).toHaveBeenCalledWith("Signal");
    });
  });
});
