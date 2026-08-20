export type LineId = 'blue' | 'red' | 'yellow' | 'violet';
export type Direction = 'fwd' | 'bwd';

export interface Pattern {
  line: LineId;
  direction: Direction;
  st: number[]; // station indices into TimetableFile.stations
  arr: number[]; // seconds from trip start, per stop
  dep: number[]; // seconds from trip start, per stop
}

export interface Trip {
  p: number; // pattern index
  days: number; // bitmask, bit i = JS Date#getDay() value i (0=Sun..6=Sat)
  t: number; // start time, seconds since IST midnight
}

export interface TimetableFile {
  v: number;
  generatedAt: string;
  sourceEffective: string;
  stations: string[];
  patterns: Pattern[];
  trips: Trip[];
}

export interface NetworkLine {
  name: string;
  from: string;
  to: string;
  color: string;
  colorInk: 'light' | 'dark';
  stations: string[];
  firstDeparture: string;
  lastArrival: string;
}

export interface NetworkStation {
  id: string;
  name: string;
  nameGu: string;
  nameHi: string;
  lat: number;
  lng: number;
  lines: LineId[];
  isUnderground: boolean;
  isInterchange: boolean;
}

export interface FareSlab {
  maxStations: number;
  fare: number;
}

export interface NetworkFile {
  v: number;
  generatedAt: string;
  lines: Record<LineId, NetworkLine>;
  stations: NetworkStation[];
  fareSlabs: FareSlab[];
  ncmcDiscount: number;
}

export interface SegmentEntry {
  coords: [number, number][]; // [lat, lng]
  cumMeters: number[];
  reliable: boolean;
}

export type SegmentsFile = Record<string, SegmentEntry>;

/** A currently-running train, as a pure function of (schedule, clock). */
export interface TrainRun {
  tripKey: string; // stable id: `${patternIdx}-${startSeconds}`
  line: LineId;
  direction: Direction;
  fromStationId: string;
  toStationId: string;
  fromIdx: number; // index into the pattern's station list
  status: 'dwelling' | 'moving';
  /** 0..1 fraction of the way from fromStation to toStation (0 while dwelling). */
  progress: number;
  destinationStationId: string;
  originStationId: string;
  secondsToNextStop: number;
  stopsRemaining: number;
}
