import { describe, expect, it, vi } from "vitest";
import * as api from "../services/api";
import {
  healthOk,
  httpError,
  mockHealth,
  mockTracks,
  networkError,
  tracksEmpty,
  tracksPopulated,
} from "./apiMocks";

vi.mock("../services/api");

// SW-96: checks that the shared fixtures behave as documented
// and stay in sync with the real services/api.js.

describe("apiMocks fixtures", () => {
  describe("scenario helpers", () => {
    it("mockTracks.success resolves the populated catalog", async () => {
      mockTracks.success();
      await expect(api.getTracks()).resolves.toEqual(tracksPopulated);
    });

    it("mockTracks.empty resolves an empty catalog", async () => {
      mockTracks.empty();
      await expect(api.getTracks()).resolves.toEqual({ tracks: [], count: 0 });
    });

    it("mockTracks.httpError rejects with a 500 error", async () => {
      mockTracks.httpError();
      await expect(api.getTracks()).rejects.toThrow(
        "Request failed with status 500"
      );
    });

    it("mockTracks.networkFailure rejects like a failed fetch", async () => {
      mockTracks.networkFailure();
      await expect(api.getTracks()).rejects.toThrow(TypeError);
    });

    it("mockHealth.success resolves the health payload", async () => {
      mockHealth.success();
      await expect(api.getHealth()).resolves.toEqual(healthOk);
    });

    it("mockHealth.httpError rejects with a health 500 error", async () => {
      mockHealth.httpError();
      await expect(api.getHealth()).rejects.toThrow(
        "Health request failed with status 500"
      );
    });

    it("mockHealth.networkFailure rejects like a failed fetch", async () => {
      mockHealth.networkFailure();
      await expect(api.getHealth()).rejects.toThrow("Failed to fetch");
    });
  });

  describe("reset between tests", () => {
    it("sets up a mock in this test", async () => {
      mockTracks.success();
      await expect(api.getTracks()).resolves.toEqual(tracksPopulated);
    });

    it("starts clean in the next test (no leaked return value or calls)", () => {
      expect(api.getTracks).not.toHaveBeenCalled();
      expect(api.getTracks()).toBeUndefined();
    });
  });

  describe("fixtures match the real api.js", () => {
    async function realApi() {
      return vi.importActual("../services/api");
    }

    it("HTTP 500 error message matches what getTracks throws", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 500 })
      );
      const { getTracks } = await realApi();

      await expect(getTracks()).rejects.toThrow(httpError(500).message);
      vi.unstubAllGlobals();
    });

    it("HTTP 500 error message matches what getHealth throws", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 500 })
      );
      const { getHealth } = await realApi();

      await expect(getHealth()).rejects.toThrow(
        httpError(500, "Health request").message
      );
      vi.unstubAllGlobals();
    });

    it("network failure propagates the same error type as the fixture", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(networkError()));
      const { getTracks } = await realApi();

      await expect(getTracks()).rejects.toThrow(TypeError);
      vi.unstubAllGlobals();
    });

    it("empty-catalog fixture passes through getTracks unchanged", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: () => Promise.resolve(tracksEmpty),
        })
      );
      const { getTracks } = await realApi();

      await expect(getTracks()).resolves.toEqual(tracksEmpty);
      vi.unstubAllGlobals();
    });
  });
});
