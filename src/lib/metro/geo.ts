import { allStations } from './network.ts';
import type { NetworkStation } from './types.ts';

const EARTH_RADIUS_M = 6371000;

export function haversineMeters(a: [number, number], b: [number, number]): number {
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

/** Initial great-circle bearing from a to b, in degrees clockwise from north. */
export function bearingDegrees(a: [number, number], b: [number, number]): number {
  const [lat1, lng1] = a;
  const [lat2, lng2] = b;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(lng2 - lng1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lng2 - lng1));
  const deg = (Math.atan2(y, x) * 180) / Math.PI;
  return (deg + 360) % 360;
}

export function nearestStation(point: [number, number], stations: NetworkStation[] = allStations()): { station: NetworkStation; distanceMeters: number } {
  let best: NetworkStation | null = null;
  let bestDist = Infinity;
  for (const s of stations) {
    const d = haversineMeters(point, [s.lat, s.lng]);
    if (d < bestDist) { bestDist = d; best = s; }
  }
  return { station: best!, distanceMeters: bestDist };
}

/** Rough walking time estimate: straight-line distance x 1.4 route factor, at 4.5 km/h. */
export function walkingMinutes(distanceMeters: number): number {
  const routeFactor = 1.4;
  const walkingSpeedMetersPerMinute = 4500 / 60;
  return Math.round((distanceMeters * routeFactor) / walkingSpeedMetersPerMinute);
}
