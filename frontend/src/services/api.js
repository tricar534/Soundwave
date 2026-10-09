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