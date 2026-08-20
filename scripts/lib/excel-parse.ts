import * as XLSX from 'xlsx';
import { stationMaster, type LineId } from '../station-master.ts';
import { parseHMS } from './time.ts';

export interface RawTrip {
  trainId: string;
  line: LineId;
  direction: 'fwd' | 'bwd';
  /** JS getDay() convention: 0=Sun..6=Sat. null = every day (no Day_Type in source). */
  days: number[] | null;
  startSeconds: number; // absolute departure time, seconds since IST midnight
  stations: string[]; // station ids, in real travel order
  arr: number[]; // seconds from trip start, per station
  dep: number[]; // seconds from trip start, per station (== arr at the terminus)
}

interface ExcelRow {
  Train_ID: string;
  Day_Type?: string;
  Route?: string;
  Direction: string;
  Station_Order: number;
  Station_Name: string;
  Arrival_Time: string;
  Departure_Time: string;
}

/** Names present in the workbook that don't literally match a station's `name` field. */
const EXCEL_NAME_ALIASES: Record<string, string> = {
  'cheekanta': 'gheekanta',
  'kalupur railway station': 'kalupur',
  'robari colony': 'rabari_colony',
  'nirant cross road': 'nirant_cross_roads',
  'stadium': 'stadium', // "Stadium" (excel) vs "S P Stadium" (canonical name)
  'jivraj': 'jivraj_park',
  'rayson': 'raysan',
};

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

const nameToId = new Map<string, string>();
for (const s of stationMaster) nameToId.set(normalize(s.name), s.id);
for (const [alias, id] of Object.entries(EXCEL_NAME_ALIASES)) nameToId.set(alias, id);

function resolveStationId(excelName: string): string {
  const id = nameToId.get(normalize(excelName));
  if (!id) {
    throw new Error(
      `Unresolved station name from Excel: "${excelName}" (normalized "${normalize(excelName)}"). ` +
        `Add it to EXCEL_NAME_ALIASES in scripts/lib/excel-parse.ts.`
    );
  }
  return id;
}

const DAY_TYPE_TO_DAYS: Record<string, number[]> = {
  'Mon-Fri': [1, 2, 3, 4, 5],
  'Saturday': [6],
  'Sunday': [0],
};

function directionToFwdBwd(direction: string): 'fwd' | 'bwd' {
  switch (direction) {
    case 'Eastbound':
    case 'Northbound':
      return 'fwd';
    case 'Westbound':
    case 'Southbound':
      return 'bwd';
    default:
      throw new Error(`Unknown Direction value: "${direction}"`);
  }
}

function lineForTrainId(trainId: string): LineId {
  if (trainId.startsWith('L2-')) return 'red';
  if (trainId.startsWith('L3-')) return 'yellow';
  if (trainId.startsWith('L4-')) return 'violet';
  if (trainId.startsWith('EB-') || trainId.startsWith('WB-')) return 'blue';
  throw new Error(`Cannot infer line from Train_ID: "${trainId}"`);
}

function buildTrips(rows: ExcelRow[], groupKey: (r: ExcelRow) => string, days: (r: ExcelRow) => number[] | null): RawTrip[] {
  const groups = new Map<string, ExcelRow[]>();
  for (const row of rows) {
    const key = groupKey(row);
    let list = groups.get(key);
    if (!list) { list = []; groups.set(key, list); }
    list.push(row);
  }

  const trips: RawTrip[] = [];
  for (const [key, groupRows] of groups) {
    groupRows.sort((a, b) => a.Station_Order - b.Station_Order);
    const first = groupRows[0];
    const startSeconds = parseHMS(first.Departure_Time === 'TERMINUS' ? first.Arrival_Time : first.Departure_Time);
    const line = lineForTrainId(first.Train_ID);
    const direction = directionToFwdBwd(first.Direction);

    const stations: string[] = [];
    const arr: number[] = [];
    const dep: number[] = [];

    for (const row of groupRows) {
      const stationId = resolveStationId(row.Station_Name);
      let a = parseHMS(row.Arrival_Time) - startSeconds;
      if (a < -3600) a += 86400; // defensive: trip crossing midnight
      const isTerminus = row.Departure_Time === 'TERMINUS';
      let d = isTerminus ? a : parseHMS(row.Departure_Time) - startSeconds;
      if (d < -3600) d += 86400;
      stations.push(stationId);
      arr.push(a);
      dep.push(d);
    }

    trips.push({ trainId: key, line, direction, days: days(first), startSeconds, stations, arr, dep });
  }
  return trips;
}

export function parseExcel(path: string): RawTrip[] {
  const wb = XLSX.readFile(path);

  const l1 = XLSX.utils.sheet_to_json<ExcelRow>(wb.Sheets['Line_1_East_West'], { defval: null });
  const nb = XLSX.utils.sheet_to_json<ExcelRow>(wb.Sheets['Lines_2_3_4_Northbound'], { defval: null });
  const sb = XLSX.utils.sheet_to_json<ExcelRow>(wb.Sheets['Lines_2_3_4_Southbound'], { defval: null });

  const blueTrips = buildTrips(
    l1,
    r => `${r.Train_ID}_${r.Day_Type}`,
    r => DAY_TYPE_TO_DAYS[r.Day_Type!] ?? null
  );

  const corridorTrips = buildTrips(
    [...nb, ...sb],
    r => r.Train_ID,
    () => null // no Day_Type column -> runs every day
  );

  return [...blueTrips, ...corridorTrips];
}
