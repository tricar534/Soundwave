// Task 3: Common helpers for browser audio and Soundwave's authenticated API.
// No personal file paths, secrets, or third-party dependencies.

export function getBackendBaseUrl() {
  const env = import.meta.env;
  const configured = env && env.VITE_API_BASE_URL;
  return (configured || 'http://localhost:4000').replace(/\/+$/, '');
}

export function normalizeTrackId(id) {
  const value = String(id ?? '').trim();
  if (!/^[1-9][0-9]*$/.test(value)) return null;
  try {
    if (BigInt(value) > 9223372036854775807n) return null;
  } catch {
    return null;
  }
  return value;
}

export function pickSelectedTrack(props = {}) {
  return props.currentTrack ?? props.selectedTrack ?? props.track ??
    props.currentSong ?? props.selectedSong ?? props.song ?? props.selectedMedia ?? null;
}

function asText(value) {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (value && typeof value === 'object') return asText(value.name ?? value.title);
  return '';
}

export function displayTrack(track) {
  const value = track || {};
  return {
    id: normalizeTrackId(value.id ?? value.trackId ?? value.track_id),
    title: asText(value.title ?? value.name) || 'Selected track',
    artist: asText(value.artist ?? value.artistName ?? value.artist_name ?? value.subtitle) || 'Unknown artist',
    artwork: asText(value.artworkUrl ?? value.artwork_url ?? value.coverUrl ?? value.cover ??
      value.imageUrl ?? value.image ?? value.artwork ?? value.thumbnail),
  };
}

function errorFromResponse(status) {
  if (status === 401) return 'Session expired or not signed in. Please sign in to play catalog tracks.';
  if (status === 404) return 'No MP3 file is registered for this track on this Soundwave server.';
  if (status === 503) return 'Audio storage is not configured on this server (MEDIA_ROOT).';
  return `Audio request failed (HTTP ${status}).`;
}

export async function fetchAuthenticatedTrack({ trackId, token, signal, baseUrl = getBackendBaseUrl() }) {
  const id = normalizeTrackId(trackId);
  if (!id) throw new Error('Select a track with a valid database ID.');
  if (!token) throw new Error('Sign in to stream a catalog track.');

  const response = await fetch(`${baseUrl}/api/tracks/${id}/audio`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
    credentials: 'omit',
    cache: 'no-store',
    signal,
  });
  if (!response.ok) throw new Error(errorFromResponse(response.status));
  const type = response.headers.get('Content-Type') || '';
  if (!type.startsWith('audio/')) throw new Error('Server returned non-audio data.');
  return response.blob();
}

export async function loginForAudio({ username, password, baseUrl = getBackendBaseUrl() }) {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'omit',
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) throw new Error('Login failed. Check your Soundwave username and password.');
  const result = await response.json();
  if (typeof result.token !== 'string' || !result.token) {
    throw new Error('Login response did not contain an authentication token.');
  }
  return result.token;
}

export async function fetchTrackDetails(trackId, baseUrl = getBackendBaseUrl()) {
  const id = normalizeTrackId(trackId);
  if (!id) throw new Error('Invalid database track ID.');
  const response = await fetch(`${baseUrl}/api/tracks/${id}`);
  if (!response.ok) throw new Error(`Track lookup failed (HTTP ${response.status}).`);
  const data = await response.json();
  return data.track ?? data;
}
