import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SearchPage from "./SearchPage";
import * as api from "../services/api";
import {
  mockTracks,
  silenceConsoleError,
} from "../test/apiMocks";

// SW-97: SearchPage catalog states (from SW-48) tested with the shared
// SW-96 fixtures. getTracks is always mocked, so no live backend is needed.

vi.mock("../services/api");

const LOADING = "Loading catalog...";
const EMPTY = "Backend catalog is empty. Showing sample content.";
const UNAVAILABLE = "Backend unavailable. Showing sample content.";

function expectSampleContent() {
  expect(screen.getByText("Midnight Drive")).toBeInTheDocument();
  expect(screen.getByText("Chill Waves")).toBeInTheDocument();
  expect(screen.getByText("After Hours")).toBeInTheDocument();
}

function search(value) {
  fireEvent.change(screen.getByPlaceholderText("Search Soundwave"), {
    target: { value },
  });
}

function expectFilteringWorks() {
  search("Midnight");
  expect(screen.getByText("Midnight Drive")).toBeInTheDocument();
  expect(screen.queryByText("Chill Waves")).not.toBeInTheDocument();

  search("zzz-no-match");
  expect(
    screen.getByText("No songs, artists, or playlists found.")
  ).toBeInTheDocument();

  search("");
  expectSampleContent();
}

describe("SearchPage", () => {
  describe("loading state", () => {
    it("shows the loading message while getTracks is pending", () => {
      // A promise that never settles keeps the page in "loading".
      vi.mocked(api.getTracks).mockReturnValue(new Promise(() => {}));

      render(<SearchPage />);

      expect(screen.getByText(LOADING)).toBeInTheDocument();
      expect(screen.queryByText(EMPTY)).not.toBeInTheDocument();
      expect(screen.queryByText(UNAVAILABLE)).not.toBeInTheDocument();
      expectSampleContent();
      expect(api.getTracks).toHaveBeenCalledTimes(1);
    });

    it("still filters while loading", () => {
      vi.mocked(api.getTracks).mockReturnValue(new Promise(() => {}));

      render(<SearchPage />);

      expectFilteringWorks();
    });
  });

  describe("empty catalog", () => {
    it("shows the empty-catalog status and keeps sample content", async () => {
      mockTracks.empty();

      render(<SearchPage />);

      expect(await screen.findByText(EMPTY)).toBeInTheDocument();
      expect(screen.queryByText(LOADING)).not.toBeInTheDocument();
      expectSampleContent();
    });

    it("still filters after the empty state", async () => {
      mockTracks.empty();

      render(<SearchPage />);
      await screen.findByText(EMPTY);

      expectFilteringWorks();
    });
  });

  describe("HTTP error", () => {
    it("shows the unavailable status and keeps sample content", async () => {
      const consoleError = silenceConsoleError();
      mockTracks.httpError(500);

      render(<SearchPage />);

      expect(await screen.findByText(UNAVAILABLE)).toBeInTheDocument();
      expect(screen.queryByText(LOADING)).not.toBeInTheDocument();
      expectSampleContent();
      expect(consoleError).toHaveBeenCalled();
    });

    it("still filters after an HTTP error", async () => {
      silenceConsoleError();
      mockTracks.httpError(500);

      render(<SearchPage />);
      await screen.findByText(UNAVAILABLE);

      expectFilteringWorks();
    });
  });

  describe("network failure", () => {
    it("shows the unavailable status and keeps sample content", async () => {
      const consoleError = silenceConsoleError();
      mockTracks.networkFailure();

      render(<SearchPage />);

      expect(await screen.findByText(UNAVAILABLE)).toBeInTheDocument();
      expect(screen.queryByText(LOADING)).not.toBeInTheDocument();
      expectSampleContent();
      expect(consoleError).toHaveBeenCalled();
    });

    it("still filters after a network failure", async () => {
      silenceConsoleError();
      mockTracks.networkFailure();

      render(<SearchPage />);
      await screen.findByText(UNAVAILABLE);

      expectFilteringWorks();
    });
  });

  
  describe("backend returns tracks", () => {
    it("displays real backend tracks instead of sample content", async () => {
      mockTracks.success();

      render(<SearchPage />);

      // Verify the backend track appears.
      expect(await screen.findByText("Real Track")).toBeInTheDocument();

      // Verify loading and warning messages disappear.
      expect(screen.queryByText(LOADING)).not.toBeInTheDocument();
      expect(screen.queryByText(EMPTY)).not.toBeInTheDocument();
      expect(screen.queryByText(UNAVAILABLE)).not.toBeInTheDocument();

      // Real tracks replace the sample catalog.
      expect(screen.queryByText("Midnight Drive")).not.toBeInTheDocument();
      expect(screen.queryByText("Chill Waves")).not.toBeInTheDocument();

      // Verify searching real backend tracks.
      search("Real");
      expect(screen.getByText("Real Track")).toBeInTheDocument();

      // Verify no matching results.
      search("nonexistent-song");
      expect(
        screen.getByText("No songs, artists, or playlists found.")
      ).toBeInTheDocument();

      // Clearing search restores the backend catalog.
      search("");
      expect(screen.getByText("Real Track")).toBeInTheDocument();
    });

    it("allows selecting a real backend track", async () => {
      mockTracks.success();
      const onSelectTrack = vi.fn();

      render(<SearchPage onSelectTrack={onSelectTrack} />);

      // Wait until the backend track appears.
      const track = await screen.findByText("Real Track");

      // Select the track.
      fireEvent.click(track);

      // Verify the correct track is passed to the parent.
      expect(onSelectTrack).toHaveBeenCalledTimes(1);
      expect(onSelectTrack).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "101",
          title: "Real Track",
          subtitle: "Soundwave",
          image: "/images/lofi.jpeg",
          type: "Song",
        })
      );
    });

    // SW-220: Verify that Search accepts a submitted query from Home.
    it("filters backend tracks using the initial query", async () => {
      mockTracks.success();

      render(<SearchPage initialQuery="Real" />);

      // Verify the query from Home appears in Search.
      expect(
        screen.getByPlaceholderText("Search Soundwave")
      ).toHaveValue("Real");

      // Confirm that the matching backend track is displayed.
      expect(
        await screen.findByText("Real Track")
      ).toBeInTheDocument();
    });

    // SW-220: Verify that changes to Search are saved in App.
    it("reports Search input changes to App", async () => {
      mockTracks.success();
      const onQueryChange = vi.fn();

      render(
        <SearchPage
          initialQuery=""
          onQueryChange={onQueryChange}
        />
      );

      await screen.findByText("Real Track");

      // Simulate typing directly into the Search page.
      fireEvent.change(
        screen.getByPlaceholderText("Search Soundwave"),
        { target: { value: "Signal" } }
      );

      // Confirm that App receives the updated query.
      expect(onQueryChange).toHaveBeenCalledWith("Signal");

      // The test catalog only contains "Real Track".
      expect(
        screen.getByText("No songs, artists, or playlists found.")
      ).toBeInTheDocument();
    });
  });
});
