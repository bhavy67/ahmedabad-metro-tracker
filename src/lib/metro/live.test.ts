import { describe, it, expect } from 'vitest';
import { runningTrips, type RunningTripsSource } from './live.ts';
import type { Pattern, Trip } from './types.ts';

// A tiny synthetic 4-station line: A(0) -- B(1) -- C(2) -- D(3)
// arr/dep chosen so each hop takes 100s of travel + 20s dwell at intermediate stops.
const pattern: Pattern = {
  line: 'blue',
  direction: 'fwd',
  st: [0, 1, 2, 3],
  arr: [0, 100, 220, 340],
  dep: [0, 120, 240, 340],
};

const ALL_DAYS = 0b1111111;
const WEEKDAYS_ONLY = 0b0111110; // Mon-Fri

function source(trips: Trip[], patterns: Pattern[] = [pattern]): RunningTripsSource {
  return { trips, patterns, stationIds: i => ['A', 'B', 'C', 'D'][i] };
}

describe('runningTrips: basic segment finding', () => {
  const trips: Trip[] = [{ p: 0, days: ALL_DAYS, t: 1000 }];
  const src = source(trips);

  it('is not active before departure', () => {
    expect(runningTrips(999, 3, src)).toHaveLength(0);
  });

  it('is at the origin platform at the moment of departure (zero-length origin dwell in the data)', () => {
    const runs = runningTrips(1000, 3, src);
    expect(runs).toHaveLength(1);
    // arr[0] === dep[0] === 0 in this pattern (matches real data: the first
    // stop's arrival/departure are always equal), so there is no dwell window
    // to report — it's technically "moving" with progress 0, which renders
    // at exactly station A either way.
    expect(runs[0]).toMatchObject({ status: 'moving', fromStationId: 'A', toStationId: 'B', progress: 0 });
  });

  it('is moving mid-segment with a correct progress fraction', () => {
    // elapsed = 60 -> within [0,100), status moving (dep[0]=0 so no dwell at origin)
    const runs = runningTrips(1060, 3, src);
    expect(runs[0]).toMatchObject({ status: 'moving', fromStationId: 'A', toStationId: 'B' });
    expect(runs[0].progress).toBeCloseTo(0.6, 5);
  });

  it('is dwelling at an intermediate station between arrival and departure', () => {
    // arr[1]=100, dep[1]=120 -> elapsed 100..120 is dwell at B
    const runs = runningTrips(1000 + 110, 3, src);
    expect(runs[0]).toMatchObject({ status: 'dwelling', fromStationId: 'B', toStationId: 'C', progress: 0 });
  });

  it('resumes moving right after the intermediate dwell ends', () => {
    // dep[1]=120, arr[2]=220 -> at elapsed 170, halfway through B->C
    const runs = runningTrips(1000 + 170, 3, src);
    expect(runs[0]).toMatchObject({ status: 'moving', fromStationId: 'B', toStationId: 'C' });
    expect(runs[0].progress).toBeCloseTo(0.5, 5);
  });

  it('parks at the terminus at the exact instant of arrival, with zero stops remaining', () => {
    const runs = runningTrips(1000 + 340, 3, src);
    expect(runs[0]).toMatchObject({ status: 'dwelling', fromStationId: 'D', toStationId: 'D', stopsRemaining: 0 });
  });

  it('disappears after the terminus arrival — there is no data past the last stop, so we do not invent a lingering dwell', () => {
    const runs = runningTrips(1000 + 340 + 500, 3, src);
    expect(runs).toHaveLength(0);
  });
});

describe('runningTrips: day-of-week filtering', () => {
  it('only appears on scheduled days', () => {
    const trips: Trip[] = [{ p: 0, days: WEEKDAYS_ONLY, t: 1000 }];
    const src = source(trips);
    // Wednesday (3) -> active
    expect(runningTrips(1060, 3, src)).toHaveLength(1);
    // Sunday (0) -> not active
    expect(runningTrips(1060, 0, src)).toHaveLength(0);
    // Saturday (6) -> not active
    expect(runningTrips(1060, 6, src)).toHaveLength(0);
  });
});

describe('runningTrips: midnight wraparound', () => {
  it('finds a train that started yesterday and is still running after IST midnight', () => {
    // Trip started at 86200 (23:56:40) on Wednesday (3); duration 340s -> ends at
    // 86540 real seconds, i.e. 00:02:20 on Thursday (4). Checking "now" at 100
    // seconds past Thursday midnight must find it via the yesterday-context.
    const trips: Trip[] = [{ p: 0, days: ALL_DAYS, t: 86200 }];
    const src = source(trips);
    const runs = runningTrips(100, 4, src); // Thursday, 00:01:40
    expect(runs).toHaveLength(1);
    expect(runs[0].status).toBe('moving');
  });

  it('does not leak into the wrong day when the trip is not scheduled yesterday', () => {
    // Same trip, but only scheduled on Monday (1) — Wednesday->Thursday wraparound
    // must not match even though the raw seconds-of-day line up.
    const trips: Trip[] = [{ p: 0, days: 1 << 1, t: 86200 }];
    const src = source(trips);
    expect(runningTrips(100, 4, src)).toHaveLength(0);
  });

  it('does not double count a same-day trip as also being "yesterday"', () => {
    const trips: Trip[] = [{ p: 0, days: ALL_DAYS, t: 1000 }];
    const src = source(trips);
    expect(runningTrips(1060, 3, src)).toHaveLength(1);
  });
});

describe('runningTrips: multiple simultaneous trains', () => {
  it('returns one run per concurrently active trip', () => {
    const trips: Trip[] = [
      { p: 0, days: ALL_DAYS, t: 1000 },
      { p: 0, days: ALL_DAYS, t: 1050 },
    ];
    const src = source(trips);
    const runs = runningTrips(1060, 3, src);
    expect(runs).toHaveLength(2);
  });
});
