/**
 * Single source of truth for "now", in Indian Standard Time. India does not
 * observe DST, so IST is a fixed +5:30 offset — no timezone database needed.
 *
 * Every function here is pure given an epoch (ms since Unix epoch), so tests
 * never need to mock Date. The only impure bits are `nowMs()` (wraps
 * Date.now()) and the tiny pub/sub used by the React hook in
 * src/hooks/useMetroClock.ts — kept separate so this module stays UI-free.
 */

const IST_OFFSET_SECONDS = 5.5 * 3600;
const DAY_SECONDS = 86400;

export function nowMs(): number {
  return Date.now();
}

/** Seconds since IST midnight, for an arbitrary epoch (ms). Not an integer. */
export function istSecondsOfDay(epochMs: number): number {
  const epochSeconds = epochMs / 1000 + IST_OFFSET_SECONDS;
  return ((epochSeconds % DAY_SECONDS) + DAY_SECONDS) % DAY_SECONDS;
}

/** JS Date#getDay() convention (0=Sun..6=Sat), computed in IST. */
export function istDayOfWeek(epochMs: number): number {
  const epochSeconds = epochMs / 1000 + IST_OFFSET_SECONDS;
  const dayIndex = Math.floor(epochSeconds / DAY_SECONDS);
  // 1970-01-01 was a Thursday (day index 4 in the 0=Sun week convention).
  return ((dayIndex + 4) % 7 + 7) % 7;
}

export interface ClockSnapshot {
  epochMs: number;
  secondsOfDay: number;
  dayOfWeek: number;
}

export function snapshotAt(epochMs: number): ClockSnapshot {
  return { epochMs, secondsOfDay: istSecondsOfDay(epochMs), dayOfWeek: istDayOfWeek(epochMs) };
}

/**
 * Dev-only override: reads `?clock=HH:MM:SS` (optionally `&day=0..6`) from a
 * URLSearchParams and returns the epoch ms that would produce it, using
 * today's real IST calendar date. Returns null if not present or invalid.
 */
export function parseClockOverride(search: string, realEpochMs: number = nowMs()): number | null {
  const params = new URLSearchParams(search);
  const clockParam = params.get('clock');
  if (!clockParam) return null;
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(clockParam.trim());
  if (!m) return null;
  const [, h, mi, s] = m;
  const overrideSeconds = Number(h) * 3600 + Number(mi) * 60 + Number(s ?? '0');

  const realIstSeconds = realEpochMs / 1000 + IST_OFFSET_SECONDS;
  const dayStartIstSeconds = Math.floor(realIstSeconds / DAY_SECONDS) * DAY_SECONDS;
  const overrideIstEpochSeconds = dayStartIstSeconds + overrideSeconds;
  return (overrideIstEpochSeconds - IST_OFFSET_SECONDS) * 1000;
}

let devOverrideEpochMs: number | null = null;
let devOverrideCapturedAtRealMs = 0;

/** Call once at startup (browser only) so every clock consumer — hooks and raw loops alike — agrees on the override. */
export function initDevClockOverride(search: string): void {
  const override = parseClockOverride(search);
  if (override !== null) {
    devOverrideEpochMs = override;
    devOverrideCapturedAtRealMs = nowMs();
  }
}

export function isDevClockOverridden(): boolean {
  return devOverrideEpochMs !== null;
}

/** The epoch (ms) the app should treat as "now" — real time, or the dev override advanced at real speed. */
export function currentEpochMs(): number {
  if (devOverrideEpochMs === null) return nowMs();
  return devOverrideEpochMs + (nowMs() - devOverrideCapturedAtRealMs);
}

export function formatClock(secondsOfDay: number): string {
  const s = Math.floor(((secondsOfDay % DAY_SECONDS) + DAY_SECONDS) % DAY_SECONDS);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
