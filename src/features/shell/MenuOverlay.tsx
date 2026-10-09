import { useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { LINE_IDS, network } from '@/src/lib/metro/network.ts';
import { useLiveCounts } from '@/src/hooks/useLiveTrains.ts';
import { InstallButton } from '@/src/features/pwa/InstallButton.tsx';
import { cn } from '@/lib/utils';
import { LiveBadge } from './LiveBadge.tsx';
import { NAV_ITEMS } from './nav.ts';

/** Mobile full-screen menu: staggered mask-reveal links, lines with live counts. */
export function MenuOverlay({ open, onClose, onOpenLines }: { open: boolean; onClose: () => void; onOpenLines: () => void }) {
  const { pathname } = useLocation();
  const counts = useLiveCounts();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const reveal = (i: number) => ({
    className: cn(
      'block transition-[transform,opacity] duration-700 ease-(--spring)',
      open ? 'translate-y-0 opacity-100' : 'translate-y-[110%] opacity-0'
    ),
    style: { transitionDelay: open ? `${i * 50 + 60}ms` : '0ms' },
  });

  return (
    <div
      inert={!open}
      aria-hidden={!open}
      className={cn(
        'fixed inset-0 z-30 flex flex-col overflow-y-auto bg-background/85 px-7 pt-[calc(env(safe-area-inset-top)+96px)] pb-[calc(env(safe-area-inset-bottom)+104px)] backdrop-blur-3xl transition-opacity duration-500 ease-(--spring) md:hidden',
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      )}
    >
      <nav aria-label="Menu" className="flex flex-col">
        {NAV_ITEMS.map((item, i) => {
          const active = item.match(pathname);
          const label = (
            <span {...reveal(i)}>
              <span className="mr-3 align-super font-mono text-[12px] text-muted-foreground">0{i + 1}</span>
              <span className={active ? 'text-foreground' : 'text-foreground/70'}>{item.label}</span>
            </span>
          );
          const cls = 'overflow-hidden py-1.5 text-left font-display text-[clamp(2rem,10vw,3rem)] font-medium tracking-[-0.03em]';
          return item.to ? (
            <Link key={item.label} to={item.to} onClick={onClose} className={cls}>
              {label}
            </Link>
          ) : (
            <button key={item.label} type="button" onClick={() => { onClose(); onOpenLines(); }} className={cls}>
              {label}
            </button>
          );
        })}
      </nav>

      <div className="mt-10 overflow-hidden">
        <div {...reveal(NAV_ITEMS.length)}>
          <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Lines · live now</p>
          <div className="grid grid-cols-2 gap-2">
            {LINE_IDS.map(line => (
              <Link
                key={line}
                to={`/line/${line}`}
                onClick={onClose}
                className="press surface flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[14px] font-semibold"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: `var(--line-${line})`, boxShadow: `0 0 10px var(--line-${line})` }}
                />
                {network.lines[line].name}
                <span className="tnum ml-auto font-mono text-[12px] font-normal text-muted-foreground">{counts[line]}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center gap-2 pt-10">
        <LiveBadge />
        <InstallButton />
        <span className="ml-auto text-[12px] text-muted-foreground">GMRC timetable · offline ready</span>
      </div>
    </div>
  );
}
