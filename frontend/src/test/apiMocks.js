// SW-96: Shared API mock fixtures for frontend tests.
//
// How to use in a test file:
//
//   import * as api from "../services/api";
//   import { mockHealth, mockTracks } from "../test/apiMocks";
//
//   vi.mock("../services/api");   // must stay in the test file (Vitest hoists it)
//
//   it("...", async () => {
//     mockHealth.success();          // or .httpError(), .networkFailure()
//     mockTracks.empty();            // or .success(), .httpError(), .networkFailure()
//     ...
//   });
//
// vi.mock() only works reliably when called from the test file itself, so each
// test file still declares it. These helpers then configure the already-mocked
// functions. Mocks are reset after every test in src/test/setup.js.

import { vi } from "vitest";
import * as api from "../services/api";

// ---------- Response data (matches the real backend shapes) ----------

// GET /health -> backend/src/app.ts
export const healthOk = {
  status: "ok",
  service: "soundwave-backend",
};

// GET /api/tracks -> backend/src/routes/track.routes.ts
export const tracksEmpty = {
  tracks: [],
  count: 0,
};

// Sample populated catalog. The backend track object shape is not final yet
// (see SW-48), so keep these fields minimal.
export const sampleTracks = [
  { id: 1, title: "Midnight Drive", artist: "Example Artist" },
  { id: 2, title: "City Lights", artist: "Neon Echo" },
];

export const tracksPopulated = {
  tracks: sampleTracks,
  count: sampleTracks.length,
};

// ---------- Error builders ----------

// Same message format api.js throws when response.ok is false.
export function httpError(status = 500, label = "Request") {
  return new Error(`${label} failed with status ${status}`);
}

// What fetch() itself throws when the server can't be reached.
export function networkError() {
  return new TypeError("Failed to fetch");
}

// ---------- Scenario helpers ----------

export const mockHealth = {
  success(data = healthOk) {
    vi.mocked(api.getHealth).mockResolvedValue(data);
  },
  httpError(status = 500) {
    vi.mocked(api.getHealth).mockRejectedValue(httpError(status, "Health request"));
  },
  networkFailure() {
    vi.mocked(api.getHealth).mockRejectedValue(networkError());
  },
};

export const mockTracks = {
  success(data = tracksPopulated) {
    vi.mocked(api.getTracks).mockResolvedValue(data);
  },
  empty() {
    vi.mocked(api.getTracks).mockResolvedValue(tracksEmpty);
  },
  httpError(status = 500) {
    vi.mocked(api.getTracks).mockRejectedValue(httpError(status));
  },
  networkFailure() {
    vi.mocked(api.getTracks).mockRejectedValue(networkError());
  },
};

// Error paths in components call console.error. Use this to keep test output
// clean and to assert that the error was logged. Restored automatically.
export function silenceConsoleError() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}
