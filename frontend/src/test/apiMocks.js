import { vi } from "vitest";
import * as api from "../services/api";

// SW-97/SW-96: shared getTracks() fixtures for tests that exercise
// SearchPage's (and similar pages') catalog loading/empty/error states.
// Requires the test file to call vi.mock("../services/api") first.

export const mockTracks = {
  empty() {
    vi.mocked(api.getTracks).mockResolvedValue({ tracks: [], count: 0 });
  },

  success() {
    vi.mocked(api.getTracks).mockResolvedValue({
      tracks: [
        {
          id: "101",
          albumId: "1",
          title: "Real Track",
          trackNumber: 1,
          durationMs: 200000,
          isAvailable: true,
        },
      ],
      count: 1,
    });
  },

  httpError(status) {
    vi.mocked(api.getTracks).mockRejectedValue(
      new Error(`Request failed with status ${status}`)
    );
  },

  networkFailure() {
    vi.mocked(api.getTracks).mockRejectedValue(new TypeError("fetch failed"));
  },
};

export function silenceConsoleError() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}
