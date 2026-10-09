import { useEffect, useRef } from 'react';
import { LINE_IDS, network, requireStation } from '@/src/lib/metro/network.ts';
import { runningTrips } from '@/src/lib/metro/live.ts';
import { currentEpochMs, istSecondsOfDay, istDayOfWeek } from '@/src/lib/metro/clock.ts';
import type { LineId } from '@/src/lib/metro/types.ts';

/**
 * Schematic of the whole network with every running train as a moving point
 * of light. Geography is stylised (Gandhinagar is ~25km north, which would make
 * a true-scale map unusably tall), so each line is drawn through hand-placed
 * anchors at key station indices and the stations in between are spread evenly.
 * Trains are positioned by lerping between their from/to stations — the same
 * live data the map and line pages use.
 */

type Pt = [number, number];
const W = 400;
const H = 262;

// Keyed by station index on each line. Shared interchanges share coordinates:
// Old High Court (blue 7 / red 6), Koteshwar Road (red 15 / yellow 0), GNLU (yellow 7 / violet 0).
const ANCHORS: Record<LineId, [number, Pt][]> = {
  blue: [[0, [22, 150]], [7, [182, 160]], [11, [252, 182]], [17, [382, 214]]],
  red: [[0, [140, 248]], [6, [182, 160]], [12, [210, 100]], [15, [228, 72]]],
  yellow: [[0, [228, 72]], [7, [168, 48]], [19, [70, 20]]],
  violet: [[0, [168, 48]], [2, [218, 24]]],
};

const LINE_HEX: Record<LineId, string> = { blue: '#3D8BFF', red: '#FF4D5E', yellow: '#FFC83D', violet: '#A270FF' };

// [line, station index, label x, label y, text-anchor, emphasised]
const LABELS: [LineId, number, number, number, 'start' | 'end', boolean][] = [
  ['blue', 0, 22, 140, 'start', false],
  ['blue', 17, 382, 230, 'end', false],
  ['red', 0, 148, 253, 'start', false],
  ['blue', 7, 192, 152, 'start', true],
  ['red', 15, 238, 76, 'start', true],
  ['yellow', 7, 160, 64, 'end', true],
  ['yellow', 19, 58, 11, 'start', false],
  ['violet', 2, 226, 27, 'start', false],
];

function stationPoint(line: LineId, idx: number): Pt {
  const anchors = ANCHORS[line];
  for (let i = 0; i < anchors.length - 1; i++) {
    const [ia, a] = anchors[i];
    const [ib, b] = anchors[i + 1];
    if (idx <= ib || i === anchors.length - 2) {
      const t = Math.min(1, Math.max(0, (idx - ia) / (ib - ia)));
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
  }
  return anchors[0][1];
}

const STATION_INDEX: Record<LineId, Map<string, number>> = Object.fromEntries(
  LINE_IDS.map(line => [line, new Map(network.lines[line].stations.map((id, i) => [id, i]))])
) as Record<LineId, Map<string, number>>;

const PATHS = LINE_IDS.map(line => ({
  line,
  d: network.lines[line].stations.map((_, i) => `${i ? 'L' : 'M'}${stationPoint(line, i).join(' ')}`).join(' '),
  points: network.lines[line].stations.map((_, i) => stationPoint(line, i)),
}));

const INTERCHANGES: Pt[] = [stationPoint('blue', 7), stationPoint('red', 15), stationPoint('yellow', 7)];
const SVG_NS = 'http://www.w3.org/2000/svg';

export function NetworkPulse() {
  const trainsRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const g = trainsRef.current;
    if (!g) return;
    const dots = new Map<string, SVGCircleElement>();
    let frame = 0;

    const tick = () => {
      const ms = currentEpochMs();
      const seen = new Set<string>();
      for (const run of runningTrips(istSecondsOfDay(ms), istDayOfWeek(ms))) {
        const fi = STATION_INDEX[run.line].get(run.fromStationId);
        const ti = STATION_INDEX[run.line].get(run.toStationId);
        if (fi === undefined || ti === undefined) continue;
        const [x1, y1] = stationPoint(run.line, fi);
        const [x2, y2] = stationPoint(run.line, ti);
        let dot = dots.get(run.tripKey);
        if (!dot) {
          dot = document.createElementNS(SVG_NS, 'circle');
          dot.setAttribute('r', '3.4');
          dot.setAttribute('fill', '#fff');
          dot.setAttribute('filter', `url(#np-train-${run.line})`);
          g.appendChild(dot);
          dots.set(run.tripKey, dot);
        }
        dot.setAttribute('cx', (x1 + (x2 - x1) * run.progress).toFixed(2));
        dot.setAttribute('cy', (y1 + (y2 - y1) * run.progress).toFixed(2));
        seen.add(run.tripKey);
      }
      for (const [key, dot] of dots) {
        if (!seen.has(key)) {
          dot.remove();
          dots.delete(key);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      for (const dot of dots.values()) dot.remove();
    };
  }, []);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Live schematic of the Ahmedabad Metro network" className="block h-auto w-full">
      <defs>
        <filter id="np-line-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {LINE_IDS.map(line => (
          <filter key={line} id={`np-train-${line}`} x="-300%" y="-300%" width="700%" height="700%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={LINE_HEX[line]} />
            <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor={LINE_HEX[line]} />
          </filter>
        ))}
      </defs>

      <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" filter="url(#np-line-glow)">
        {PATHS.map(p => (
          <path key={p.line} d={p.d} stroke={LINE_HEX[p.line]} />
        ))}
      </g>

      <g fill="rgb(255 255 255 / 0.4)">
        {PATHS.flatMap(p => p.points.map(([x, y], i) => <circle key={`${p.line}-${i}`} cx={x} cy={y} r="1.3" />))}
      </g>
      <g fill="#F4F4F6">
        {PATHS.flatMap(p => [p.points[0], p.points[p.points.length - 1]]).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2.8" />
        ))}
      </g>
      <g fill="#050507" stroke="#F4F4F6" strokeWidth="1.8">
        {INTERCHANGES.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="5.5" />
        ))}
      </g>

      <g fontFamily="'Geist Mono Variable', ui-monospace, monospace" style={{ letterSpacing: '0.04em' }}>
        {LABELS.map(([line, idx, x, y, anchor, strong]) => (
          <text
            key={`${line}-${idx}`}
            x={x}
            y={y}
            textAnchor={anchor}
            fontSize={strong ? 8.5 : 7.5}
            fill={strong ? '#F4F4F6' : 'rgb(244 244 246 / 0.55)'}
          >
            {requireStation(network.lines[line].stations[idx]).name.toUpperCase()}
          </text>
        ))}
      </g>

      <g ref={trainsRef} />
    </svg>
  );
}
