// @vitest-environment node
// Sprint 4 Role A CI/CD: exercise the actual frontend HTTP client against
// an isolated loopback server. No shared backend, database, or credentials.
import { createServer } from "node:http";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const SYNTHETIC_PASSWORD = "synthetic-ci-only";

function sendJson(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

describe("Sprint 4 - frontend API integration in CI", () => {
  let server;
  let baseUrl;
  let scenario;
  let requests;

  beforeAll(async () => {
    server = createServer(async (request, response) => {
      const path = new URL(request.url, "http://127.0.0.1").pathname;
      const record = { method: request.method, path, contentType: request.headers["content-type"] };
      requests.push(record);

      if (path === "/health" && request.method === "GET") {
        if (scenario === "health-failure") {
          sendJson(response, 503, { error: "synthetic unavailable" });
        } else if (scenario === "health-malformed") {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end("invalid-json");
        } else {
          sendJson(response, 200, { status: "ok" });
        }
        return;
      }

      if (path === "/api/tracks" && request.method === "GET") {
        if (scenario === "tracks-failure") {
          sendJson(response, 500, { error: "synthetic catalog failure" });
        } else if (scenario === "tracks-malformed") {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end("invalid-json");
        } else {
          sendJson(response, 200, {
            tracks: [{ id: "synthetic-track-1", title: "Synthetic Track" }],
            count: 1,
          });
        }
        return;
      }

      if (path === "/api/auth/login" && request.method === "POST") {
        if (scenario === "login-disconnect") {
          request.socket.destroy();
          return;
        }

        let body = "";
        for await (const chunk of request) body += chunk;
        record.payload = JSON.parse(body);

        if (scenario === "login-unauthorized") {
          sendJson(response, 401, { error: "synthetic invalid credentials" });
        } else if (scenario === "login-failure") {
          sendJson(response, 503, { detail: "synthetic private server diagnostic" });
        } else if (scenario === "login-malformed") {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end("invalid-json");
        } else if (scenario === "login-error-body") {
          sendJson(response, 200, { error: "synthetic private error" });
        } else {
          sendJson(response, 200, { user: { id: "synthetic-user-1", username: "listener" } });
        }
        return;
      }

      sendJson(response, 404, { error: "synthetic missing route" });
    });

    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(0, "127.0.0.1", resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  beforeEach(() => {
    scenario = "success";
    requests = [];
    vi.resetModules();
    vi.stubEnv("VITE_API_URL", `${baseUrl}/api`);
    vi.stubEnv("VITE_BACKEND_URL", baseUrl);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  afterAll(async () => {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    }
  });

  it("fetches the backend health response through the configured backend URL", async () => {
    const { getHealth } = await import("./api.js");
    await expect(getHealth()).resolves.toEqual({ status: "ok" });
    expect(requests).toEqual([{ method: "GET", path: "/health", contentType: undefined }]);
  });

  it("fetches a synthetic catalog through the configured API URL", async () => {
    const { getTracks } = await import("./api.js");
    await expect(getTracks()).resolves.toEqual({
      tracks: [{ id: "synthetic-track-1", title: "Synthetic Track" }],
      count: 1,
    });
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({ method: "GET", path: "/api/tracks" });
  });

  it("sends login credentials as JSON to POST /api/auth/login without URL exposure", async () => {
    const { login } = await import("./api.js");
    await expect(login({ identifier: "  listener  ", password: SYNTHETIC_PASSWORD }))
      .resolves.toEqual({ user: { id: "synthetic-user-1", username: "listener" } });
    expect(requests).toHaveLength(1);
    expect(requests[0]).toMatchObject({
      method: "POST",
      path: "/api/auth/login",
      contentType: "application/json",
      payload: { identifier: "listener", password: SYNTHETIC_PASSWORD },
    });
    expect(requests[0].path).not.toContain(SYNTHETIC_PASSWORD);
  });

  it("fails clearly on an HTTP 500 catalog response", async () => {
    scenario = "tracks-failure";
    const { getTracks } = await import("./api.js");
    await expect(getTracks()).rejects.toThrow("Request failed with status 500");
  });

  it("fails clearly on an HTTP 503 health response", async () => {
    scenario = "health-failure";
    const { getHealth } = await import("./api.js");
    await expect(getHealth()).rejects.toThrow("Health request failed with status 503");
  });

  it("turns an HTTP 401 login response into a safe authentication error", async () => {
    scenario = "login-unauthorized";
    const { login, LoginRequestError } = await import("./api.js");
    await expect(login({ identifier: "listener", password: SYNTHETIC_PASSWORD }))
      .rejects.toMatchObject({
        name: LoginRequestError.name,
        status: 401,
        message: "Incorrect email/username or password.",
      });
  });

  it("does not expose internal HTTP 503 login response details", async () => {
    scenario = "login-failure";
    const { login } = await import("./api.js");
    await expect(login({ identifier: "listener", password: SYNTHETIC_PASSWORD }))
      .rejects.toThrow("Sign-in failed. Please try again later.");
  });

  it("reports an interrupted HTTP connection as an unavailable authentication service", async () => {
    scenario = "login-disconnect";
    const { login } = await import("./api.js");
    await expect(login({ identifier: "listener", password: SYNTHETIC_PASSWORD }))
      .rejects.toThrow("Cannot reach the authentication server. Please try again.");
  });

  it("rejects malformed JSON from a successful login HTTP response", async () => {
    scenario = "login-malformed";
    const { login } = await import("./api.js");
    await expect(login({ identifier: "listener", password: SYNTHETIC_PASSWORD }))
      .rejects.toThrow("The authentication server returned an invalid response.");
  });

  it("rejects a successful HTTP response that contains an error payload", async () => {
    scenario = "login-error-body";
    const { login } = await import("./api.js");
    await expect(login({ identifier: "listener", password: SYNTHETIC_PASSWORD }))
      .rejects.toThrow("The authentication server returned an invalid response.");
  });

  it("does not silently accept malformed JSON from the catalog endpoint", async () => {
    scenario = "tracks-malformed";
    const { getTracks } = await import("./api.js");
    await expect(getTracks()).rejects.toThrow(SyntaxError);
  });

  it("does not silently accept malformed JSON from the health endpoint", async () => {
    scenario = "health-malformed";
    const { getHealth } = await import("./api.js");
    await expect(getHealth()).rejects.toThrow(SyntaxError);
  });
});
