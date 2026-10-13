// SW-98: unit/contract tests for services/api.js
//
// Contract gap (recorded as project risk, see docs/risks/sw-98-frontend-backend-contract-gap.md):
// the /api/tracks response shape is not yet agreed between frontend and backend, and
// VITE_API_URL / VITE_BACKEND_URL are independent env vars that can drift from each other.
// No backend implementation changes are included in this ticket.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("services/api.js", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock;
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  describe("default base URLs (no VITE_API_URL / VITE_BACKEND_URL set)", () => {
    beforeEach(() => {
      vi.stubEnv("VITE_API_URL", "");
      vi.stubEnv("VITE_BACKEND_URL", "");
    });

    it("getTracks() requests <API base>/tracks on the default port-4000 base", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: 1, title: "Test Track" }],
      });

      const { getTracks } = await import("./api.js");
      await getTracks();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [calledUrl] = fetchMock.mock.calls[0];
      expect(calledUrl).toBe("http://localhost:4000/api/tracks");
    });

    it("getHealth() requests <backend base>/health on the default port-4000 base", async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "ok" }),
      });

      const { getHealth } = await import("./api.js");
      await getHealth();

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [calledUrl] = fetchMock.mock.calls[0];
      expect(calledUrl).toBe("http://localhost:4000/health");
    });
  });

  describe("non-OK responses", () => {
    it("getTracks() rejects with the expected error when the response is not ok", async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({}) });

      const { getTracks } = await import("./api.js");

      await expect(getTracks()).rejects.toThrow("Request failed with status 500");
    });

    it("getHealth() rejects with the expected error when the response is not ok", async () => {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 503, json: async () => ({}) });

      const { getHealth } = await import("./api.js");

      await expect(getHealth()).rejects.toThrow("Health request failed with status 503");
    });
  });
});
