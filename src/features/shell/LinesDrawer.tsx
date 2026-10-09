import { useNavigate } from 'react-router';
import { IconArrowUpRight } from '@tabler/icons-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { LINE_IDS, network } from '@/src/lib/metro/network.ts';
import { formatScheduleTime12 } from '@/src/lib/metro/clock.ts';
import { useLiveCounts } from '@/src/hooks/useLiveTrains.ts';

export function LinesDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const counts = useLiveCounts();

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Choose a line</DrawerTitle>
        </DrawerHeader>
        <div className="grid grid-cols-1 gap-2.5 p-4 pb-6 sm:grid-cols-2">
          {LINE_IDS.map(line => {
            const meta = network.lines[line];
            return (
              <button
                key={line}
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  navigate(`/line/${line}`);
                }}
                className="press surface surface-hover group relative flex items-center gap-3 overflow-hidden rounded-[22px] p-3.5 text-left"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-16 -right-10 h-36 w-36 rounded-full opacity-40 blur-[40px] transition-opacity duration-500 group-hover:opacity-70"
                  style={{ backgroundColor: `var(--line-${line})` }}
                />
                <span
                  className="relative h-10 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: `var(--line-${line})`, boxShadow: `0 0 14px var(--line-${line})` }}
                />
                <span className="relative min-w-0 flex-1">
                  <span className="block font-display text-[15px] font-medium tracking-tight">{meta.name}</span>
                  <span className="block truncate text-[13px] text-muted-foreground">
                    {meta.from} → {meta.to}
                  </span>
                  <span className="tnum mt-0.5 block font-mono text-[11px] text-muted-foreground">
                    {formatScheduleTime12(meta.firstDeparture)} – {formatScheduleTime12(meta.lastArrival)} · {counts[line]} live
                  </span>
                </span>
                <IconArrowUpRight size={18} stroke={1.5} className="relative shrink-0 text-muted-foreground" />
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
