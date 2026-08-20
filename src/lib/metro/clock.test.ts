import { describe, it, expect } from 'vitest';
import { istSecondsOfDay, istDayOfWeek, parseClockOverride, formatClock, snapshotAt } from './clock.ts';

// IST = UTC + 5:30, no DST.
function istToEpochMs(y: number, mo: number, d: number, h: number, mi: number, s: number): number {
  // Subtract 5:30 to get the equivalent UTC wall-clock time on the same instant.
  return Date.UTC(y, mo - 1, d, h - 5, mi - 30, s);
}

describe('istSecondsOfDay', () => {
  it('reads back an exact IST wall-clock time', () => {
    const epoch = istToEpochMs(2026, 1, 15, 8, 15, 30);
    expect(istSecondsOfDay(epoch)).toBeCloseTo(8 * 3600 + 15 * 60 + 30, 3);
  });

  it('handles midnight exactly', () => {
    const epoch = istToEpochMs(2026, 6, 1, 0, 0, 0);
    expect(istSecondsOfDay(epoch)).toBeCloseTo(0, 3);
  });

  it('wraps just before midnight', () => {
    const epoch = istToEpochMs(2026, 6, 1, 23, 59, 59);
    expect(istSecondsOfDay(epoch)).toBeCloseTo(86399, 3);
  });
});

describe('istDayOfWeek', () => {
  it('matches JS getDay() convention for a known Thursday', () => {
    // 2026-08-20 is a Thursday (per system date context).
    const epoch = istToEpochMs(2026, 8, 20, 12, 0, 0);
    expect(istDayOfWeek(epoch)).toBe(4);
  });

  it('matches for a known Sunday', () => {
    // 2026-08-23 is a Sunday.
    const epoch = istToEpochMs(2026, 8, 23, 12, 0, 0);
    expect(istDayOfWeek(epoch)).toBe(0);
  });

  it('rolls over at IST midnight, not UTC midnight', () => {
    // 23:59:59 IST on a Thursday is still Thursday even though UTC has
    // already crossed into the next calendar date (18:29:59 UTC).
    const beforeMidnight = istToEpochMs(2026, 8, 20, 23, 59, 59);
    expect(istDayOfWeek(beforeMidnight)).toBe(4);
    const afterMidnight = istToEpochMs(2026, 8, 21, 0, 0, 1);
    expect(istDayOfWeek(afterMidnight)).toBe(5);
  });
});

describe('parseClockOverride', () => {
  it('returns null when absent', () => {
    expect(parseClockOverride('', Date.now())).toBeNull();
    expect(parseClockOverride('?foo=bar', Date.now())).toBeNull();
  });

  it('overrides the IST time-of-day while keeping the real calendar date', () => {
    const real = istToEpochMs(2026, 8, 20, 3, 0, 0);
    const overridden = parseClockOverride('?clock=22:55:00', real);
    expect(overridden).not.toBeNull();
    expect(istSecondsOfDay(overridden!)).toBeCloseTo(22 * 3600 + 55 * 60, 3);
    expect(istDayOfWeek(overridden!)).toBe(istDayOfWeek(real));
  });

  it('accepts HH:MM without seconds', () => {
    const real = istToEpochMs(2026, 8, 20, 3, 0, 0);
    const overridden = parseClockOverride('?clock=07:45', real);
    expect(istSecondsOfDay(overridden!)).toBeCloseTo(7 * 3600 + 45 * 60, 3);
  });

  it('rejects garbage', () => {
    expect(parseClockOverride('?clock=nonsense', Date.now())).toBeNull();
  });
});

describe('formatClock', () => {
  it('pads to HH:MM:SS', () => {
    expect(formatClock(9 * 3600 + 5 * 60 + 3)).toBe('09:05:03');
    expect(formatClock(0)).toBe('00:00:00');
    expect(formatClock(86399)).toBe('23:59:59');
  });
});

describe('snapshotAt', () => {
  it('bundles all three fields consistently', () => {
    const epoch = istToEpochMs(2026, 8, 20, 8, 15, 30);
    const snap = snapshotAt(epoch);
    expect(snap.epochMs).toBe(epoch);
    expect(snap.secondsOfDay).toBeCloseTo(8 * 3600 + 15 * 60 + 30, 3);
    expect(snap.dayOfWeek).toBe(4);
  });
});
