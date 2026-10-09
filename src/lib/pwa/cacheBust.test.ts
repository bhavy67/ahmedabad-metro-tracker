import { describe, it, expect, beforeEach, vi } from 'vitest';
import { decideBust, urlWithoutBustParam, purgeCaches, unregisterServiceWorkers } from './cacheBust.ts';

describe('decideBust', () => {
  it('treats a client with no recorded epoch as a fresh install', () => {
    expect(decideBust(null, 3)).toBe('first-run');
  });

  it('leaves a client on the current epoch alone', () => {
    expect(decideBust('3', 3)).toBe('up-to-date');
  });

  it('busts a client left behind on an older epoch', () => {
    expect(decideBust('2', 3)).toBe('bust');
  });

  it('busts on a rollback too — any disagreement means the caches are not the ones this build expects', () => {
    expect(decideBust('4', 3)).toBe('bust');
  });

  it('busts when the stored value is corrupt rather than trusting it', () => {
    expect(decideBust('', 3)).toBe('bust');
    expect(decideBust('not-a-number', 3)).toBe('bust');
  });
});

describe('urlWithoutBustParam', () => {
  it('strips the one-shot param so the reload target cannot re-trigger a wipe', () => {
    expect(urlWithoutBustParam('https://x.test/map?cachebust=1')).toBe('https://x.test/map');
  });

  it('keeps every other query param and the hash intact', () => {
    expect(urlWithoutBustParam('https://x.test/plan?from=a&cachebust=1&to=b#leg2'))
      .toBe('https://x.test/plan?from=a&to=b#leg2');
  });

  it('returns a URL that never had the param byte-for-byte, rather than re-encoding its query', () => {
    expect(urlWithoutBustParam('https://x.test/?clock=09:30')).toBe('https://x.test/?clock=09:30');
  });
});

describe('purgeCaches', () => {
  beforeEach(() => { Reflect.deleteProperty(globalThis, 'caches'); });

  it('deletes every bucket this origin owns', async () => {
    const remove = vi.fn().mockResolvedValue(true);
    Object.defineProperty(globalThis, 'caches', {
      value: { keys: async () => ['metro-tracker-v1-precache', 'basemap-tiles'], delete: remove },
      configurable: true,
    });

    await expect(purgeCaches()).resolves.toBe(2);
    expect(remove.mock.calls.map(c => c[0])).toEqual(['metro-tracker-v1-precache', 'basemap-tiles']);
  });

  it('reports nothing purged where Cache Storage is unavailable, rather than throwing', async () => {
    await expect(purgeCaches()).resolves.toBe(0);
  });

  it('survives a rejecting Cache Storage — a wipe that half-fails must not break boot', async () => {
    Object.defineProperty(globalThis, 'caches', {
      value: { keys: async () => { throw new Error('denied'); }, delete: vi.fn() },
      configurable: true,
    });
    await expect(purgeCaches()).resolves.toBe(0);
  });
});

describe('unregisterServiceWorkers', () => {
  it('unregisters each registration on the scope', async () => {
    const unregister = vi.fn().mockResolvedValue(true);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { getRegistrations: async () => [{ unregister }, { unregister }] },
      configurable: true,
    });

    await expect(unregisterServiceWorkers()).resolves.toBe(2);
    expect(unregister).toHaveBeenCalledTimes(2);

    Reflect.deleteProperty(navigator, 'serviceWorker');
  });
});
