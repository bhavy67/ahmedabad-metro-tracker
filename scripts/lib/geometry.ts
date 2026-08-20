import { readFileSync } from 'node:fs';
import type { FeatureCollection, LineString } from 'geojson';

export type LatLng = [number, number]; // [lat, lng]

const EARTH_RADIUS_M = 6371000;

export function haversine(a: LatLng, b: LatLng): number {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(s));
}

function nodeKey([lat, lng]: LatLng): string {
  return `${lat.toFixed(6)},${lng.toFixed(6)}`;
}

interface Graph {
  nodes: Map<string, LatLng>;
  adj: Map<string, Array<{ to: string; dist: number }>>;
}

function addEdge(g: Graph, a: LatLng, b: LatLng) {
  const ka = nodeKey(a);
  const kb = nodeKey(b);
  if (ka === kb) return;
  if (!g.nodes.has(ka)) g.nodes.set(ka, a);
  if (!g.nodes.has(kb)) g.nodes.set(kb, b);
  const d = haversine(a, b);
  (g.adj.get(ka) ?? g.adj.set(ka, []).get(ka)!).push({ to: kb, dist: d });
  (g.adj.get(kb) ?? g.adj.set(kb, []).get(kb)!).push({ to: ka, dist: d });
}

/** Load every LineString (track way or route relation) from the given GeoJSON files into one graph. */
export function loadTrackGraph(paths: string[]): Graph {
  const g: Graph = { nodes: new Map(), adj: new Map() };
  const endpoints: LatLng[] = [];

  for (const path of paths) {
    const fc = JSON.parse(readFileSync(path, 'utf8')) as FeatureCollection;
    for (const feature of fc.features) {
      if (feature.geometry.type !== 'LineString') continue;
      const coords = (feature.geometry as LineString).coordinates.map(
        ([lng, lat]) => [lat, lng] as LatLng
      );
      for (let i = 0; i < coords.length - 1; i++) addEdge(g, coords[i], coords[i + 1]);
      if (coords.length > 0) {
        endpoints.push(coords[0]);
        endpoints.push(coords[coords.length - 1]);
      }
    }
  }

  // Bridge nearby endpoints from different ways (OSM exports are frequently fragmented).
  const SNAP_RADIUS_M = 30;
  for (let i = 0; i < endpoints.length; i++) {
    for (let j = i + 1; j < endpoints.length; j++) {
      const a = endpoints[i];
      const b = endpoints[j];
      if (nodeKey(a) === nodeKey(b)) continue;
      const d = haversine(a, b);
      if (d > 0 && d <= SNAP_RADIUS_M) addEdge(g, a, b);
    }
  }

  return g;
}

/** Nearest graph node to a point, within maxDist metres. Returns null if none found. */
export function nearestNode(g: Graph, point: LatLng, maxDist: number): string | null {
  let best: string | null = null;
  let bestDist = Infinity;
  for (const [key, node] of g.nodes) {
    const d = haversine(point, node);
    if (d < bestDist) { bestDist = d; best = key; }
  }
  return bestDist <= maxDist ? best : null;
}

/** Minimal binary min-heap keyed by priority. */
class MinHeap<T> {
  private heap: Array<{ p: number; v: T }> = [];
  push(v: T, p: number) {
    this.heap.push({ p, v });
    let i = this.heap.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.heap[parent].p <= this.heap[i].p) break;
      [this.heap[parent], this.heap[i]] = [this.heap[i], this.heap[parent]];
      i = parent;
    }
  }
  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1, r = i * 2 + 2;
        let smallest = i;
        if (l < this.heap.length && this.heap[l].p < this.heap[smallest].p) smallest = l;
        if (r < this.heap.length && this.heap[r].p < this.heap[smallest].p) smallest = r;
        if (smallest === i) break;
        [this.heap[smallest], this.heap[i]] = [this.heap[i], this.heap[smallest]];
        i = smallest;
      }
    }
    return top.v;
  }
  get size() { return this.heap.length; }
}

/** Dijkstra shortest path between two node keys. Returns ordered LatLng path, or null. */
export function shortestPath(g: Graph, fromKey: string, toKey: string): LatLng[] | null {
  const dist = new Map<string, number>([[fromKey, 0]]);
  const prev = new Map<string, string>();
  const visited = new Set<string>();
  const heap = new MinHeap<string>();
  heap.push(fromKey, 0);

  while (heap.size > 0) {
    const u = heap.pop()!;
    if (visited.has(u)) continue;
    visited.add(u);
    if (u === toKey) break;

    for (const { to, dist: w } of g.adj.get(u) ?? []) {
      if (visited.has(to)) continue;
      const nd = (dist.get(u) ?? Infinity) + w;
      if (nd < (dist.get(to) ?? Infinity)) {
        dist.set(to, nd);
        prev.set(to, u);
        heap.push(to, nd);
      }
    }
  }

  if (!dist.has(toKey)) return null;
  const path: LatLng[] = [];
  let cur: string | undefined = toKey;
  while (cur) {
    path.unshift(g.nodes.get(cur)!);
    cur = cur === fromKey ? undefined : prev.get(cur);
  }
  return path;
}

/** Douglas-Peucker polyline simplification (planar approximation is fine at this scale). */
export function simplify(points: LatLng[], toleranceMeters: number): LatLng[] {
  if (points.length <= 2) return points;

  function perpendicularDist(p: LatLng, a: LatLng, b: LatLng): number {
    if (a[0] === b[0] && a[1] === b[1]) return haversine(p, a);
    // Project in a local metre-flat approximation around `a`.
    const mPerDegLat = 111320;
    const mPerDegLng = 111320 * Math.cos((a[0] * Math.PI) / 180);
    const ax = 0, ay = 0;
    const bx = (b[1] - a[1]) * mPerDegLng, by = (b[0] - a[0]) * mPerDegLat;
    const px = (p[1] - a[1]) * mPerDegLng, py = (p[0] - a[0]) * mPerDegLat;
    const dx = bx - ax, dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    const projx = ax + t * dx, projy = ay + t * dy;
    return Math.hypot(px - projx, py - projy);
  }

  function rdp(pts: LatLng[]): LatLng[] {
    if (pts.length <= 2) return pts;
    let maxDist = -1;
    let idx = 0;
    for (let i = 1; i < pts.length - 1; i++) {
      const d = perpendicularDist(pts[i], pts[0], pts[pts.length - 1]);
      if (d > maxDist) { maxDist = d; idx = i; }
    }
    if (maxDist > toleranceMeters) {
      const left = rdp(pts.slice(0, idx + 1));
      const right = rdp(pts.slice(idx));
      return [...left.slice(0, -1), ...right];
    }
    return [pts[0], pts[pts.length - 1]];
  }

  return rdp(points);
}

export function cumulativeDistances(points: LatLng[]): number[] {
  const out = [0];
  for (let i = 1; i < points.length; i++) out.push(out[i - 1] + haversine(points[i - 1], points[i]));
  return out;
}
