import { describe, it, expect } from 'vitest';
import { planJourney, type PlanSource } from './plan.ts';
import type { Pattern, Trip } from './types.ts';

// Stations: A(0) B(1) C(2) D(3) E(4). Line X: A-B-C. Line Y: C-D-E. Interchange at C.
const STATIONS = ['A', 'B', 'C', 'D', 'E'];
const stationIds = (i: number) => STATIONS[i];

const lineX: Pattern = { line: 'blue', direction: 'fwd', st: [0, 1, 2], arr: [0, 100, 200], dep: [0, 110, 200] };
const lineY: Pattern = { line: 'red', direction: 'fwd', st: [2, 3, 4], arr: [0, 100, 200], dep: [0, 110, 200] };
const throughRunning: Pattern = { line: 'yellow', direction: 'fwd', st: [0, 1, 2, 3, 4], arr: [0, 100, 200, 300, 400], dep: [0, 110, 210, 310, 400] };

const ALL_DAYS = 0b1111111;

function source(trips: Trip[], patterns: Pattern[]): PlanSource {
  return { trips, patterns, stationIds };
}

describe('planJourney: direct trips', () => {
  it('finds a direct single-leg journey with no interchange', () => {
    const trips: Trip[] = [{ p: 0, days: ALL_DAYS, t: 1000 }];
    const plan = planJourney('A', 'C', 500, 3, { source: source(trips, [lineX]) });
    expect(plan).not.toBeNull();
    expect(plan!.legs).toHaveLength(1);
    expect(plan!.transferCount).toBe(0);
    expect(plan!.departSeconds).toBe(1000);
    expect(plan!.arriveSeconds).toBe(1200);
    expect(plan!.durationMinutes).toBe(Math.round(200 / 60));
  });

  it('returns null for identical origin and destination', () => {
    const trips: Trip[] = [{ p: 0, days: ALL_DAYS, t: 1000 }];
    expect(planJourney('A', 'A', 0, 3, { source: source(trips, [lineX]) })).toBeNull();
  });

  it('returns null when no route exists at all', () => {
    const trips: Trip[] = [{ p: 0, days: ALL_DAYS, t: 1000 }];
    // Nothing runs to a station outside this tiny network.
    expect(planJourney('A', 'Z', 0, 3, { source: source(trips, [lineX]) })).toBeNull();
  });
});

describe('planJourney: interchanges', () => {
  it('finds a one-interchange journey and requires the transfer buffer', () => {
    // x1 arrives C at 1200. y1 departs C at 1210 — only 10s later, inside the
    // 120s default transfer buffer, so it must be skipped. y2 departs C at
    // 1400, safely clear of the buffer, and must be the one taken.
    const trips: Trip[] = [
      { p: 0, days: ALL_DAYS, t: 1000 }, // lineX: A->B->C, arrives C @ 1200
      { p: 1, days: ALL_DAYS, t: 1210 }, // lineY too-soon departure
      { p: 1, days: ALL_DAYS, t: 1400 }, // lineY safe departure
    ];
    const plan = planJourney('A', 'E', 500, 3, { source: source(trips, [lineX, lineY]) });
    expect(plan).not.toBeNull();
    expect(plan!.transferCount).toBe(1);
    expect(plan!.legs[1].departSeconds).toBe(1400); // took the later, valid connection
    expect(plan!.legs[1].departSeconds).toBeGreaterThanOrEqual(1200 + 120);
  });

  it('applies the reduced same-platform buffer between red and yellow', () => {
    const redPattern: Pattern = { line: 'red', direction: 'fwd', st: [0, 1, 2], arr: [0, 100, 200], dep: [0, 110, 200] };
    const yellowPattern: Pattern = { line: 'yellow', direction: 'fwd', st: [2, 3, 4], arr: [0, 100, 200], dep: [0, 110, 200] };
    // Yellow departs C 70s after red arrives — inside the 120s default buffer
    // but outside the reduced 60s red<->yellow buffer, so it should be caught.
    const trips: Trip[] = [
      { p: 0, days: ALL_DAYS, t: 1000 }, // red arrives C @ 1200
      { p: 1, days: ALL_DAYS, t: 1270 }, // yellow departs C @ 1270 (70s later)
    ];
    const plan = planJourney('A', 'E', 500, 3, { source: source(trips, [redPattern, yellowPattern]) });
    expect(plan).not.toBeNull();
    expect(plan!.legs[1].departSeconds).toBe(1270);
  });

  it('does not count a through-running trip as a transfer at the shared station', () => {
    const trips: Trip[] = [{ p: 0, days: ALL_DAYS, t: 1000 }];
    const plan = planJourney('A', 'E', 500, 3, { source: source(trips, [throughRunning]) });
    expect(plan).not.toBeNull();
    expect(plan!.legs).toHaveLength(1); // one continuous ride, not split at C
    expect(plan!.transferCount).toBe(0);
  });
});

describe('planJourney: fare', () => {
  it('prices by the number of stations travelled', () => {
    const trips: Trip[] = [{ p: 0, days: ALL_DAYS, t: 1000 }];
    // A->C is 2 stops.
    const plan = planJourney('A', 'C', 500, 3, { source: source(trips, [lineX]) });
    expect(plan!.fare).toBe(5); // within the <=3 station slab
  });
});

describe('planJourney: rolls over to tomorrow when nothing runs today', () => {
  it('finds tomorrow morning\'s first service and flags isTomorrow', () => {
    const trips: Trip[] = [{ p: 0, days: 1 << 4, t: 1000 }]; // Thursday only
    // "today" is Wednesday (3) -> no connections at all today; tomorrow (Thursday=4) has one.
    const plan = planJourney('A', 'C', 500, 3, { source: source(trips, [lineX]) });
    expect(plan).not.toBeNull();
    expect(plan!.isTomorrow).toBe(true);
  });
});
