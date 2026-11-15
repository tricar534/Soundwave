import { useEffect, useRef, useState } from 'react';
import {
  displayTrack,
  fetchAuthenticatedTrack,
  fetchTrackDetails,
  loginForAudio,
  normalizeTrackId,
  pickSelectedTrack,
} from '../services/audioPlayback';
import { readLocalId3 } from '../services/readLocalId3';
import './StreamingPlaybackBar.css';

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const rounded = Math.floor(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

/**
 * Sprint 5, Task 3: real Soundwave audio playback.
 *
 * - Catalog: authenticated GET /api/tracks/:id/audio using an in-memory Bearer token.
 *   This implementation creates an object URL only after receiving the full MP3.
 * - Local: <input type=file> and a browser object URL. No upload or DB required.
 *
 * Accepts the existing app's common selected-track props without changing the
 * rest of the app: currentTrack / selectedTrack / track / currentSong / song.
 * Optional authToken / token / sessionToken prop reuses an existing login token.
 */
export default function StreamingPlaybackBar(props) {
  const externalTrack = pickSelectedTrack(props);
  const selectedId = normalizeTrackId(externalTrack?.id ?? externalTrack?.trackId ?? externalTrack?.track_id);
  const audioRef = useRef(null);
  const inputRef = useRef(null);
  const [mode, setMode] = useState('none');
  const [catalogTrack, setCatalogTrack] = useState(null);
  const [manualId, setManualId] = useState('');
  const [localFile, setLocalFile] = useState(null);
  const [localMeta, setLocalMeta] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [ownedToken, setOwnedToken] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Choose a catalog track or local audio file.');
  const token = props.authToken || props.sessionToken || props.accessToken || props.token || ownedToken;
  const activeId = normalizeTrackId(catalogTrack?.id ?? catalogTrack?.trackId ?? catalogTrack?.track_id);

  // Sync with existing Soundwave catalog selections. Does not replace other page state.
  useEffect(() => {
    if (!selectedId) return;
    setCatalogTrack(externalTrack);
    setMode('catalog');
    setError('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Each developer may play any audio file they choose, without server uploads.
  useEffect(() => {
    if (mode !== 'local' || !localFile) return undefined;
    let cancelled = false;
    let coverUrl = null;
    const url = URL.createObjectURL(localFile);
    setAudioUrl(url);
    setIsLoading(false);
    setError('');
    setStatus('Local file ready — press Play.');
    setLocalMeta({ title: localFile.name.replace(/\.[^.]+$/, ''), artist: 'Local file', artworkUrl: null });
    readLocalId3(localFile).then((tags) => {
      if (cancelled) {
        if (tags.artworkUrl) URL.revokeObjectURL(tags.artworkUrl);
        return;
      }
      coverUrl = tags.artworkUrl;
      setLocalMeta({
        title: tags.title || localFile.name.replace(/\.[^.]+$/, ''),
        artist: tags.artist || 'Local file',
        artworkUrl: tags.artworkUrl,
      });
    }).catch(() => { /* Missing/broken ID3 tags are allowed. */ });
    return () => {
      cancelled = true;
      URL.revokeObjectURL(url);
      if (coverUrl) URL.revokeObjectURL(coverUrl);
    };
  }, [mode, localFile]);

  // Fetch the selected catalog MP3 with an Authorization header. A bare
  // <audio src="/api/tracks/..."> cannot attach a Bearer token securely.
  useEffect(() => {
    if (mode !== 'catalog') return undefined;
    if (!activeId) {
      setAudioUrl('');
      setStatus('Select a real database track. Sample/mock cards have no playable audio ID.');
      return undefined;
    }
    if (!token) {
      setAudioUrl('');
      setStatus('Sign in below to stream this Soundwave catalog track.');
      setShowLogin(true);
      return undefined;
    }
    const controller = new AbortController();
    let objectUrl = null;
    let closed = false;
    setIsLoading(true);
    setError('');
    setAudioUrl('');
    setStatus('Loading authenticated MP3 from Soundwave backend...');

    fetchAuthenticatedTrack({ trackId: activeId, token, signal: controller.signal })
      .then((blob) => {
        if (closed) return;
        objectUrl = URL.createObjectURL(blob);
        setAudioUrl(objectUrl);
        setStatus('Catalog audio ready — press Play.');
      })
      .catch((err) => {
        if (closed || err.name === 'AbortError') return;
        setError(err.message || 'Unable to load this audio file.');
        setStatus('');
      })
      .finally(() => {
        if (!closed) setIsLoading(false);
      });

    // Track metadata is optional: playback still works without richer API data.
    fetchTrackDetails(activeId).then((detail) => {
      if (closed) return;
      setCatalogTrack((prev) => {
        if (normalizeTrackId(prev?.id) !== activeId) return prev;
        return { ...detail, ...prev, id: activeId,
          title: prev?.title && !String(prev.title).startsWith('Track ') ? prev.title : (detail.title || prev?.title) };
      });
    }).catch(() => {});

    return () => {
      closed = true;
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [mode, activeId, token]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    // Switching tracks resets playback position and prevents simultaneous sound.
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    audio.load();
  }, [audioUrl]);

  async function signIn(event) {
    event.preventDefault();
    setError('');
    try {
      const receivedToken = await loginForAudio({ username: username.trim(), password });
      setOwnedToken(receivedToken);
      setPassword('');
      setShowLogin(false);
      setStatus('Signed in — loading selected track.');
    } catch (err) {
      setError(err.message);
    }
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio || !audioUrl || isLoading) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    setError('');
    try {
      await audio.play();
    } catch (err) {
      setError(err.message || 'Your browser blocked playback. Click Play again.');
    }
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!(file.type.startsWith('audio/') || /\.(mp3|m4a|wav|flac|ogg)$/i.test(file.name))) {
      setError('Please choose an audio file (MP3, WAV, OGG, FLAC, or M4A).');
      return;
    }
    setLocalFile(file);
    setMode('local');
    setError('');
    event.target.value = '';
  }

  function handlePlayTrackId(event) {
    event.preventDefault();
    const id = normalizeTrackId(manualId);
    if (!id) {
      setError('Enter a valid numeric track ID, such as the ID shown by /api/tracks.');
      return;
    }
    setCatalogTrack({ id, title: `Track ${id}` });
    setMode('catalog');
    setError('');
  }

  const info = mode === 'local' && localFile
    ? { title: localMeta?.title || localFile.name, artist: localMeta?.artist || 'Local file', artwork: localMeta?.artworkUrl }
    : displayTrack(catalogTrack || externalTrack);
  const hasSource = Boolean(audioUrl);

  return (
    <section className="playback-bar sw-streamingbar" aria-label="Music streaming player">
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => { setIsPlaying(false); setStatus('Track finished.'); }}
        onTimeUpdate={(event) => setProgress(event.currentTarget.currentTime)}
        onDurationChange={(event) => {
          const value = event.currentTarget.duration;
          setDuration(Number.isFinite(value) ? value : 0);
        }}
        onError={() => {
          if (audioUrl) setError('The browser could not decode this audio format.');
        }}
      />
      <div className="sw-streamingbar__track">
        {info.artwork ? <img src={info.artwork} alt="Track cover" className="sw-streamingbar__cover" />
          : <div className="sw-streamingbar__cover sw-streamingbar__placeholder" aria-hidden="true">♪</div>}
        <div className="sw-streamingbar__tracktext">
          <strong title={info.title}>{info.title}</strong>
          <span title={info.artist}>{info.artist}</span>
          <small>{mode === 'local' ? 'On this device' : mode === 'catalog' ? 'Soundwave catalog' : 'No audio selected'}</small>
        </div>
      </div>

      <div className="sw-streamingbar__center">
        <div className="sw-streamingbar__controls">
          <button type="button" className="sw-streamingbar__play" onClick={togglePlayback}
            disabled={!hasSource || isLoading} aria-label={isPlaying ? 'Pause audio' : 'Play audio'}>
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <label className="sw-streamingbar__progress-label">
            <span>{formatTime(progress)}</span>
            <input aria-label="Playback position" type="range" min="0" max={duration || 1}
              step="0.1" value={Math.min(progress, duration || 1)} disabled={!hasSource || !duration}
              onChange={(event) => {
                if (audioRef.current) audioRef.current.currentTime = Number(event.target.value);
              }} />
            <span>{formatTime(duration)}</span>
          </label>
          <label className="sw-streamingbar__volume-label">
            Vol
            <input aria-label="Volume" type="range" min="0" max="1" step="0.05" value={volume}
              onChange={(event) => setVolume(Number(event.target.value))} />
          </label>
        </div>
        {error && <p className="sw-streamingbar__error" role="alert">{error}</p>}
        {!error && status && <p className="sw-streamingbar__status" role="status">{status}</p>}
      </div>

      <div className="sw-streamingbar__sources">
        <input ref={inputRef} type="file" accept="audio/*,.mp3,.m4a,.wav,.ogg,.flac"
          onChange={handleFile} className="sw-streamingbar__fileinput" aria-label="Select a local audio file" />
        <button type="button" onClick={() => inputRef.current?.click()}>Choose Local Music</button>
        <form onSubmit={handlePlayTrackId} className="sw-streamingbar__idform">
          <label htmlFor="sw-stream-trackid">Track ID</label>
          <input id="sw-stream-trackid" inputMode="numeric" placeholder="e.g. 60"
            value={manualId} onChange={(event) => setManualId(event.target.value)} />
          <button type="submit">Load</button>
        </form>
        {(!token || showLogin) && (
          <details className="sw-streamingbar__login" open={showLogin}>
            <summary>Sign in for catalog audio</summary>
            <form onSubmit={signIn}>
              <input aria-label="Soundwave username" placeholder="Username" autoComplete="username"
                value={username} onChange={(event) => setUsername(event.target.value)} required />
              <input aria-label="Soundwave password" placeholder="Password" type="password"
                autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button type="submit">Sign in</button>
            </form>
          </details>
        )}
      </div>
    </section>
  );
}
