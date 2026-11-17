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
import { createPlaybackController, playbackErrorMessage } from '../services/playbackControls';
import { formatPlaybackTime as formatTime, getPlaybackState, readPlaybackTimeline, seekPlayback } from '../services/playbackTimeline';
import './StreamingPlaybackBar.css';

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
  const controllerRef = useRef(null);
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
  const [bufferedPercent, setBufferedPercent] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('Choose a catalog track or local audio file.');
  if (!controllerRef.current) {
    controllerRef.current = createPlaybackController(() => audioRef.current, {
      onError: (err) => setError(playbackErrorMessage(err)),
    });
  }
  const token = props.authToken || props.sessionToken || props.accessToken || props.token || ownedToken;
  const activeId = normalizeTrackId(catalogTrack?.id ?? catalogTrack?.trackId ?? catalogTrack?.track_id);

  // Sync with existing Soundwave catalog selections. Does not replace other page state.
  useEffect(() => {
    if (!selectedId) return;
    // A selected catalog song must stop any previous local/catalog audio.
    controllerRef.current.stop();
    setAudioUrl('');
    setCatalogTrack(externalTrack);
    setMode('catalog');
    setError('');
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
    controllerRef.current.stop();
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    setBufferedPercent(0);
    setIsBuffering(false);
    setIsSeeking(false);
    setHasEnded(false);
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
    if (!audioRef.current || !audioUrl || isLoading) return;
    setError('');
    const result = await controllerRef.current.toggle();
    if (result === 'paused') {
      setIsPlaying(false);
      setStatus('Paused — press Play to resume.');
    }
  }

  function restartPlayback() {
    if (!audioRef.current || !audioUrl || isLoading) return;
    controllerRef.current.restart();
    setIsPlaying(false);
    setProgress(0);
    setHasEnded(false);
    setIsSeeking(false);
    setIsBuffering(false);
    setError('');
    setStatus('Restarted — press Play.');
  }

  function syncTimeline(audio) {
    const timeline = readPlaybackTimeline(audio);
    setProgress(timeline.position);
    setDuration(timeline.duration);
    setBufferedPercent(timeline.bufferedPercent);
  }

  function handleSeek(event) {
    const result = seekPlayback(audioRef.current, Number(event.target.value));
    if (!result.ok) {
      setError('Audio is not ready for seeking yet.');
      return;
    }
    setProgress(result.position);
    setHasEnded(false);
    setError('');
    setStatus(`Moved to ${formatTime(result.position)}.`);
  }

  function handlePlayerKeyDown(event) {
    // Space toggles playback only when the player region itself is focused,
    // never while typing in the login form or Track ID field.
    if (event.target !== event.currentTarget || event.code !== 'Space' || event.repeat) return;
    event.preventDefault();
    void togglePlayback();
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!(file.type.startsWith('audio/') || /\.(mp3|m4a|wav|flac|ogg)$/i.test(file.name))) {
      setError('Please choose an audio file (MP3, WAV, OGG, FLAC, or M4A).');
      return;
    }
    controllerRef.current.stop();
    setAudioUrl('');
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
    controllerRef.current.stop();
    setAudioUrl('');
    setCatalogTrack({ id, title: `Track ${id}` });
    setMode('catalog');
    setError('');
  }

  const info = mode === 'local' && localFile
    ? { title: localMeta?.title || localFile.name, artist: localMeta?.artist || 'Local file', artwork: localMeta?.artworkUrl }
    : displayTrack(catalogTrack || externalTrack);
  const hasSource = Boolean(audioUrl);
  const playbackState = getPlaybackState({
    hasSource, isLoading, hasError: Boolean(error), ended: hasEnded,
    seeking: isSeeking, buffering: isBuffering, playing: isPlaying, position: progress,
  });

  return (
    <section className="playback-bar sw-streamingbar" aria-label="Music streaming player"
      tabIndex={0} onKeyDown={handlePlayerKeyDown} title="Focus player then press Space to play or pause">
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="metadata"
        onPlay={() => { setIsPlaying(true); setIsBuffering(false); setHasEnded(false); setStatus('Playing audio.'); }}
        onPlaying={() => { setIsPlaying(true); setIsBuffering(false); }}
        onPause={() => setIsPlaying(false)}
        onEnded={(event) => {
          syncTimeline(event.currentTarget);
          setIsPlaying(false);
          setIsBuffering(false);
          setIsSeeking(false);
          setHasEnded(true);
          setStatus('Track finished — press Play to replay.');
        }}
        onTimeUpdate={(event) => syncTimeline(event.currentTarget)}
        onLoadedMetadata={(event) => syncTimeline(event.currentTarget)}
        onDurationChange={(event) => syncTimeline(event.currentTarget)}
        onProgress={(event) => syncTimeline(event.currentTarget)}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onSeeking={() => { setIsSeeking(true); setHasEnded(false); }}
        onSeeked={(event) => { syncTimeline(event.currentTarget); setIsSeeking(false); }}
        onEmptied={() => {
          setProgress(0); setDuration(0); setBufferedPercent(0);
          setHasEnded(false); setIsBuffering(false); setIsSeeking(false);
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
            disabled={!hasSource || isLoading}
            aria-label={isPlaying ? 'Pause audio' : progress > 0 && progress < duration ? 'Resume audio' : 'Play audio'}>
            {isPlaying ? '❚❚' : '▶'}
          </button>
          <button type="button" onClick={restartPlayback}
            disabled={!hasSource || isLoading} aria-label="Restart track" title="Restart from beginning">
            ↺
          </button>
          <label className="sw-streamingbar__progress-label">
            <span>{formatTime(progress)}</span>
            <span className="sw-streamingbar__timeline">
              <input aria-label="Playback position" type="range" min="0" max={duration || 1}
                step="0.1" value={Math.min(progress, duration || 1)} disabled={!hasSource || !duration}
                aria-valuetext={`${formatTime(progress)} of ${formatTime(duration)}`}
                onChange={handleSeek} />
              <progress className="sw-streamingbar__buffered" value={bufferedPercent} max="100"
                aria-label="Buffered audio" title={`${Math.round(bufferedPercent)}% buffered`} />
            </span>
            <span>{formatTime(duration)}</span>
          </label>
          <label className="sw-streamingbar__volume-label">
            Vol
            <input aria-label="Volume" type="range" min="0" max="1" step="0.05" value={volume}
              onChange={(event) => setVolume(Number(event.target.value))} />
          </label>
        </div>
        <div className="sw-streamingbar__feedback">
          <span className="sw-streamingbar__state" aria-label={`Playback state: ${playbackState}`}>
            {playbackState}
          </span>
          {error && <p className="sw-streamingbar__error" role="alert">{error}</p>}
          {!error && status && <p className="sw-streamingbar__status" role="status">{status}</p>}
        </div>
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
