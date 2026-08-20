import { LINE_IDS, network, segmentBetween } from './network.ts';
import type { LineId } from './types.ts';

export interface LineFeature {
  type: 'Feature';
  properties: { line: LineId; color: string };
  geometry: { type: 'LineString'; coordinates: [number, number][] };
}

export interface StationFeature {
  type: 'Feature';
  properties: { id: string; name: string; isInterchange: boolean; color: string };
  geometry: { type: 'Point'; coordinates: [number, number] };
}

let cachedLineFeatures: LineFeature[] | null = null;
export function buildLineFeatures(): LineFeature[] {
  if (cachedLineFeatures) return cachedLineFeatures;
  cachedLineFeatures = LINE_IDS.map(line => {
    const order = network.lines[line].stations;
    const coords: [number, number][] = [];
    for (let i = 0; i < order.length - 1; i++) {
      const { coords: latLngs } = segmentBetween(order[i], order[i + 1]);
      const lngLats = latLngs.map(([lat, lng]) => [lng, lat] as [number, number]);
      if (coords.length > 0) lngLats.shift(); // avoid duplicating the shared join point
      coords.push(...lngLats);
    }
    return { type: 'Feature' as const, properties: { line, color: network.lines[line].color }, geometry: { type: 'LineString' as const, coordinates: coords } };
  });
  return cachedLineFeatures;
}

let cachedStationFeatures: StationFeature[] | null = null;
export function buildStationFeatures(): StationFeature[] {
  if (cachedStationFeatures) return cachedStationFeatures;
  cachedStationFeatures = network.stations.map(s => ({
    type: 'Feature' as const,
    properties: { id: s.id, name: s.name, isInterchange: s.isInterchange, color: network.lines[s.lines[0]].color },
    geometry: { type: 'Point' as const, coordinates: [s.lng, s.lat] },
  }));
  return cachedStationFeatures;
}

export function networkBounds(): [[number, number], [number, number]] {
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const s of network.stations) {
    minLng = Math.min(minLng, s.lng); maxLng = Math.max(maxLng, s.lng);
    minLat = Math.min(minLat, s.lat); maxLat = Math.max(maxLat, s.lat);
  }
  return [[minLng, minLat], [maxLng, maxLat]];
}
