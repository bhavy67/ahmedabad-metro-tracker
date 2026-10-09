import { describe, it, expect } from 'vitest';
import { haversineMeters, bearingDegrees, nearestStation, walkingMinutes } from './geo.ts';
import { CURATED_PLACES } from './places.ts';
import type { NetworkStation } from './types.ts';

const station = (id: string, lat: number, lng: number): NetworkStation => ({
  id, name: id, nameGu: id, nameHi: id, lat, lng, lines: ['blue'], isUnderground: false, isInterchange: false,
});

describe('haversineMeters', () => {
  it('is zero for the same point', () => {
    expect(haversineMeters([23.03, 72.58], [23.03, 72.58])).toBe(0);
  });
  it('measures one degree of latitude as ~111.2 km', () => {
    expect(haversineMeters([23, 72.5], [24, 72.5])).toBeCloseTo(111_195, -1);
  });
  it('is symmetric', () => {
    const a: [number, number] = [23.0262, 72.601];
    const b: [number, number] = [23.0603, 72.5806];
    expect(haversineMeters(a, b)).toBeCloseTo(haversineMeters(b, a), 6);
  });
});

describe('bearingDegrees', () => {
  it('points north, east, south and west', () => {
    expect(bearingDegrees([23, 72.5], [23.1, 72.5])).toBeCloseTo(0, 0);
    expect(bearingDegrees([23, 72.5], [23, 72.6])).toBeCloseTo(90, 0);
    expect(bearingDegrees([23.1, 72.5], [23, 72.5])).toBeCloseTo(180, 0);
    expect(bearingDegrees([23, 72.6], [23, 72.5])).toBeCloseTo(270, 0);
  });
});

describe('nearestStation', () => {
  it('returns the closest station and its distance', () => {
    const stations = [station('far', 23.2, 72.6), station('near', 23.031, 72.58), station('mid', 23.1, 72.58)];
    const { station: s, distanceMeters } = nearestStation([23.03, 72.58], stations);
    expect(s.id).toBe('near');
    expect(distanceMeters).toBeCloseTo(111, 0);
  });
});

describe('walkingMinutes', () => {
  it('applies a 1.4 route factor at 4.5 km/h', () => {
    expect(walkingMinutes(0)).toBe(0);
    expect(walkingMinutes(750)).toBe(14); // 750m * 1.4 / 75 m/min
    expect(walkingMinutes(1000)).toBe(19);
  });
});

describe('curated places data', () => {
  // Guards against the coordinate drift fixed on 2026-10-09 (Apollo was ~11 km
  // off, Science City 8.6 km). Some real places are genuinely off-network
  // (Shantigram ~8.5 km, Nirma ~6.4 km — the app suggests an auto/cab there),
  // so the bound is generous: it catches coordinates that are plainly wrong.
  it('puts every place within 10 km of a metro station', () => {
    const far = CURATED_PLACES
      .map(p => ({ id: p.id, km: nearestStation([p.lat, p.lng]).distanceMeters / 1000 }))
      .filter(p => p.km > 10);
    expect(far).toEqual([]);
  });
  it('has unique ids', () => {
    const ids = CURATED_PLACES.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
