// Lightweight ID3v2.3/v2.4 reader for local MP3 tags and embedded cover artwork.
// No uploads: the browser reads only the file explicitly chosen by the user.
const MAX_TAG_BYTES = 5 * 1024 * 1024;

function synchsafe(bytes, at) {
  return (bytes[at] << 21) | (bytes[at + 1] << 14) | (bytes[at + 2] << 7) | bytes[at + 3];
}

function frameLength(bytes, at, major) {
  if (major === 4) return synchsafe(bytes, at);
  return (((bytes[at] << 24) >>> 0) + (bytes[at + 1] << 16) +
    (bytes[at + 2] << 8) + bytes[at + 3]);
}

function decodeText(bytes, encoding) {
  try {
    if (encoding === 0) return new TextDecoder('iso-8859-1').decode(bytes).replace(/\0/g, '').trim();
    if (encoding === 3) return new TextDecoder('utf-8').decode(bytes).replace(/\0/g, '').trim();
    if (encoding === 1) return new TextDecoder('utf-16').decode(bytes).replace(/\0/g, '').trim();
    if (encoding === 2) {
      const swapped = new Uint8Array(bytes.length);
      for (let i = 0; i + 1 < bytes.length; i += 2) {
        swapped[i] = bytes[i + 1];
        swapped[i + 1] = bytes[i];
      }
      return new TextDecoder('utf-16le').decode(swapped).replace(/\0/g, '').trim();
    }
  } catch {
    // Malformed tags should never prevent playing the selected local file.
  }
  return '';
}

function readArtwork(frame) {
  if (frame.length < 6 || typeof URL.createObjectURL !== 'function') return null;
  const encoding = frame[0];
  let offset = 1;
  while (offset < frame.length && frame[offset] !== 0) offset++;
  if (offset >= frame.length) return null;
  const mime = new TextDecoder().decode(frame.slice(1, offset)).toLowerCase();
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(mime)) return null;
  offset += 2; // MIME null terminator + picture type
  const wide = encoding === 1 || encoding === 2;
  if (wide) {
    while (offset + 1 < frame.length && !(frame[offset] === 0 && frame[offset + 1] === 0)) offset += 2;
    offset += 2;
  } else {
    while (offset < frame.length && frame[offset] !== 0) offset++;
    offset++;
  }
  if (offset >= frame.length) return null;
  const bytes = frame.slice(offset);
  if (!bytes.length) return null;
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
}

export async function readLocalId3(file) {
  const result = { title: '', artist: '', album: '', artworkUrl: null };
  if (!file || typeof file.slice !== 'function') return result;
  const header = new Uint8Array(await file.slice(0, 10).arrayBuffer());
  if (header.length < 10 || String.fromCharCode(...header.slice(0, 3)) !== 'ID3') return result;
  const version = header[3];
  if (version !== 3 && version !== 4) return result;
  const tagSize = synchsafe(header, 6);
  if (tagSize <= 0 || tagSize > MAX_TAG_BYTES) return result;
  const bytes = new Uint8Array(await file.slice(10, 10 + tagSize).arrayBuffer());
  let position = 0;
  // Extended header, when present, is skipped. ID3v2.4 uses synchsafe size.
  if ((header[5] & 0x40) && bytes.length >= 4) {
    const extendedSize = frameLength(bytes, 0, version);
    position = version === 3 ? extendedSize + 4 : extendedSize;
  }
  while (position + 10 <= bytes.length) {
    const name = String.fromCharCode(...bytes.slice(position, position + 4));
    if (!/^[A-Z0-9]{4}$/.test(name)) break;
    const length = frameLength(bytes, position + 4, version);
    const end = position + 10 + length;
    if (length <= 0 || end > bytes.length) break;
    const frame = bytes.slice(position + 10, end);
    if (name === 'TIT2' && !result.title) result.title = decodeText(frame.slice(1), frame[0]);
    if (name === 'TPE1' && !result.artist) result.artist = decodeText(frame.slice(1), frame[0]);
    if (name === 'TALB' && !result.album) result.album = decodeText(frame.slice(1), frame[0]);
    if (name === 'APIC' && !result.artworkUrl) result.artworkUrl = readArtwork(frame);
    position = end;
  }
  return result;
}
