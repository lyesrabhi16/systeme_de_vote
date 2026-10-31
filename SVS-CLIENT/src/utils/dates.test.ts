import { describe, expect, it } from 'vitest';
import { formatDuration, progressBetween } from './dates';

const at = (iso: string) => new Date(iso);

describe('formatDuration', () => {
  const from = at('2030-01-01T12:00:00Z');
  it('counts minutes, then hours, then days (rounded up: "0 minute" is only for the past)', () => {
    expect(formatDuration(at('2030-01-01T12:00:30Z'), from)).toBe('1 minute');
    expect(formatDuration(at('2030-01-01T12:45:00Z'), from)).toBe('45 minutes');
    expect(formatDuration(at('2030-01-01T17:10:00Z'), from)).toBe('6 heures');
    expect(formatDuration(at('2030-01-04T12:00:00Z'), from)).toBe('3 jours');
  });
  it('says nothing is left once it is over', () => {
    expect(formatDuration(at('2030-01-01T11:00:00Z'), from)).toBe('0 minute');
  });
});

describe('progressBetween', () => {
  const start = at('2030-01-01T00:00:00Z');
  const end = at('2030-01-03T00:00:00Z');
  it('is a fraction of the period, kept between 0 and 1', () => {
    expect(progressBetween(start, end, at('2030-01-02T00:00:00Z'))).toBe(0.5);
    expect(progressBetween(start, end, at('2029-12-01T00:00:00Z'))).toBe(0);
    expect(progressBetween(start, end, at('2031-01-01T00:00:00Z'))).toBe(1);
  });
  it('does not divide by zero for an empty period', () => {
    expect(progressBetween(start, start, start)).toBe(1);
  });
});
