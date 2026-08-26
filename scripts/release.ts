#!/usr/bin/env bun
/**
 * Bumps the version in package.json and rebuilds.
 *
 * The version is the human-facing label — it is stamped into the bundle and
 * shown in the app footer, so it is what a bug report should quote. It is
 * deliberately NOT the cache lever: bumping it does not make installed clients
 * throw anything away, because ordinary releases invalidate themselves through
 * content hashing. When you actually need every client to wipe, run
 * `bun run cache:bust` as well — see the caching section of the README.
 *
 *   bun run release                  patch bump (0.1.2 -> 0.1.3), then build
 *   bun run release --minor          0.1.2 -> 0.2.0
 *   bun run release --major          0.1.2 -> 1.0.0
 *   bun run release --set 2.0.0-rc.1 exact version
 *   bun run release --no-build       bump only, skip the build
 *   bun run release --show           print the current version, change nothing
 */

import { bump, replaceVersion, SEMVER, type Level } from './lib/semver.ts';

const FILE = new URL('../package.json', import.meta.url);

function has(name: string): boolean {
  return Bun.argv.includes(`--${name}`);
}

function flag(name: string): string | null {
  const i = Bun.argv.indexOf(`--${name}`);
  if (i === -1) return null;
  const value = Bun.argv[i + 1];
  return value === undefined || value.startsWith('--') ? '' : value;
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

const source = await Bun.file(FILE).text();
const current = (JSON.parse(source) as { version: string }).version;

if (has('show')) {
  console.log(current);
  process.exit(0);
}

const exact = flag('set');
let next: string;
if (exact !== null) {
  if (!SEMVER.test(exact)) fail(`--set expects a semver version, got ${JSON.stringify(exact)}`);
  next = exact;
} else {
  const levels: Level[] = (['major', 'minor', 'patch'] as const).filter(has);
  if (levels.length > 1) fail(`pick one of --major / --minor / --patch, not ${levels.join(' + ')}`);
  try {
    next = bump(current, levels[0] ?? 'patch');
  } catch {
    fail(`package.json version ${JSON.stringify(current)} is not semver — use --set to fix it`);
  }
}

if (next === current) fail(`version is already ${current}`);

let bumped: string;
try {
  bumped = replaceVersion(source, next);
} catch {
  fail('package.json has no "version" field to bump');
}
await Bun.write(FILE, bumped);
console.log(`version ${current} -> ${next}`);

if (has('no-build')) {
  console.log('\n--no-build: skipping the build.');
  process.exit(0);
}

console.log('\nRebuilding…\n');
const build = Bun.spawnSync(['bun', 'run', 'build'], { stdio: ['inherit', 'inherit', 'inherit'] });
if (build.exitCode !== 0) {
  // Leave the bumped version in place: the build failing is the thing to fix,
  // and silently reverting would hide which version was being built.
  console.error(`\nBuild failed (exit ${build.exitCode}). package.json is on ${next}.`);
  process.exit(build.exitCode ?? 1);
}

console.log(`\nBuilt v${next}. Commit package.json and deploy.`);
console.log('If clients must also discard their caches, run: bun run cache:bust');
