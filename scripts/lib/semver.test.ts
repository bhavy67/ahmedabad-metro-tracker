import { describe, it, expect } from 'vitest';
import { bump, replaceVersion } from './semver.ts';

describe('bump', () => {
  it('bumps each level, zeroing everything below it', () => {
    expect(bump('1.4.2', 'patch')).toBe('1.4.3');
    expect(bump('1.4.2', 'minor')).toBe('1.5.0');
    expect(bump('1.4.2', 'major')).toBe('2.0.0');
  });

  it('starts a project on 0.0.0 without special-casing it', () => {
    expect(bump('0.0.0', 'patch')).toBe('0.0.1');
  });

  it('carries past nine rather than treating versions as decimals', () => {
    expect(bump('1.9.9', 'minor')).toBe('1.10.0');
  });

  it('drops a prerelease tag instead of carrying it into the release', () => {
    expect(bump('2.0.0-rc.1', 'patch')).toBe('2.0.1');
  });

  it('rejects a version it cannot parse rather than guessing', () => {
    expect(() => bump('v1.2', 'patch')).toThrow();
  });
});

describe('replaceVersion', () => {
  const pkg = '{\n  "name": "metro-tracker",\n  "private": true,\n  "version": "0.0.0",\n  "type": "module"\n}\n';

  it('rewrites only the version, leaving key order and formatting alone', () => {
    expect(replaceVersion(pkg, '0.1.0')).toBe(pkg.replace('"0.0.0"', '"0.1.0"'));
  });

  it('does not touch a version field nested inside a dependency range', () => {
    const withDep = '{\n  "version": "1.0.0",\n  "dependencies": { "x": "^0.0.0" }\n}\n';
    expect(replaceVersion(withDep, '1.0.1')).toContain('"x": "^0.0.0"');
    expect(replaceVersion(withDep, '1.0.1')).toContain('"version": "1.0.1"');
  });

  it('refuses a file with no version field', () => {
    expect(() => replaceVersion('{"name":"x"}', '1.0.0')).toThrow();
  });
});
