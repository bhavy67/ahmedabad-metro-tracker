import { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router';
import {
  IconHome2,
  IconMapPin,
  IconRoute,
  IconMap2,
  type Icon as TablerIcon,
} from '@tabler/icons-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { LINE_IDS, network } from '@/src/lib/metro/network.ts';
import type { LineId } from '@/src/lib/metro/types.ts';
import { cn } from '@/lib/utils';

interface TabDef {
  to?: string;
  label: string;
  icon: TablerIcon;
  match: (p: string) => boolean;
  kind: 'link' | 'lines';
}

const TABS: TabDef[] = [
  { to: '/', label: 'Home', icon: IconHome2, match: p => p === '/', kind: 'link' },
  { to: '/map', label: 'Live Map', icon: IconMap2, match: p => p.startsWith('/map'), kind: 'link' },
  { label: 'Lines', icon: IconRoute, match: p => p.startsWith('/line'), kind: 'lines' },
  { to: '/plan', label: 'Plan', icon: IconMapPin, match: p => p.startsWith('/plan') || p.startsWith('/station'), kind: 'link' },
];

export function BottomTabBar() {
  const { pathname } = useLocation();
  const [linesOpen, setLinesOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <nav
        aria-label="Primary"
        className="grid shrink-0 grid-cols-4 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-backdrop-filter:bg-card/80"
      >
        {TABS.map(tab => {
          const active = tab.match(pathname);
          const Icon = tab.icon;

          const content = (
            <>
              <span
                className={cn(
                  'flex h-9 w-14 items-center justify-center rounded-full transition-colors',
                  active ? 'bg-primary/12 text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon size={22} stroke={active ? 2.25 : 1.75} />
              </span>
              <span
                className={cn(
                  'text-[11px] font-medium transition-colors',
                  active ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {tab.label}
              </span>
            </>
          );

          if (tab.kind === 'lines') {
            return (
              <button
                key={tab.label}
                type="button"
                onClick={() => setLinesOpen(true)}
                aria-label="Open line picker"
                className="press flex flex-col items-center justify-center gap-1 px-1 pt-2 pb-1.5"
              >
                {content}
              </button>
            );
          }

          return (
            <NavLink
              key={tab.to}
              to={tab.to!}
              className="press flex flex-col items-center justify-center gap-1 px-1 pt-2 pb-1.5"
            >
              {content}
            </NavLink>
          );
        })}
      </nav>

      <Drawer open={linesOpen} onOpenChange={setLinesOpen} showSwipeHandle>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle className="font-display text-base font-semibold">Choose a line</DrawerTitle>
          </DrawerHeader>
          <div className="grid grid-cols-1 gap-2 p-4 pb-6">
            {LINE_IDS.map(line => (
              <LinePickerRow
                key={line}
                line={line}
                onSelect={() => {
                  setLinesOpen(false);
                  navigate(`/line/${line}`);
                }}
              />
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}

function LinePickerRow({ line, onSelect }: { line: LineId; onSelect: () => void }) {
  const meta = network.lines[line];
  return (
    <button
      type="button"
      onClick={onSelect}
      className="press flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-left"
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-xl font-display text-sm font-bold uppercase tracking-wide"
        style={{ backgroundColor: `var(--line-${line})`, color: `var(--line-${line}-ink)` }}
      >
        {meta.name.charAt(0)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-semibold">{meta.name}</span>
        <span className="block truncate text-sm text-muted-foreground">
          {meta.from} → {meta.to}
        </span>
      </span>
    </button>
  );
}
