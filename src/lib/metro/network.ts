import networkJson from '@/src/data/generated/network.json';
import timetableJson from '@/src/data/generated/timetable.json';
import segmentsJson from '@/src/data/generated/segments.json';
import type { NetworkFile, NetworkStation, TimetableFile, SegmentsFile, LineId } from './types.ts';

export const network = networkJson as unknown as NetworkFile;
export const timetable = timetableJson as unknown as TimetableFile;
export const segments = segmentsJson as unknown as SegmentsFile;

export const LINE_IDS: LineId[] = ['blue', 'red', 'yellow', 'violet'];

const stationIndex = new Map<string, NetworkStation>(network.stations.map(s => [s.id, s]));

export function getStation(id: string): NetworkStation | undefined {
  return stationIndex.get(id);
}

export function requireStation(id: string): NetworkStation {
  const s = stationIndex.get(id);
  if (!s) throw new Error(`Unknown station id: ${id}`);
  return s;
}

export function allStations(): NetworkStation[] {
  return network.stations;
}

export function stationsOnLine(line: LineId): NetworkStation[] {
  return network.lines[line].stations.map(requireStation);
}

export function interchangeStations(): NetworkStation[] {
  return network.stations.filter(s => s.isInterchange);
}

const stationNameIndex = timetable.stations; // index -> station id, shared by all patterns

export function stationIdAt(index: number): string {
  const id = stationNameIndex[index];
  if (!id) throw new Error(`Station index out of range: ${index}`);
  return id;
}

/** Undirected segment lookup; returns coords oriented from `a` to `b`. */
export function segmentBetween(a: string, b: string): { coords: [number, number][]; cumMeters: number[]; totalMeters: number; reliable: boolean } {
  const forward = segments[`${a}__${b}`];
  if (forward) {
    return { coords: forward.coords, cumMeters: forward.cumMeters, totalMeters: forward.cumMeters.at(-1) ?? 0, reliable: forward.reliable };
  }
  const reverse = segments[`${b}__${a}`];
  if (reverse) {
    const coords = [...reverse.coords].reverse();
    const total = reverse.cumMeters.at(-1) ?? 0;
    const cumMeters = [...reverse.cumMeters].reverse().map(d => total - d);
    return { coords, cumMeters, totalMeters: total, reliable: reverse.reliable };
  }
  // Should never happen given verify-network.ts guarantees; fail safe with a straight line.
  const sa = getStation(a);
  const sb = getStation(b);
  if (!sa || !sb) throw new Error(`segmentBetween: unknown stations ${a} / ${b}`);
  return { coords: [[sa.lat, sa.lng], [sb.lat, sb.lng]], cumMeters: [0, 0], totalMeters: 0, reliable: false };
}
