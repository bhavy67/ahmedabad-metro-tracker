import { useSyncExternalStore } from 'react';
import { currentEpochMs, initDevClockOverride, isDevClockOverridden, snapshotAt, type ClockSnapshot } from '@/src/lib/metro/clock.ts';

if (typeof window !== 'undefined') {
  initDevClockOverride(window.location.search);
  if (isDevClockOverridden()) {
    // eslint-disable-next-line no-console
    console.info(`[metro] dev clock override active: ${new URLSearchParams(window.location.search).get('clock')}`);
  }
}

let cached: ClockSnapshot = snapshotAt(currentEpochMs());
const listeners = new Set<() => void>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function tick() {
  cached = snapshotAt(currentEpochMs());
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (intervalId === null) {
    intervalId = setInterval(tick, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

function getSnapshot(): ClockSnapshot {
  return cached;
}

/** The single tick source for the whole app: one 1s interval, shared. */
export function useMetroClock(): ClockSnapshot {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export { isDevClockOverridden as isClockOverridden };
