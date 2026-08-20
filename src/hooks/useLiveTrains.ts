import { useMemo } from 'react';
import { useMetroClock } from './useMetroClock.ts';
import { runningTrips } from '@/src/lib/metro/live.ts';
import type { TrainRun } from '@/src/lib/metro/types.ts';

/**
 * Live trains at ~1Hz, driven by the shared clock tick. Fine for lists and
 * counts. The map feature does NOT use this — it runs its own rAF loop
 * against lib/metro/live.ts directly so React never re-renders per frame.
 */
export function useLiveTrains(): TrainRun[] {
  const { secondsOfDay, dayOfWeek } = useMetroClock();
  return useMemo(() => runningTrips(secondsOfDay, dayOfWeek), [secondsOfDay, dayOfWeek]);
}
