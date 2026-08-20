/**
 * Journey planning via the Connection Scan Algorithm (CSA): flatten every
 * trip into single-hop "connections", sort by departure time, sweep once.
 * The whole network only has ~22 stop patterns and a few hundred trips a
 * day, so a full daily scan per query is cheap — no precomputed graph needed.
 */

import { timetable, stationIdAt } from './network.ts';
import { fareForStations } from './fare.ts';
import type { LineId, Direction, Pattern, Trip } from './types.ts';

export interface PlanSource {
  trips: Trip[];
  patterns: Pattern[];
  stationIds: (index: number) => string;
}

const defaultSource: PlanSource = {
  trips: timetable.trips,
  patterns: timetable.patterns,
  stationIds: stationIdAt,
};

interface Connection {
  tripKey: string;
  line: LineId;
  direction: Direction;
  depStationId: string;
  depTime: number;
  arrStationId: string;
  arrTime: number;
}

const DEFAULT_TRANSFER_SECONDS = 120;
/** Red<->Yellow share the same physical trunk/platform at Koteshwar Road. */
const SAME_PLATFORM_TRANSFER_SECONDS = 60;

function transferBufferSeconds(fromLine: LineId, toLine: LineId): number {
  const samePlatformPair = new Set([`red|yellow`, `yellow|red`]);
  return samePlatformPair.has(`${fromLine}|${toLine}`) ? SAME_PLATFORM_TRANSFER_SECONDS : DEFAULT_TRANSFER_SECONDS;
}

function buildConnections(day: number, source: PlanSource): Connection[] {
  const connections: Connection[] = [];
  for (const trip of source.trips) {
    if (!(trip.days & (1 << day))) continue;
    const pattern = source.patterns[trip.p];
    for (let i = 0; i < pattern.st.length - 1; i++) {
      connections.push({
        tripKey: `${trip.p}-${trip.t}`,
        line: pattern.line,
        direction: pattern.direction,
        depStationId: source.stationIds(pattern.st[i]),
        depTime: trip.t + pattern.dep[i],
        arrStationId: source.stationIds(pattern.st[i + 1]),
        arrTime: trip.t + pattern.arr[i + 1],
      });
    }
  }
  connections.sort((a, b) => a.depTime - b.depTime);
  return connections;
}

export interface JourneyLeg {
  tripKey: string;
  line: LineId;
  direction: Direction;
  boardStationId: string;
  alightStationId: string;
  departSeconds: number;
  arriveSeconds: number;
  stops: string[]; // station ids, board to alight inclusive
}

export interface JourneyPlan {
  originStationId: string;
  destinationStationId: string;
  departSeconds: number;
  arriveSeconds: number;
  durationMinutes: number;
  legs: JourneyLeg[];
  transferCount: number;
  isTomorrow: boolean;
  fare: number;
}

/** Run CSA for a single day's connection set. Returns the reconstructed plan, or null if unreachable. */
function planForDay(
  originStationId: string,
  destinationStationId: string,
  departAt: number,
  connections: Connection[]
): { arriveSeconds: number; legs: JourneyLeg[] } | null {
  const earliestArrival = new Map<string, number>([[originStationId, departAt]]);
  const arrivedVia = new Map<string, Connection>(); // station -> the connection that got us there

  for (const conn of connections) {
    if (conn.depTime < departAt) continue;

    const bestSoFarAtDep = earliestArrival.get(conn.depStationId);
    if (bestSoFarAtDep === undefined || bestSoFarAtDep > conn.depTime) continue;

    const arrivingConn = arrivedVia.get(conn.depStationId);
    const isContinuationOfSameTrip = arrivingConn?.tripKey === conn.tripKey;
    if (!isContinuationOfSameTrip && conn.depStationId !== originStationId) {
      const buffer = arrivingConn ? transferBufferSeconds(arrivingConn.line, conn.line) : 0;
      if (conn.depTime < bestSoFarAtDep + buffer) continue;
    }

    const knownArrival = earliestArrival.get(conn.arrStationId);
    if (knownArrival === undefined || conn.arrTime < knownArrival) {
      earliestArrival.set(conn.arrStationId, conn.arrTime);
      arrivedVia.set(conn.arrStationId, conn);
    }
  }

  if (!earliestArrival.has(destinationStationId) || destinationStationId === originStationId) return null;

  // Reconstruct the connection chain, then group consecutive same-trip hops into legs.
  const chain: Connection[] = [];
  let cursor: string | undefined = destinationStationId;
  while (cursor && cursor !== originStationId) {
    const conn = arrivedVia.get(cursor);
    if (!conn) break;
    chain.unshift(conn);
    cursor = conn.depStationId;
  }

  const legs: JourneyLeg[] = [];
  for (const conn of chain) {
    const last = legs.at(-1);
    if (last && last.tripKey === conn.tripKey) {
      last.alightStationId = conn.arrStationId;
      last.arriveSeconds = conn.arrTime;
      last.stops.push(conn.arrStationId);
    } else {
      legs.push({
        tripKey: conn.tripKey,
        line: conn.line,
        direction: conn.direction,
        boardStationId: conn.depStationId,
        alightStationId: conn.arrStationId,
        departSeconds: conn.depTime,
        arriveSeconds: conn.arrTime,
        stops: [conn.depStationId, conn.arrStationId],
      });
    }
  }

  return { arriveSeconds: earliestArrival.get(destinationStationId)!, legs };
}

export function planJourney(
  originStationId: string,
  destinationStationId: string,
  secondsOfDay: number,
  dayOfWeek: number,
  opts: { source?: PlanSource } = {}
): JourneyPlan | null {
  if (originStationId === destinationStationId) return null;
  const source = opts.source ?? defaultSource;

  const todayConns = buildConnections(dayOfWeek, source);
  let result = planForDay(originStationId, destinationStationId, secondsOfDay, todayConns);
  let isTomorrow = false;
  let departAt = secondsOfDay;

  if (!result) {
    const tomorrow = (dayOfWeek + 1) % 7;
    const tomorrowConns = buildConnections(tomorrow, source);
    result = planForDay(originStationId, destinationStationId, 0, tomorrowConns);
    isTomorrow = true;
    departAt = 0;
  }

  if (!result) return null;

  const totalStops = result.legs.reduce((sum, leg) => sum + leg.stops.length - 1, 0);

  return {
    originStationId,
    destinationStationId,
    departSeconds: result.legs[0]?.departSeconds ?? departAt,
    arriveSeconds: result.arriveSeconds,
    durationMinutes: Math.round((result.arriveSeconds - (result.legs[0]?.departSeconds ?? departAt)) / 60),
    legs: result.legs,
    transferCount: Math.max(0, result.legs.length - 1),
    isTomorrow,
    fare: fareForStations(totalStops),
  };
}
