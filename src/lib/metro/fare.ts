import { network } from './network.ts';

/**
 * GMRC's single-journey fare is a station-count slab (₹5-25), not a distance
 * or per-line matrix. `stationCount` is the number of stops travelled through
 * from origin to destination inclusive of the destination (so one hop between
 * adjacent stations is `stationCount = 1`).
 */
export function fareForStations(stationCount: number): number {
  for (const slab of network.fareSlabs) {
    if (stationCount <= slab.maxStations) return slab.fare;
  }
  return network.fareSlabs.at(-1)!.fare;
}

export function applyNcmcDiscount(fare: number): number {
  return Math.round(fare * (1 - network.ncmcDiscount));
}
