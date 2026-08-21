import { Link } from 'react-router';
import { IconArrowRight, IconBuildingArch, IconArrowsExchange } from '@tabler/icons-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { requireStation, network } from '@/src/lib/metro/network.ts';
import { DepartureBoard } from '@/src/features/station/DepartureBoard.tsx';

export function StationPopoverCard({ stationId, onClose }: { stationId: string; onClose: () => void }) {
  const station = requireStation(stationId);

  return (
    <Drawer open onOpenChange={open => !open && onClose()} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader>
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            {station.lines.map(line => (
              <span
                key={line}
                className="inline-block rounded-full px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-wide"
                style={{ backgroundColor: `var(--line-${line})`, color: `var(--line-${line}-ink)` }}
              >
                {network.lines[line].name}
              </span>
            ))}
            {station.isInterchange && (
              <span className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground">
                <IconArrowsExchange size={12} /> Interchange
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[12px] font-medium text-muted-foreground">
              <IconBuildingArch size={12} /> {station.isUnderground ? 'Underground' : 'Elevated'}
            </span>
          </div>
          <DrawerTitle className="font-display text-[20px] font-semibold leading-tight">
            {station.name}
          </DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-3">
          <DepartureBoard stationId={station.id} limit={5} />
        </div>
        <div className="px-4 pb-5">
          <Link
            to={`/station/${station.id}`}
            className="press flex items-center justify-center gap-1 rounded-xl border border-border bg-card px-4 py-3 text-[14px] font-medium text-foreground"
          >
            Open station <IconArrowRight size={15} />
          </Link>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
