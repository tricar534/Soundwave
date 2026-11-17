/**
 * Task 6: Turn the Task 5 timeline into safe CSS variables for one combined
 * seek/buffer track. Pure function; no backend, account, or media file needed.
 */
export function progressBarStyle({ position = 0, duration = 0, bufferedPercent = 0 } = {}) {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
  const safePosition = Number.isFinite(position) ? Math.max(0, position) : 0;
  const safeBuffered = Number.isFinite(bufferedPercent) ? bufferedPercent : 0;
  const clamp = (value) => Math.min(100, Math.max(0, value));
  const played = safeDuration ? clamp((safePosition / safeDuration) * 100) : 0;
  // Browsers can briefly report a stale buffered range during a seek.
  // A gradient must never put its buffered stop behind its played stop.
  const buffered = Math.max(played, clamp(safeBuffered));
  return {
    '--sw-played': `${played}%`,
    '--sw-buffered': `${buffered}%`,
  };
}
