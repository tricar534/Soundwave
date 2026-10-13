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
    it("clears the loading message and shows no warning", async () => {
      // SearchPage logs backend tracks instead of rendering them (SW-48).
      vi.spyOn(console, "log").mockImplementation(() => {});
      mockTracks.success();

      render(<SearchPage />);

      await vi.waitFor(() =>
        expect(screen.queryByText(LOADING)).not.toBeInTheDocument()
      );
      expect(screen.queryByText(EMPTY)).not.toBeInTheDocument();
      expect(screen.queryByText(UNAVAILABLE)).not.toBeInTheDocument();
      expectSampleContent();
      expectFilteringWorks();
    });
  });
});
