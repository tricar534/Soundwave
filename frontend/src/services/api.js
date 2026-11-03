const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:4000/api";

const BACKEND_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  "http://localhost:4000";

async function request(endpoint, options = {}) {
  const response = await fetch(
    `${API_BASE_URL}${endpoint}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Request failed with status ${response.status}`
    );
  }

  return response.json();
}

export async function getHealth() {
  const response = await fetch(`${BACKEND_BASE_URL}/health`);

  if (!response.ok) {
    throw new Error(
      `Health request failed with status ${response.status}`
    );
  }

  return response.json();
}

export function getTracks() {
  return request("/tracks");
}

// Sprint 4 Task 2 - frontend-only integration contract (confirm with backend owner):
// POST /api/auth/login with { identifier, password }.
// A successful response is JSON. Authentication state/session persistence
// belongs to the next frontend task, not this API service.
export class LoginRequestError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "LoginRequestError";
    this.status = status;
  }
}

export async function login({ identifier, password }) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: identifier.trim(), password }),
    });
  } catch {
    // Do not display raw network errors, which can contain internal details.
    throw new LoginRequestError("Cannot reach the authentication server. Please try again.");
  }

  if (!response.ok) {
    const messageByStatus = {
      400: "Check your login information and try again.",
      401: "Incorrect email/username or password.",
      403: "This account cannot sign in.",
      404: "The authentication endpoint is not available yet.",
      429: "Too many login attempts. Please try again later.",
    };

    throw new LoginRequestError(
      messageByStatus[response.status] || "Sign-in failed. Please try again later.",
      response.status,
    );
  }

  let data;
  try {
    data = await response.json();
  } catch {
    throw new LoginRequestError("The authentication server returned an invalid response.");
  }

  if (data === null || typeof data !== "object" || Array.isArray(data) || data.error) {
    throw new LoginRequestError("The authentication server returned an invalid response.");
  }

  // Do not store any returned tokens or user details here.
  return data;
}
