import { LINE_ORDER, type LineId } from './station-master.ts';

const OUT_DIR = new URL('../src/data/generated/', import.meta.url);

interface Pattern { line: LineId; direction: 'fwd' | 'bwd'; st: number[]; arr: number[]; dep: number[] }
interface Trip { p: number; days: number; t: number }
interface Timetable { stations: string[]; patterns: Pattern[]; trips: Trip[] }
interface NetworkStation { id: string; lines: LineId[]; isInterchange: boolean }
interface NetworkFile { lines: Record<LineId, { stations: string[] }>; stations: NetworkStation[] }

const timetable: Timetable = await Bun.file(new URL('timetable.json', OUT_DIR)).json();
const network: NetworkFile = await Bun.file(new URL('network.json', OUT_DIR)).json();
const segments: Record<string, unknown> = await Bun.file(new URL('segments.json', OUT_DIR)).json();

const failures: string[] = [];
function check(cond: boolean, message: string) {
  if (!cond) failures.push(message);
}

// 1. Every station id used anywhere resolves against the station list.
const stationSet = new Set(timetable.stations);
check(stationSet.size === timetable.stations.length, 'Duplicate station ids in timetable.stations');
check(network.stations.length === timetable.stations.length, 'network.json / timetable.json station count mismatch');

// 2. Global adjacency: every consecutive pair within every pattern must be a
//    real physical adjacency on SOME line (through-running trips span more
//    than one line's own station list, so we check against the union).
const globalAdjacency = new Set<string>();
for (const line of Object.keys(LINE_ORDER) as LineId[]) {
  const order = LINE_ORDER[line];
  for (let i = 0; i < order.length - 1; i++) {
    globalAdjacency.add(`${order[i]}__${order[i + 1]}`);
    globalAdjacency.add(`${order[i + 1]}__${order[i]}`);
  }
}

for (const [idx, pattern] of timetable.patterns.entries()) {
  for (let i = 0; i < pattern.st.length - 1; i++) {
    const a = timetable.stations[pattern.st[i]];
    const b = timetable.stations[pattern.st[i + 1]];
    check(globalAdjacency.has(`${a}__${b}`), `Pattern ${idx} (${pattern.line}/${pattern.direction}): "${a}" -> "${b}" is not a real adjacency`);
  }

  // 3. arr[i] <= dep[i] <= arr[i+1], monotonic non-decreasing overall.
  for (let i = 0; i < pattern.arr.length; i++) {
    check(pattern.arr[i] <= pattern.dep[i], `Pattern ${idx}: arr[${i}] (${pattern.arr[i]}) > dep[${i}] (${pattern.dep[i]})`);
    if (i > 0) check(pattern.dep[i - 1] <= pattern.arr[i], `Pattern ${idx}: dep[${i - 1}] (${pattern.dep[i - 1]}) > arr[${i}] (${pattern.arr[i]})`);
  }
  check(pattern.arr[0] === 0, `Pattern ${idx}: arr[0] must be 0, got ${pattern.arr[0]}`);
}

// 4. No two trips on the same line+direction+day depart at the exact same second.
const slotSeen = new Map<string, string>();
for (const trip of timetable.trips) {
  const pattern = timetable.patterns[trip.p];
  for (let day = 0; day < 7; day++) {
    if (!(trip.days & (1 << day))) continue;
    const key = `${pattern.line}|${pattern.direction}|day${day}|t${trip.t}`;
    const prior = slotSeen.get(key);
    if (prior) failures.push(`Duplicate departure slot: ${key} (trip ${prior} and another)`);
    else slotSeen.set(key, `p${trip.p}`);
  }
}

// 5. Every global adjacency pair has a segment polyline.
for (const pairKey of globalAdjacency) {
  const [a, b] = pairKey.split('__');
  const forward = `${a}__${b}`;
  const reverse = `${b}__${a}`;
  check(pairKey in segments || forward in segments || reverse in segments, `No segment geometry for ${pairKey}`);
}

// 6. Every station belongs to at least one line; interchange flag matches multi-line membership.
for (const s of network.stations) {
  check(s.lines.length >= 1, `Station ${s.id} has no line membership`);
  const shouldBeInterchange = s.lines.length > 1;
  check(s.isInterchange === shouldBeInterchange, `Station ${s.id}: isInterchange=${s.isInterchange} but lines=${s.lines.join(',')}`);
}

// 7. Trip count sanity.
check(timetable.trips.length > 0, 'No trips generated');
check(timetable.patterns.length > 0, 'No patterns generated');

console.log(`Checked ${timetable.patterns.length} patterns, ${timetable.trips.length} trips, ${network.stations.length} stations, ${Object.keys(segments).length} segments.`);

if (failures.length > 0) {
  console.error(`\n${failures.length} INVARIANT FAILURES:`);
  for (const f of failures.slice(0, 50)) console.error(`  - ${f}`);
  if (failures.length > 50) console.error(`  ... and ${failures.length - 50} more`);
  process.exit(1);
}

console.log('All invariants passed.');
