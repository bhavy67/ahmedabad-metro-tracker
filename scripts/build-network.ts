import { mkdirSync, writeFileSync } from 'node:fs';
import { stationMaster, stationById, LINE_META, LINE_ORDER, type LineId } from './station-master.ts';
import { parseExcel } from './lib/excel-parse.ts';
import { buildPatternsAndTrips } from './lib/patterns.ts';
import { loadTrackGraph, nearestNode, shortestPath, simplify, cumulativeDistances, haversine, type LatLng } from './lib/geometry.ts';
import { formatHMS } from './lib/time.ts';

const OUT_DIR = new URL('../src/data/generated/', import.meta.url);
mkdirSync(OUT_DIR, { recursive: true });

const EXCEL_PATH = new URL('../data-source/Ahmedabad_Metro_Master_Database_V2.xlsx', import.meta.url).pathname;
const GEOJSON_PATHS = [
  new URL('../data-source/osm/metroRoutes.geojson', import.meta.url).pathname,
  new URL('../data-source/osm/blueLineRoutes.geojson', import.meta.url).pathname,
  new URL('../data-source/osm/yellowLineRoutes.geojson', import.meta.url).pathname,
];

const generatedAt = new Date().toISOString();

// ---------------------------------------------------------------------------
// 1. Timetable: Excel -> deduplicated patterns + trips
// ---------------------------------------------------------------------------

const stationIds = stationMaster.map(s => s.id);
const stationIndex = new Map(stationIds.map((id, i) => [id, i]));

const rawTrips = parseExcel(EXCEL_PATH);
const { patterns, trips } = buildPatternsAndTrips(rawTrips, stationIndex);

const timetable = {
  v: 1,
  generatedAt,
  // The workbook's own content has no explicit "effective from" date; GMRC's
  // publicly posted timetable image is dated 18 May 2026 — recorded here so
  // the app can show real provenance and this can be re-verified later.
  sourceEffective: '2026-05-18 (unverified against source workbook — see README)',
  stations: stationIds,
  patterns,
  trips,
};

writeFileSync(new URL('timetable.json', OUT_DIR), JSON.stringify(timetable));
console.log(`timetable.json: ${rawTrips.length} raw trips -> ${patterns.length} patterns, ${trips.length} trips`);

// ---------------------------------------------------------------------------
// 2. Network: stations, lines, fares, computed service hours
// ---------------------------------------------------------------------------

function tripDurationSeconds(patternIdx: number): number {
  const p = patterns[patternIdx];
  return p.arr[p.arr.length - 1];
}

const serviceHours: Record<LineId, { firstDeparture: string; lastArrival: string }> = {} as never;
for (const line of Object.keys(LINE_META) as LineId[]) {
  const lineTrips = trips.filter(t => patterns[t.p].line === line);
  const first = Math.min(...lineTrips.map(t => t.t));
  const last = Math.max(...lineTrips.map(t => t.t + tripDurationSeconds(t.p)));
  serviceHours[line] = { firstDeparture: formatHMS(first), lastArrival: formatHMS(last) };
}

const network = {
  v: 1,
  generatedAt,
  lines: Object.fromEntries(
    (Object.keys(LINE_META) as LineId[]).map(line => [
      line,
      { ...LINE_META[line], stations: LINE_ORDER[line], ...serviceHours[line] },
    ])
  ),
  stations: stationMaster.map(s => ({
    id: s.id,
    name: s.name,
    nameGu: s.nameGu,
    nameHi: s.nameHi,
    lat: s.lat,
    lng: s.lng,
    lines: s.lines,
    isUnderground: s.isUnderground ?? false,
    isInterchange: s.isInterchange ?? false,
  })),
  // GMRC single-journey token fare: a station-count slab, applied to the
  // number of stations traversed (inclusive of interchanges) on the shortest
  // path. Source: published Yellow Line fare chart (yometro.com), corroborated
  // by the general GMRC fare structure referenced across secondary sources.
  fareSlabs: [
    { maxStations: 3, fare: 5 },
    { maxStations: 6, fare: 10 },
    { maxStations: 10, fare: 15 },
    { maxStations: 15, fare: 20 },
    { maxStations: 9999, fare: 25 }, // catch-all for any longer journey
  ],
  ncmcDiscount: 0.1,
};

writeFileSync(new URL('network.json', OUT_DIR), JSON.stringify(network));
console.log(`network.json: ${stationMaster.length} stations, 4 lines`);

// ---------------------------------------------------------------------------
// 3. Segments: OSM track geometry -> per-adjacent-pair polylines
// ---------------------------------------------------------------------------

console.log('Loading OSM track graph...');
const graph = loadTrackGraph(GEOJSON_PATHS);
console.log(`  graph: ${graph.nodes.size} nodes`);

const adjacentPairs = new Set<string>();
for (const line of Object.keys(LINE_ORDER) as LineId[]) {
  const order = LINE_ORDER[line];
  for (let i = 0; i < order.length - 1; i++) adjacentPairs.add(`${order[i]}__${order[i + 1]}`);
}

const SNAP_RADIUS_M = 300;
const segments: Record<string, { coords: LatLng[]; cumMeters: number[]; reliable: boolean }> = {};

for (const pairKey of adjacentPairs) {
  const [aId, bId] = pairKey.split('__');
  const a = stationById.get(aId)!;
  const b = stationById.get(bId)!;
  const aPoint: LatLng = [a.lat, a.lng];
  const bPoint: LatLng = [b.lat, b.lng];

  const aNode = nearestNode(graph, aPoint, SNAP_RADIUS_M);
  const bNode = nearestNode(graph, bPoint, SNAP_RADIUS_M);

  let coords: LatLng[] | null = null;
  if (aNode && bNode) {
    coords = shortestPath(graph, aNode, bNode);
  }

  let reliable = true;
  if (!coords || coords.length < 2) {
    coords = [aPoint, bPoint];
    reliable = false;
  } else {
    // Snap the endpoints to the exact station coordinate.
    coords[0] = aPoint;
    coords[coords.length - 1] = bPoint;
    coords = simplify(coords, 5);
    // Sanity: a stitched path shouldn't be much longer than the straight line.
    // An audit across all 53 segments showed a sharp natural gap between
    // genuine (mildly curved) paths — max ~1.43x — and bad graph bridges that
    // snapped onto a distant, wrong OSM fragment (2.33x and up, one as bad as
    // 4.73x for a 576m hop). 1.5x with a small flat allowance for short
    // segments sits cleanly in that gap.
    const straight = haversine(aPoint, bPoint);
    const stitched = cumulativeDistances(coords).at(-1)!;
    if (stitched > straight * 1.5 + 150) {
      coords = [aPoint, bPoint];
      reliable = false;
    }
  }

  segments[pairKey] = { coords, cumMeters: cumulativeDistances(coords), reliable };
}

const unreliableCount = Object.values(segments).filter(s => !s.reliable).length;
writeFileSync(new URL('segments.json', OUT_DIR), JSON.stringify(segments));
console.log(`segments.json: ${adjacentPairs.size} segments (${unreliableCount} fell back to straight-line)`);

console.log('\nDone.');
