/**
 * Client side of cache busting for the installed PWA.
 *
 * A service worker is a cache that outlives the page, so "just deploy again"
 * is not always enough: a client that never manages to fetch the new sw.js
 * keeps serving the old precache indefinitely. This module gives that state
 * three exits, in increasing order of force:
 *
 *   1. The normal path — Workbox notices a new sw.js and swaps the precache.
 *      Nothing here is involved. See `useAppUpdate` for how often we look.
 *   2. `bun run cache:bust` bumps the epoch in cache-bust.json. Every client
 *      compares the built-in epoch against the one it last booted with and,
 *      when it has moved, wipes Cache Storage, drops its service workers and
 *      reloads — once, automatically, before the UI paints.
 *   3. `?cachebust=1` on any URL, or the button in the app footer, runs the
 *      same wipe on demand. This is what to tell a single stuck user.
 */

export const APP_VERSION: string = __APP_VERSION__;
export const BUILD_ID: string = __BUILD_ID__;
export const BUILD_TIME: string = __BUILD_TIME__;
export const CACHE_EPOCH: number = __CACHE_EPOCH__;

const EPOCH_KEY = 'metro-tracker:cache-epoch';
const RELOAD_GUARD = 'metro-tracker:cache-bust-reloading';

/** Add `?cachebust=1` to any app URL to force a full wipe on load. */
export const BUST_PARAM = 'cachebust';

export type BustDecision = 'first-run' | 'up-to-date' | 'bust';

/**
 * Whether the epoch a client last booted with obliges it to wipe its caches.
 * A missing value is a fresh install with nothing to throw away; an unparseable
 * one, or one that disagrees in either direction (a rollback counts), is stale.
 */
export function decideBust(stored: string | null, current: number): BustDecision {
  if (stored === null) return 'first-run';
  const parsed = Number(stored);
  if (!Number.isFinite(parsed)) return 'bust';
  return parsed === current ? 'up-to-date' : 'bust';
}

// Storage throws outright in some private-browsing modes, so every access is
// wrapped: losing the guard must degrade to "don't bust", never to a crash.
function read(store: Storage, key: string): string | null {
  try { return store.getItem(key); } catch { return null; }
}
function write(store: Storage, key: string, value: string): boolean {
  try { store.setItem(key, value); return true; } catch { return false; }
}
function drop(store: Storage, key: string): void {
  try { store.removeItem(key); } catch { /* nothing to do */ }
}

/** Deletes every Cache Storage bucket this origin owns. Returns how many. */
export async function purgeCaches(): Promise<number> {
  if (!('caches' in globalThis)) return 0;
  try {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    return keys.length;
  } catch {
    return 0;
  }
}

/** Unregisters every service worker on this scope. Returns how many. */
export async function unregisterServiceWorkers(): Promise<number> {
  if (!('serviceWorker' in navigator)) return 0;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(r => r.unregister()));
    return registrations.length;
  } catch {
    return 0;
  }
}

/** The URL to land on after a wipe: same page, minus the one-shot bust param. */
export function urlWithoutBustParam(href: string): string {
  const url = new URL(href);
  // Re-serialising percent-encodes the whole query, so leave untouched any URL
  // that never carried the param — which is every wipe started from the footer.
  if (!url.searchParams.has(BUST_PARAM)) return href;
  url.searchParams.delete(BUST_PARAM);
  return url.toString();
}

/**
 * Wipe caches and service workers, then reload onto a network-served page.
 * `location.replace` rather than `reload` so a `?cachebust=1` URL does not
 * sit in history waiting to fire again on every back-navigation.
 */
export async function hardReset({ reload = true }: { reload?: boolean } = {}): Promise<void> {
  await Promise.allSettled([purgeCaches(), unregisterServiceWorkers()]);
  if (reload) location.replace(urlWithoutBustParam(location.href));
}

/**
 * Run before the app renders. Returns true when a wipe-and-reload is under way,
 * in which case the caller should not paint a UI that is about to be discarded.
 */
export function bootCacheGuard(): boolean {
  const forced = new URLSearchParams(location.search).has(BUST_PARAM);
  const decision = decideBust(read(localStorage, EPOCH_KEY), CACHE_EPOCH);

  if (!forced && decision !== 'bust') {
    // Steady state: remember the epoch and clear last boot's guard.
    write(localStorage, EPOCH_KEY, String(CACHE_EPOCH));
    drop(sessionStorage, RELOAD_GUARD);
    return false;
  }

  // Record the new epoch *before* wiping. If the wipe or the reload fails
  // halfway, the next load sees an up-to-date epoch and boots normally rather
  // than busting forever.
  const recorded = write(localStorage, EPOCH_KEY, String(CACHE_EPOCH));

  // Second belt: one attempt per tab session. Without durable storage of some
  // kind there is no way to prove a reload loop can't happen, so don't start one.
  if (read(sessionStorage, RELOAD_GUARD) !== null) return false;
  if (!write(sessionStorage, RELOAD_GUARD, '1') && !recorded) return false;

  void hardReset();
  return true;
}
