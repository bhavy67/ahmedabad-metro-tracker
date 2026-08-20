import { describe, it, expect } from 'vitest';
import { fareForStations, applyNcmcDiscount } from './fare.ts';

describe('fareForStations', () => {
  it('matches the published slab boundaries', () => {
    expect(fareForStations(1)).toBe(5);
    expect(fareForStations(3)).toBe(5);
    expect(fareForStations(4)).toBe(10);
    expect(fareForStations(6)).toBe(10);
    expect(fareForStations(7)).toBe(15);
    expect(fareForStations(10)).toBe(15);
    expect(fareForStations(11)).toBe(20);
    expect(fareForStations(15)).toBe(20);
    expect(fareForStations(16)).toBe(25);
    expect(fareForStations(100)).toBe(25);
  });
});

describe('applyNcmcDiscount', () => {
  it('applies the network-configured discount, rounded', () => {
    expect(applyNcmcDiscount(10)).toBe(9); // 10% off 10 = 9
    expect(applyNcmcDiscount(5)).toBe(5); // 10% off 5 = 4.5 -> rounds to 5
  });
});
