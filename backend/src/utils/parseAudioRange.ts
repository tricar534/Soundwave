/**
 * Task 2: Interpret a single HTTP bytes Range header for MP3 delivery.
 * Supported: bytes=100-499, bytes=100-, bytes=-500.
 * Multiple ranges are deliberately rejected (multipart/byteranges is not implemented).
 */
export type AudioByteRange = { start: number; end: number };
export type AudioRangeSelection =
  | { kind: 'full' }
  | { kind: 'partial'; start: number; end: number }
  | { kind: 'unsatisfiable' };

export function parseAudioRange(
  header: string | undefined,
  fileSize: number
): AudioRangeSelection {
  if (!Number.isSafeInteger(fileSize) || fileSize < 0) {
    throw new RangeError('Invalid audio file size');
  }
  if (header === undefined) return { kind: 'full' };

  // A partial response cannot be constructed for an empty file.
  if (fileSize === 0) return { kind: 'unsatisfiable' };

  const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  if (!match || (match[1] === '' && match[2] === '')) {
    return { kind: 'unsatisfiable' };
  }

  const size = BigInt(fileSize);
  let start: number;
  let end: number;

  if (match[1] === '') {
    // Suffix range: bytes=-500 means the final 500 bytes.
    const suffixLength = BigInt(match[2]);
    if (suffixLength <= 0n) return { kind: 'unsatisfiable' };
    start = suffixLength >= size ? 0 : fileSize - Number(suffixLength);
    end = fileSize - 1;
  } else {
    const first = BigInt(match[1]);
    if (first >= size) return { kind: 'unsatisfiable' };

    start = Number(first); // safe: first < fileSize <= MAX_SAFE_INTEGER
    if (match[2] === '') {
      end = fileSize - 1;
    } else {
      const last = BigInt(match[2]);
      if (last < first) return { kind: 'unsatisfiable' };
      end = last >= size ? fileSize - 1 : Number(last);
    }
  }

  return { kind: 'partial', start, end };
}
