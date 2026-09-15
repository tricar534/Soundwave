const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3000/api";

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

export function getSongs() {
  return request("/songs");
}

export function getAlbums() {
  return request("/albums");
}

export function getArtists() {
  return request("/artists");
}

export function searchCatalog(query) {
  return request(
    `/search?q=${encodeURIComponent(query)}`
  );
}