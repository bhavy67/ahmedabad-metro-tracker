#!/usr/bin/env bun
/**
 * Moves the cache epoch in cache-bust.json.
 *
 * Bumping the epoch does two things once the resulting build is deployed:
 *   · every Workbox cache is renamed (see `cacheId` in vite.config.ts), so the
 *     new service worker cannot reuse a single byte of the old precache;
 *   · every already-installed client notices the change on its next load and
 *     wipes Cache Storage + its service workers before rendering
 *     (see `bootCacheGuard` in src/lib/pwa/cacheBust.ts).
 *
 * It is a blunt instrument — clients re-download everything, including the
 * ~3000 cached basemap tiles — so reach for it when a bad build is stuck on
 * people's devices, not for ordinary releases. Ordinary releases already
 * invalidate themselves through content hashing.
 *
 *   bun run cache:bust                      bump by one
 *   bun run cache:bust --reason "bad sw"    bump, recording why
 *   bun run cache:bust --set 12             jump to a specific epoch
 *   bun run cache:bust --show               print the current epoch, change nothing
 */

interface CacheBustFile {
  epoch: number;
  bustedAt: string;
  reason: string;
}

const FILE = new URL('../cache-bust.json', import.meta.url);

function flag(name: string): string | null {
  const i = Bun.argv.indexOf(`--${name}`);
  if (i === -1) return null;
  const value = Bun.argv[i + 1];
  return value === undefined || value.startsWith('--') ? '' : value;
}

const current: CacheBustFile = await Bun.file(FILE).json();

if (flag('show') !== null) {
  console.log(`cache epoch ${current.epoch} — busted ${current.bustedAt}\n  reason: ${current.reason}`);
  process.exit(0);
}

const setTo = flag('set');
let epoch: number;
if (setTo !== null) {
  epoch = Number(setTo);
  if (!Number.isInteger(epoch) || epoch < 1) {
    console.error(`--set expects a positive integer, got ${JSON.stringify(setTo)}`);
    process.exit(1);
  }
  if (epoch <= current.epoch) {
    // Going backwards still busts clients (any change does), but it breaks the
    // "epoch only ever grows" assumption people rely on when reading logs.
    console.error(`refusing to move the epoch from ${current.epoch} down to ${epoch}`);
    process.exit(1);
  }
} else {
  epoch = current.epoch + 1;
}

const next: CacheBustFile = {
  epoch,
  bustedAt: new Date().toISOString(),
  reason: flag('reason') || 'Manual cache bust.',
};

await Bun.write(FILE, `${JSON.stringify(next, null, 2)}\n`);

console.log(`cache epoch ${current.epoch} -> ${next.epoch}`);
console.log(`  reason: ${next.reason}`);
console.log('\nNext: commit cache-bust.json and deploy. Every client wipes its');
console.log('caches on the load after that, once.');
