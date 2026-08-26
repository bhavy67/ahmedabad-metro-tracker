export type Level = 'major' | 'minor' | 'patch';

export const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

/**
 * Bumping drops any prerelease tag, so 1.2.0-rc.1 patches to 1.2.1, not
 * 1.2.1-rc.1. Throws on anything that is not semver — the caller turns that
 * into a CLI error.
 */
export function bump(version: string, level: Level): string {
  const m = SEMVER.exec(version);
  if (!m) throw new Error(`not a semver version: ${JSON.stringify(version)}`);
  const [major, minor, patch] = [Number(m[1]), Number(m[2]), Number(m[3])];
  if (level === 'major') return `${major + 1}.0.0`;
  if (level === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

/**
 * Rewrites the version in package.json's own text rather than re-serialising a
 * parsed object: everything else in the file — key order, formatting — must
 * survive untouched. Throws if there is no version field.
 */
export function replaceVersion(source: string, next: string): string {
  const pattern = /^(\s*"version"\s*:\s*)"[^"]*"/m;
  if (!pattern.test(source)) throw new Error('no "version" field found');
  return source.replace(pattern, `$1"${next}"`);
}
