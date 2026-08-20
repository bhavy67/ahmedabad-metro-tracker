/** Parse "HH:MM:SS" into seconds since midnight. */
export function parseHMS(value: string): number {
  const m = /^(\d{1,2}):(\d{2}):(\d{2})$/.exec(value.trim());
  if (!m) throw new Error(`Cannot parse time value: "${value}"`);
  const [, h, mi, s] = m;
  return Number(h) * 3600 + Number(mi) * 60 + Number(s);
}

export function formatHMS(totalSeconds: number): string {
  const s = ((totalSeconds % 86400) + 86400) % 86400;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
