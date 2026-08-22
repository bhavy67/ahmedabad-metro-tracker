import { useMemo } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { IconTrain, IconHome2, IconMap2, IconRoute, IconMapPin } from '@tabler/icons-react';
import { useLiveTrains } from '@/src/hooks/useLiveTrains.ts';
import { LINE_IDS, network } from '@/src/lib/metro/network.ts';
import type { LineId } from '@/src/lib/metro/types.ts';
import { cn } from '@/lib/utils';
import { LiveBadge } from './LiveBadge.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';
import { InstallButton } from '@/src/features/pwa/InstallButton.tsx';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: IconHome2, match: (p: string) => p === '/' },
  { to: '/map', label: 'Live Map', icon: IconMap2, match: (p: string) => p.startsWith('/map') },
  { to: '/plan', label: 'Plan', icon: IconMapPin, match: (p: string) => p.startsWith('/plan') || p.startsWith('/station') },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const trains = useLiveTrains();

  const countByLine = useMemo(() => {
    const counts: Record<LineId, number> = { blue: 0, red: 0, yellow: 0, violet: 0 };
    for (const t of trains) counts[t.line]++;
    return counts;
  }, [trains]);

  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="px-4 pt-6 pb-2">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <IconTrain size={20} stroke={2} />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-[14px] font-semibold tracking-tight">Ahmedabad Metro</span>
            <span className="text-[11px] text-muted-foreground">Live tracker</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <div className="space-y-0.5">
          {NAV_ITEMS.map(item => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'press flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon size={19} stroke={active ? 2.25 : 1.75} />
                {item.label}
              </NavLink>
            );
          })}
        </div>

        <div className="mt-5">
          <div className="flex items-center gap-2 px-3 pb-1.5">
            <IconRoute size={13} stroke={2} className="text-muted-foreground" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Lines</span>
          </div>
          <div className="space-y-0.5">
            {LINE_IDS.map(line => {
              const meta = network.lines[line];
              const count = countByLine[line];
              const active = pathname.startsWith(`/line/${line}`);
              return (
                <NavLink
                  key={line}
                  to={`/line/${line}`}
                  className={cn(
                    'press flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors',
                    active ? 'bg-accent' : 'hover:bg-accent/60'
                  )}
                >
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-bold uppercase"
                    style={{ backgroundColor: `var(--line-${line})`, color: `var(--line-${line}-ink)` }}
                  >
                    {meta.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] font-medium text-foreground">{meta.name}</span>
                  {count > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="relative inline-flex h-1.5 w-1.5">
                        <span className="signal-ping absolute inset-0" style={{ color: `var(--line-${line})` }} />
                        <span
                          className="relative inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: `var(--line-${line})` }}
                        />
                      </span>
                      <span className="text-[11px] text-muted-foreground">{count}</span>
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="flex items-center gap-1.5 border-t border-border px-3 py-3">
        <LiveBadge />
        <InstallButton />
        <ThemeToggle />
      </div>
    </aside>
  );
}
