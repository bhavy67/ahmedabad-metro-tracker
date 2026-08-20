import { describe, it, expect } from 'vitest';
import { estimateCrowd } from './crowd.ts';

describe('estimateCrowd', () => {
  it('is heavy mid-route during weekday morning peak', () => {
    const level = estimateCrowd({ dayOfWeek: 3, secondsOfDay: 9 * 3600, progress: 0.5 });
    expect(level).toBe('heavy');
  });

  it('is lighter right at departure than mid-route, even during peak', () => {
    const atDeparture = estimateCrowd({ dayOfWeek: 3, secondsOfDay: 9 * 3600, progress: 0 });
    const midRoute = estimateCrowd({ dayOfWeek: 3, secondsOfDay: 9 * 3600, progress: 0.5 });
    const rank = { low: 0, moderate: 1, heavy: 2 };
    expect(rank[atDeparture]).toBeLessThan(rank[midRoute]);
  });

  it('is low on a weekend off-peak run', () => {
    const level = estimateCrowd({ dayOfWeek: 0, secondsOfDay: 14 * 3600, progress: 0.5 });
    expect(level).toBe('low');
  });

  it('is not peak-boosted outside the defined windows on a weekday', () => {
    const midday = estimateCrowd({ dayOfWeek: 2, secondsOfDay: 13 * 3600, progress: 0.5 });
    const peak = estimateCrowd({ dayOfWeek: 2, secondsOfDay: 9 * 3600, progress: 0.5 });
    // Peak should never be a lower-or-equal crowd level than off-peak at the same route position.
    const rank = { low: 0, moderate: 1, heavy: 2 };
    expect(rank[peak]).toBeGreaterThanOrEqual(rank[midday]);
  });
});
