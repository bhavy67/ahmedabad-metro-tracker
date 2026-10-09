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
                className="surface inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.14em] uppercase"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: `var(--line-${line})`, boxShadow: `0 0 10px var(--line-${line})` }}
                />
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
          <DrawerTitle className="text-[22px] leading-tight">
            {station.name}
          </DrawerTitle>
        </DrawerHeader>
        <div className="min-h-0 overflow-y-auto px-2 pt-2 pb-3">
          <DepartureBoard stationId={station.id} limit={5} />
        </div>
        <div className="px-4 pb-5">
          <Link to={`/station/${station.id}`} className="pill-btn w-full">
            Open station
            <span className="knob">
              <IconArrowRight size={17} stroke={1.75} />
            </span>
          </Link>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
