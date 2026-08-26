/**
 * The single source of truth for "where is every train right now". Pure
 * function of (schedule, clock) — no state, no network, no interval. Every
 * surface in the app (map, station boards, train detail sheets) calls this
 * same function, so they can never disagree with each other.
 *
 * Compare to the reference project, which had three independent
 * reimplementations of this that disagreed (and one that was outright
 * broken — it forgot to subtract the trip's start time).
 */

import { timetable, stationIdAt, segmentBetween } from './network.ts';
import type { Pattern, Trip, TrainRun } from './types.ts';
import { haversineMeters, bearingDegrees } from './geo.ts';

export interface RunningTripsSource {
  trips: Trip[];
  patterns: Pattern[];
  stationIds: (index: number) => string;
}

const defaultSource: RunningTripsSource = {
  trips: timetable.trips,
  patterns: timetable.patterns,
  stationIds: stationIdAt,
};

/**
 * All trains active at a given instant, expressed as IST seconds-of-day plus
 * the IST day-of-week (0=Sun..6=Sat) that seconds-of-day belongs to.
 *
 * Handles midnight correctly: a trip that started late "yesterday" and whose
 * journey time carries it past midnight is still returned when checking
 * early-morning "today" instants — the reference's equivalent function
 * compared raw minute-of-day and silently dropped such trains.
 */
export function runningTrips(secondsOfDay: number, dayOfWeek: number, source: RunningTripsSource = defaultSource): TrainRun[] {
  const runs: TrainRun[] = [];
  const yesterday = (dayOfWeek + 6) % 7;

  for (const trip of source.trips) {
    const pattern = source.patterns[trip.p];
    const duration = pattern.arr[pattern.arr.length - 1];

    for (const [day, offset] of [[dayOfWeek, 0], [yesterday, -86400]] as const) {
      if (!(trip.days & (1 << day))) continue;
      const start = trip.t + offset;
      const end = start + duration;
      if (secondsOfDay < start || secondsOfDay > end) continue;

      const run = trainRunAt(trip, pattern, secondsOfDay - start, source.stationIds);
      if (run) runs.push(run);
    }
  }

  return runs;
}

function trainRunAt(trip: Trip, pattern: Pattern, elapsed: number, stationIds: (i: number) => string): TrainRun | null {
  const n = pattern.st.length;
  const lastIdx = n - 1;
  const tripKey = `${trip.p}-${trip.t}`;

  if (elapsed >= pattern.arr[lastIdx]) {
    // Arrived at (or past) the terminus. No further travel data exists past
    // this point, so the train is simply parked there.
    const stationId = stationIds(pattern.st[lastIdx]);
    return {
      tripKey,
      line: pattern.line,
      direction: pattern.direction,
      fromStationId: stationId,
      toStationId: stationId,
      fromIdx: lastIdx,
      status: 'dwelling',
      progress: 0,
      destinationStationId: stationId,
      originStationId: stationIds(pattern.st[0]),
      secondsToNextStop: 0,
      secondsToNextArrival: 0,
      stopsRemaining: 0,
    };
  }

  // Find i such that arr[i] <= elapsed < arr[i+1].
  let i = 0;
  for (; i < lastIdx - 1; i++) {
    if (elapsed < pattern.arr[i + 1]) break;
  }

  const fromStationId = stationIds(pattern.st[i]);
  const toStationId = stationIds(pattern.st[i + 1]);
  const depFromFrom = pattern.dep[i];
  const arrAtTo = pattern.arr[i + 1];

  let status: 'dwelling' | 'moving';
  let progress: number;
  let secondsToNextStop: number;

  if (elapsed < depFromFrom) {
    status = 'dwelling';
    progress = 0;
    secondsToNextStop = depFromFrom - elapsed;
  } else {
    status = 'moving';
    const travelDuration = arrAtTo - depFromFrom;
    progress = travelDuration > 0 ? (elapsed - depFromFrom) / travelDuration : 1;
    progress = Math.max(0, Math.min(1, progress));
    secondsToNextStop = arrAtTo - elapsed;
  }

  return {
    tripKey,
    line: pattern.line,
    direction: pattern.direction,
    fromStationId,
    toStationId,
    fromIdx: i,
    status,
    progress,
    destinationStationId: stationIds(pattern.st[lastIdx]),
    originStationId: stationIds(pattern.st[0]),
    secondsToNextStop,
    secondsToNextArrival: arrAtTo - elapsed,
    stopsRemaining: lastIdx - i,
  };
}

export interface TrainPosition {
  lat: number;
  lng: number;
  bearingDeg: number;
  reliableGeometry: boolean;
}

const BEARING_LOOKAHEAD_METERS = 40;

/** Arc-length position of a running train along its real track geometry. */
export function positionOf(run: TrainRun): TrainPosition {
  const { coords, cumMeters, totalMeters, reliable } = segmentBetween(run.fromStationId, run.toStationId);

  if (run.status === 'dwelling' || totalMeters === 0) {
    const [lat, lng] = coords[run.progress > 0.5 ? coords.length - 1 : 0];
    const bearing = bearingAt(coords, 0);
    return { lat, lng, bearingDeg: bearing, reliableGeometry: reliable };
  }

  const targetDist = totalMeters * run.progress;
  let i = 0;
  while (i < cumMeters.length - 2 && cumMeters[i + 1] < targetDist) i++;

  const segLen = cumMeters[i + 1] - cumMeters[i];
  const segFrac = segLen > 0 ? (targetDist - cumMeters[i]) / segLen : 0;
  const [latA, lngA] = coords[i];
  const [latB, lngB] = coords[i + 1];
  const lat = latA + (latB - latA) * segFrac;
  const lng = lngA + (lngB - lngA) * segFrac;

  return { lat, lng, bearingDeg: bearingAt(coords, i, [lat, lng]), reliableGeometry: reliable };
}

/** Bearing looking a short distance ahead, so it doesn't jitter on dense polylines. */
function bearingAt(coords: [number, number][], fromIdx: number, from?: [number, number]): number {
  const start = from ?? coords[fromIdx];
  let j = fromIdx + 1;
  let acc = 0;
  let prev = start;
  while (j < coords.length) {
    acc += haversineMeters(prev, coords[j]);
    if (acc >= BEARING_LOOKAHEAD_METERS || j === coords.length - 1) {
      return bearingDegrees(start, coords[j]);
    }
    prev = coords[j];
    j++;
  }
  return coords.length > 1 ? bearingDegrees(coords[0], coords[coords.length - 1]) : 0;
}
