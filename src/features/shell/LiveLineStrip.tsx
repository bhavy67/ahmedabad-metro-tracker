import { useMemo } from 'react';
import { Link } from 'react-router';
import { useLiveTrains } from '@/src/hooks/useLiveTrains.ts';
import { LINE_IDS, network } from '@/src/lib/metro/network.ts';
import type { LineId } from '@/src/lib/metro/types.ts';
import { LiveBadge } from './LiveBadge.tsx';

const LINE_SHORT_LABEL: Record<LineId, string> = { blue: 'Blue', red: 'Red', yellow: 'Yellow', violet: 'Violet' };

export function LiveLineStrip() {
  const trains = useLiveTrains();

  const countByLine = useMemo(() => {
    const counts: Record<LineId, number> = { blue: 0, red: 0, yellow: 0, violet: 0 };
    for (const t of trains) counts[t.line]++;
    return counts;
  }, [trains]);

  return (
    <header className="shrink-0 border-b border-border bg-card/90 pt-[env(safe-area-inset-top)] backdrop-blur supports-backdrop-filter:bg-card/70">
      <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5">
        <Link to="/" className="flex items-baseline gap-1">
          <span className="font-display text-[15px] font-semibold tracking-tight">Ahmedabad Metro</span>
        </Link>
        <LiveBadge />
      </div>
      <nav aria-label="Lines" className="grid grid-cols-4 gap-1.5 px-4 pb-2.5">
        {LINE_IDS.map(line => (
          <LineChip key={line} line={line} count={countByLine[line]} />
        ))}
      </nav>
    </header>
  );
}

function LineChip({ line, count }: { line: LineId; count: number }) {
  return (
    <Link
      to={`/line/${line}`}
      className="group flex items-center justify-between gap-1 rounded-md px-2 py-1.5 transition-transform active:scale-95"
      style={{ backgroundColor: `var(--line-${line})`, color: `var(--line-${line}-ink)` }}
    >
      <span className="font-display text-[11px] font-semibold uppercase tracking-wide">{LINE_SHORT_LABEL[line]}</span>
      <span className="flex items-center gap-1">
        {count > 0 && (
          <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
            <span className="signal-ping absolute inset-0 opacity-70" />
            <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-current" />
          </span>
        )}
        <span className="tnum font-mono text-[11px] font-medium tabular-nums opacity-90">{count}</span>
      </span>
    </Link>
  );
}

export function lineDisplayName(line: LineId): string {
  return network.lines[line].name;
}
