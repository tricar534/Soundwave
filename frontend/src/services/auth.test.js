import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { login, LoginRequestError } from "./api";

describe("Sprint 4 Task 2 - frontend authentication API", () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("submits trimmed identifier and password to POST /api/auth/login", async () => {
    const response = { user: { id: "test-user" } };
    fetchMock.mockResolvedValue({ ok: true, json: async () => response });

    await expect(login({ identifier: "  listener  ", password: "synthetic-only" }))
      .resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:4000/api/auth/login");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(options.body)).toEqual({ identifier: "listener", password: "synthetic-only" });
  });

  it.each([
    [400, "Check your login information"],
    [401, "Incorrect email/username or password"],
    [403, "This account cannot sign in"],
    [404, "authentication endpoint is not available"],
    [429, "Too many login attempts"],
    [500, "Sign-in failed"],
  ])("returns a safe message for HTTP %i", async (status, message) => {
    fetchMock.mockResolvedValue({ ok: false, status });
    await expect(login({ identifier: "a", password: "synthetic-only" }))
      .rejects.toThrow(message);
  });

  it("maps an unavailable server to a safe error", async () => {
    fetchMock.mockRejectedValue(new Error("private internal connection details"));
    await expect(login({ identifier: "a", password: "synthetic-only" }))
      .rejects.toThrow("Cannot reach the authentication server");
  });

  it.each([
    [null],
    ["not-an-object"],
    [{ error: "server details must not be displayed" }],
  ])("rejects malformed or error-shaped successful responses", async (payload) => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => payload });
    await expect(login({ identifier: "a", password: "synthetic-only" }))
      .rejects.toBeInstanceOf(LoginRequestError);
  });

  it("rejects non-JSON success responses", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => { throw new SyntaxError("invalid json"); } });
    await expect(login({ identifier: "a", password: "synthetic-only" }))
      .rejects.toThrow("invalid response");
  });
});
