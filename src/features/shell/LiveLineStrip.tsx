import { useMemo } from 'react';
import { Link } from 'react-router';
import { IconTrain } from '@tabler/icons-react';
import { useLiveTrains } from '@/src/hooks/useLiveTrains.ts';
import { LINE_IDS, network } from '@/src/lib/metro/network.ts';
import type { LineId } from '@/src/lib/metro/types.ts';
import { LiveBadge } from './LiveBadge.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';
import { InstallButton } from '@/src/features/pwa/InstallButton.tsx';

const LINE_SHORT_LABEL: Record<LineId, string> = { blue: 'Blue', red: 'Red', yellow: 'Yellow', violet: 'Violet' };

export function LiveLineStrip() {
  const trains = useLiveTrains();

  const countByLine = useMemo(() => {
    const counts: Record<LineId, number> = { blue: 0, red: 0, yellow: 0, violet: 0 };
    for (const t of trains) counts[t.line]++;
    return counts;
  }, [trains]);

  return (
    <header className="shrink-0 border-b border-border bg-card/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-backdrop-filter:bg-card/80">
      <div className="flex items-center justify-between gap-2 px-4 pt-3 pb-2">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <IconTrain size={20} stroke={2} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-[15px] font-semibold tracking-tight">Ahmedabad Metro</span>
            <span className="text-[11px] text-muted-foreground">Live tracker</span>
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <InstallButton />
          <LiveBadge />
          <ThemeToggle />
        </div>
      </div>
      <nav aria-label="Lines" className="grid grid-cols-4 gap-2 px-4 pb-3">
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
      className="press group flex flex-col gap-0.5 rounded-xl px-2.5 py-2 shadow-sm"
      style={{ backgroundColor: `var(--line-${line})`, color: `var(--line-${line}-ink)` }}
    >
      <span className="flex items-center justify-between">
        <span className="font-display text-[12px] font-semibold uppercase tracking-wide">{LINE_SHORT_LABEL[line]}</span>
        {count > 0 && (
          <span className="relative inline-flex h-1.5 w-1.5 shrink-0">
            <span className="signal-ping absolute inset-0 opacity-70" />
            <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-current" />
          </span>
        )}
      </span>
      <span className="tnum font-mono text-[13px] font-semibold tabular-nums leading-none">
        {count} <span className="text-[10px] font-medium uppercase opacity-80">live</span>
      </span>
    </Link>
  );
}

export function lineDisplayName(line: LineId): string {
  return network.lines[line].name;
}
