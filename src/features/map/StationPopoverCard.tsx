import { Link } from 'react-router';
import { IconX } from '@tabler/icons-react';
import { requireStation } from '@/src/lib/metro/network.ts';
import { DepartureBoard } from '@/src/features/station/DepartureBoard.tsx';

export function StationPopoverCard({ stationId, onClose }: { stationId: string; onClose: () => void }) {
  const station = requireStation(stationId);

  return (
    <div className="absolute inset-x-3 bottom-3 z-10 max-h-[45dvh] overflow-y-auto rounded-xl border border-border bg-card/95 shadow-xl backdrop-blur">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <div>
          <Link to={`/station/${station.id}`} className="font-display text-sm font-semibold hover:underline">
            {station.name}
          </Link>
          <p className="text-[11px] text-muted-foreground">{station.isUnderground ? 'Underground' : 'Elevated'} station</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1.5 text-muted-foreground active:bg-accent">
          <IconX size={16} />
        </button>
      </div>
      <div className="px-4">
        <DepartureBoard stationId={station.id} limit={4} />
      </div>
    </div>
  );
}
