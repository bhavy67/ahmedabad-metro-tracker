import type { RawTrip } from './excel-parse.ts';
import type { LineId } from '../station-master.ts';

export interface Pattern {
  line: LineId;
  direction: 'fwd' | 'bwd';
  st: number[]; // station indices into the global stations array
  arr: number[]; // seconds from trip start
  dep: number[]; // seconds from trip start
}

export interface Trip {
  p: number; // pattern index
  days: number; // bitmask, bit i = JS getDay() value i
  t: number; // start time, seconds since IST midnight
}

export function daysToBitmask(days: number[] | null): number {
  if (days === null) return 0b1111111;
  let m = 0;
  for (const d of days) m |= 1 << d;
  return m;
}

export function buildPatternsAndTrips(
  rawTrips: RawTrip[],
  stationIndex: Map<string, number>
): { patterns: Pattern[]; trips: Trip[] } {
  const patterns: Pattern[] = [];
  const patternKeyToIndex = new Map<string, number>();

  interface Interim { patternIdx: number; days: number; t: number }
  const interim: Interim[] = [];

  for (const raw of rawTrips) {
    const st = raw.stations.map(id => {
      const idx = stationIndex.get(id);
      if (idx === undefined) throw new Error(`Station not in global index: ${id}`);
      return idx;
    });
    const key = JSON.stringify({ line: raw.line, dir: raw.direction, st, arr: raw.arr, dep: raw.dep });
    let patternIdx = patternKeyToIndex.get(key);
    if (patternIdx === undefined) {
      patternIdx = patterns.length;
      patterns.push({ line: raw.line, direction: raw.direction, st, arr: raw.arr, dep: raw.dep });
      patternKeyToIndex.set(key, patternIdx);
    }
    interim.push({ patternIdx, days: daysToBitmask(raw.days), t: raw.startSeconds });
  }

  // Merge trips that share (pattern, start time) but were split across day-type groups
  // (e.g. an identical run scheduled on Mon-Fri, Saturday AND Sunday) into one trip
  // with a combined day bitmask.
  const merged = new Map<string, Trip>();
  for (const { patternIdx, days, t } of interim) {
    const key = `${patternIdx}|${t}`;
    const existing = merged.get(key);
    if (existing) existing.days |= days;
    else merged.set(key, { p: patternIdx, days, t });
  }

  return { patterns, trips: [...merged.values()].sort((a, b) => a.t - b.t) };
}
