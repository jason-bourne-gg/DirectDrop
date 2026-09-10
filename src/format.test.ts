import { describe, it, expect } from 'vitest';
import { formatBytes, formatSpeed, formatEta } from './format';

describe('formatBytes', () => {
  it('shows plain bytes below 1 KB', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1023)).toBe('1023 B');
  });

  it('steps up through the units at 1024 boundaries', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 ** 2)).toBe('1.0 MB');
    expect(formatBytes(1024 ** 3)).toBe('1.0 GB');
    expect(formatBytes(1024 ** 4)).toBe('1.0 TB');
  });

  it('drops the decimal once the value reaches 10', () => {
    expect(formatBytes(1024 * 9.5)).toBe('9.5 KB');
    expect(formatBytes(1024 * 20)).toBe('20 KB');
  });

  it('caps at TB rather than inventing a larger unit', () => {
    expect(formatBytes(1024 ** 5)).toBe('1024 TB');
  });

  it('returns a dash for values that cannot be rendered', () => {
    expect(formatBytes(-1)).toBe('—');
    expect(formatBytes(NaN)).toBe('—');
    expect(formatBytes(Infinity)).toBe('—');
  });
});

describe('formatSpeed', () => {
  it('appends a per-second suffix', () => {
    expect(formatSpeed(1024)).toBe('1.0 KB/s');
    expect(formatSpeed(0)).toBe('0 B/s');
  });

  it('propagates the dash for unrenderable rates', () => {
    expect(formatSpeed(Infinity)).toBe('—/s');
  });
});

describe('formatEta', () => {
  it('renders seconds under a minute, rounding up', () => {
    expect(formatEta(0)).toBe('0s');
    expect(formatEta(1.2)).toBe('2s');
    expect(formatEta(59)).toBe('59s');
  });

  it('switches to minutes and seconds at 60', () => {
    expect(formatEta(60)).toBe('1m 0s');
    expect(formatEta(90)).toBe('1m 30s');
    expect(formatEta(3600)).toBe('60m 0s');
  });

  it('returns a dash for values that cannot be rendered', () => {
    expect(formatEta(-5)).toBe('—');
    expect(formatEta(NaN)).toBe('—');
    expect(formatEta(Infinity)).toBe('—');
  });
});
