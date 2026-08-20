/**
 * Occupancy is not measured anywhere in the source data — GMRC publishes no
 * ridership feed. This is a clearly-labelled ESTIMATE from time-of-day and
 * how far along its run a train is (more boarded passengers mid-route than
 * right after departing a terminus). Surfaces must present this as an
 * estimate, not a measurement.
 */

export type CrowdLevel = 'low' | 'moderate' | 'heavy';

const MORNING_PEAK = [8 * 3600, 11 * 3600] as const;
const EVENING_PEAK = [17 * 3600, 20 * 3600] as const;

function isWeekday(dayOfWeek: number): boolean {
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

function isPeak(secondsOfDay: number): boolean {
  return (
    (secondsOfDay >= MORNING_PEAK[0] && secondsOfDay < MORNING_PEAK[1]) ||
    (secondsOfDay >= EVENING_PEAK[0] && secondsOfDay < EVENING_PEAK[1])
  );
}

export function estimateCrowd(params: { dayOfWeek: number; secondsOfDay: number; progress: number }): CrowdLevel {
  const { dayOfWeek, secondsOfDay, progress } = params;
  const weekday = isWeekday(dayOfWeek);
  const peak = weekday && isPeak(secondsOfDay);

  // Fullest mid-route; near-empty right at departure or right before arrival.
  const routeFactor = Math.sin(Math.PI * Math.max(0, Math.min(1, progress))); // 0 at ends, 1 at midpoint

  let score = 0;
  if (peak) score += 2;
  else if (weekday) score += 1;
  score += routeFactor; // 0..1

  if (score >= 2.5) return 'heavy';
  if (score >= 1.2) return 'moderate';
  return 'low';
}
