import { describe, expect, it } from 'vitest';
import { parseAudioRange } from './parseAudioRange';

describe('Task 2 - HTTP audio byte ranges', () => {
  it('leaves a request without Range as a full 200 response', () => {
    expect(parseAudioRange(undefined, 1000)).toEqual({ kind: 'full' });
  });

  it('selects an inclusive start-end interval', () => {
    expect(parseAudioRange('bytes=0-99', 1000)).toEqual({ kind: 'partial', start: 0, end: 99 });
    expect(parseAudioRange('bytes=200-299', 1000)).toEqual({ kind: 'partial', start: 200, end: 299 });
  });

  it('supports open-ended ranges for browser seeking', () => {
    expect(parseAudioRange('bytes=500-', 1000)).toEqual({ kind: 'partial', start: 500, end: 999 });
  });

  it('supports suffix ranges', () => {
    expect(parseAudioRange('bytes=-100', 1000)).toEqual({ kind: 'partial', start: 900, end: 999 });
    expect(parseAudioRange('bytes=-2000', 1000)).toEqual({ kind: 'partial', start: 0, end: 999 });
  });

  it('caps the requested final byte at EOF', () => {
    expect(parseAudioRange('bytes=950-50000', 1000)).toEqual({ kind: 'partial', start: 950, end: 999 });
  });

  it('rejects out-of-bounds and reversed ranges', () => {
    expect(parseAudioRange('bytes=1000-', 1000)).toEqual({ kind: 'unsatisfiable' });
    expect(parseAudioRange('bytes=100-99', 1000)).toEqual({ kind: 'unsatisfiable' });
    expect(parseAudioRange('bytes=-0', 1000)).toEqual({ kind: 'unsatisfiable' });
  });

  it('rejects malformed and multiple ranges rather than serving extra bytes', () => {
    for (const header of ['bytes=', 'bytes=--', 'bytes=0-1,4-5', 'items=0-10', 'bytes=2-1', '']) {
      expect(parseAudioRange(header, 1000)).toEqual({ kind: 'unsatisfiable' });
    }
  });

  it('handles large numeric range strings without rounding into incorrect byte offsets', () => {
    expect(parseAudioRange('bytes=999999999999999999999999-', 1000)).toEqual({ kind: 'unsatisfiable' });
    expect(parseAudioRange('bytes=2-99999999999999999999999', 1000)).toEqual({ kind: 'partial', start: 2, end: 999 });
  });

  it('returns 416 for an empty file if a range was requested', () => {
    expect(parseAudioRange('bytes=0-', 0)).toEqual({ kind: 'unsatisfiable' });
    expect(parseAudioRange(undefined, 0)).toEqual({ kind: 'full' });
  });
});
