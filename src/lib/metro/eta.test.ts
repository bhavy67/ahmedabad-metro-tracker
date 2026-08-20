import { describe, it, expect } from 'vitest';
import { nextDepartures, lastTrainToday, type EtaSource } from './eta.ts';
import type { Pattern, Trip } from './types.ts';

// A(0) -- B(1) -- C(2), dep from A at t, arrives B 100s later, dep B 120s, arrives C 220s.
const fwd: Pattern = { line: 'blue', direction: 'fwd', st: [0, 1, 2], arr: [0, 100, 220], dep: [0, 120, 220] };
const bwd: Pattern = { line: 'blue', direction: 'bwd', st: [2, 1, 0], arr: [0, 100, 220], dep: [0, 120, 220] };

const ALL_DAYS = 0b1111111;

function source(trips: Trip[], patterns: Pattern[] = [fwd, bwd]): EtaSource {
  return { trips, patterns, stationIds: i => ['A', 'B', 'C'][i] };
}

describe('nextDepartures', () => {
  it('lists a future departure with correct minutesAway', () => {
    const trips: Trip[] = [{ p: 0, days: ALL_DAYS, t: 1000 }];
    const deps = nextDepartures('A', 400, 3, { source: source(trips) });
    expect(deps).toHaveLength(1);
    expect(deps[0]).toMatchObject({ line: 'blue', direction: 'fwd', destinationStationId: 'C', minutesAway: 10 });
  });

  it('excludes a trip that terminates at the queried station (no departure to give)', () => {
    // Query station C, which is the fwd pattern's terminus.
    const trips: Trip[] = [{ p: 0, days: ALL_DAYS, t: 1000 }];
    const deps = nextDepartures('C', 900, 3, { source: source(trips) });
    expect(deps).toHaveLength(0);
  });

  it('excludes departures already in the past', () => {
    const trips: Trip[] = [{ p: 0, days: ALL_DAYS, t: 1000 }];
    const deps = nextDepartures('A', 1001, 3, { source: source(trips) });
    expect(deps).toHaveLength(0);
  });

  it('sorts multiple departures by time', () => {
    const trips: Trip[] = [
      { p: 0, days: ALL_DAYS, t: 2000 },
      { p: 0, days: ALL_DAYS, t: 1000 },
      { p: 0, days: ALL_DAYS, t: 1500 },
    ];
    const deps = nextDepartures('A', 0, 3, { source: source(trips), windowMinutes: 60 });
    expect(deps.map(d => d.departureSeconds)).toEqual([1000, 1500, 2000]);
  });

  it('dedupes near-duplicate departures on the same line+direction', () => {
    const trips: Trip[] = [
      { p: 0, days: ALL_DAYS, t: 1000 },
      { p: 0, days: ALL_DAYS, t: 1030 }, // 30s later — within the dedupe window
      { p: 0, days: ALL_DAYS, t: 1400 }, // far enough apart to survive
    ];
    const deps = nextDepartures('A', 0, 3, { source: source(trips), windowMinutes: 60 });
    expect(deps.map(d => d.departureSeconds)).toEqual([1000, 1400]);
  });

  it('does not conflate opposite directions when deduping', () => {
    const trips: Trip[] = [
      { p: 0, days: ALL_DAYS, t: 1000 }, // fwd, departs A
      { p: 1, days: ALL_DAYS, t: 1000 }, // bwd pattern also touches A (as its terminus) — should be excluded, not deduped against
    ];
    const deps = nextDepartures('A', 0, 3, { source: source(trips), windowMinutes: 60 });
    // bwd's station order is [C,B,A] so A is index 2 = terminus -> excluded entirely.
    expect(deps).toHaveLength(1);
  });

  it('falls back to tomorrow when nothing is left today', () => {
    const trips: Trip[] = [{ p: 0, days: ALL_DAYS, t: 1000 }];
    // "now" is 86000s (23:53:20) on Wednesday(3) — the only trip departed long ago today.
    const deps = nextDepartures('A', 86000, 3, { source: source(trips), windowMinutes: 600 });
    expect(deps).toHaveLength(1);
    expect(deps[0].isTomorrow).toBe(true);
    // minutesAway = time remaining today (86400-86000=400s) + tomorrow's departure (1000s) = 1400s = 23.33min
    expect(deps[0].minutesAway).toBe(Math.round(1400 / 60));
  });

  it('respects the day-of-week bitmask', () => {
    const trips: Trip[] = [{ p: 0, days: 1 << 1, t: 1000 }]; // Monday only
    expect(nextDepartures('A', 0, 3, { source: source(trips) })).toHaveLength(0); // Wednesday
    expect(nextDepartures('A', 0, 1, { source: source(trips) })).toHaveLength(1); // Monday
  });
});

describe('lastTrainToday', () => {
  it('returns the latest departure per line+direction, most-imminent first', () => {
    const trips: Trip[] = [
      { p: 0, days: ALL_DAYS, t: 1000 },
      { p: 0, days: ALL_DAYS, t: 5000 }, // later fwd departure -> this is "the last train"
      { p: 1, days: ALL_DAYS, t: 500 },
    ];
    const info = lastTrainToday('A', 4000, 3, source(trips));
    const fwdEntry = info.find(i => i.direction === 'fwd')!;
    expect(fwdEntry.departureSeconds).toBe(5000);
    expect(fwdEntry.minutesRemaining).toBe(Math.round((5000 - 4000) / 60));
  });

  it('reports a negative minutesRemaining once the last train has already gone', () => {
    const trips: Trip[] = [{ p: 0, days: ALL_DAYS, t: 1000 }];
    const info = lastTrainToday('A', 2000, 3, source(trips));
    expect(info[0].minutesRemaining).toBeLessThan(0);
  });
});
