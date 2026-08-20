import { timetable, stationIdAt } from './network.ts';
import type { LineId, Direction, Pattern, Trip } from './types.ts';

export interface EtaSource {
  trips: Trip[];
  patterns: Pattern[];
  stationIds: (index: number) => string;
}

const defaultSource: EtaSource = {
  trips: timetable.trips,
  patterns: timetable.patterns,
  stationIds: stationIdAt,
};

interface StopInPattern { patternIdx: number; stopIdx: number }

/** Which patterns stop at this station, and at what position (only 22 patterns total — cheap to scan). */
function findStops(stationId: string, patterns: Pattern[], stationIds: (i: number) => string): StopInPattern[] {
  const out: StopInPattern[] = [];
  patterns.forEach((pattern, patternIdx) => {
    const stopIdx = pattern.st.findIndex(si => stationIds(si) === stationId);
    if (stopIdx !== -1) out.push({ patternIdx, stopIdx });
  });
  return out;
}

export interface UpcomingDeparture {
  tripKey: string;
  line: LineId;
  direction: Direction;
  destinationStationId: string;
  /** Real clock departure time, seconds-of-day (always in [0, 86400)). */
  departureSeconds: number;
  minutesAway: number;
  isTomorrow: boolean;
}

const DEDUPE_WINDOW_SECONDS = 90;

export function nextDepartures(
  stationId: string,
  secondsOfDay: number,
  dayOfWeek: number,
  opts: { limit?: number; windowMinutes?: number; source?: EtaSource } = {}
): UpcomingDeparture[] {
  const { limit = 6, windowMinutes = 120 } = opts;
  const source = opts.source ?? defaultSource;
  const stops = findStops(stationId, source.patterns, source.stationIds);
  if (stops.length === 0) return [];

  const collect = (day: number, isTomorrow: boolean): UpcomingDeparture[] => {
    const out: UpcomingDeparture[] = [];
    for (const trip of source.trips) {
      if (!(trip.days & (1 << day))) continue;
      const stop = stops.find(s => s.patternIdx === trip.p);
      if (!stop) continue;
      const pattern = source.patterns[trip.p];
      if (stop.stopIdx === pattern.st.length - 1) continue; // terminates here, not a departure
      const departureSeconds = trip.t + pattern.dep[stop.stopIdx];
      const minutesAway = isTomorrow
        ? (86400 - secondsOfDay + departureSeconds) / 60
        : (departureSeconds - secondsOfDay) / 60;
      if (minutesAway < 0 || minutesAway > windowMinutes) continue;
      out.push({
        tripKey: `${trip.p}-${trip.t}`,
        line: pattern.line,
        direction: pattern.direction,
        destinationStationId: source.stationIds(pattern.st[pattern.st.length - 1]),
        departureSeconds,
        minutesAway: Math.round(minutesAway),
        isTomorrow,
      });
    }
    return out;
  };

  let results = collect(dayOfWeek, false).sort((a, b) => a.minutesAway - b.minutesAway);

  // If nothing is left today, fall back to tomorrow's first departures so the
  // board never goes blank right before service ends for the night.
  if (results.length === 0) {
    const tomorrow = (dayOfWeek + 1) % 7;
    results = collect(tomorrow, true).sort((a, b) => a.minutesAway - b.minutesAway);
  }

  const deduped: UpcomingDeparture[] = [];
  for (const dep of results) {
    const tooClose = deduped.some(
      d => d.line === dep.line && d.direction === dep.direction && Math.abs(d.departureSeconds - dep.departureSeconds) < DEDUPE_WINDOW_SECONDS
    );
    if (!tooClose) deduped.push(dep);
  }

  return deduped.slice(0, limit);
}

export interface LastTrainInfo {
  line: LineId;
  direction: Direction;
  destinationStationId: string;
  departureSeconds: number;
  minutesRemaining: number; // negative if it has already departed today
}

export function lastTrainToday(stationId: string, secondsOfDay: number, dayOfWeek: number, source: EtaSource = defaultSource): LastTrainInfo[] {
  const stops = findStops(stationId, source.patterns, source.stationIds);
  const byKey = new Map<string, LastTrainInfo>();

  for (const trip of source.trips) {
    if (!(trip.days & (1 << dayOfWeek))) continue;
    const stop = stops.find(s => s.patternIdx === trip.p);
    if (!stop) continue;
    const pattern = source.patterns[trip.p];
    if (stop.stopIdx === pattern.st.length - 1) continue;

    const departureSeconds = trip.t + pattern.dep[stop.stopIdx];
    const key = `${pattern.line}|${pattern.direction}`;
    const existing = byKey.get(key);
    if (!existing || departureSeconds > existing.departureSeconds) {
      byKey.set(key, {
        line: pattern.line,
        direction: pattern.direction,
        destinationStationId: source.stationIds(pattern.st[pattern.st.length - 1]),
        departureSeconds,
        minutesRemaining: Math.round((departureSeconds - secondsOfDay) / 60),
      });
    }
  }

  return [...byKey.values()].sort((a, b) => a.minutesRemaining - b.minutesRemaining);
}
