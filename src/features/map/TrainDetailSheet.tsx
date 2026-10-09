import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { requireStation, network } from '@/src/lib/metro/network.ts';
import { useMetroClock } from '@/src/hooks/useMetroClock.ts';
import { formatCountdown } from '@/src/lib/metro/clock.ts';
import { estimateCrowd } from '@/src/lib/metro/crowd.ts';
import type { TrainRun } from '@/src/lib/metro/types.ts';

const CROWD_LABEL = { low: 'Light', moderate: 'Moderate', heavy: 'Crowded' } as const;
const CROWD_TONE = {
  low: 'text-live bg-live/12',
  moderate: 'text-line-yellow bg-line-yellow/12',
  heavy: 'text-destructive bg-destructive/12',
} as const;

export function TrainDetailSheet({ run, open, onOpenChange }: { run: TrainRun | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { secondsOfDay, dayOfWeek } = useMetroClock();
  if (!run) return null;

  const from = requireStation(run.fromStationId);
  const to = requireStation(run.toStationId);
  const destination = requireStation(run.destinationStationId);
  const crowd = estimateCrowd({ dayOfWeek, secondsOfDay, progress: run.progress });
  const lineMeta = network.lines[run.line];

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader>
          <div className="mb-2 flex items-center gap-2">
            <span className="surface inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.14em] uppercase">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: `var(--line-${run.line})`, boxShadow: `0 0 10px var(--line-${run.line})` }}
              />
              {lineMeta.name}
            </span>
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${CROWD_TONE[crowd]}`}>
              {CROWD_LABEL[crowd]}
            </span>
          </div>
          <DrawerTitle className="text-[22px] leading-tight">
            To {destination.name}
          </DrawerTitle>
          <DrawerDescription className="text-[13px]">
            {run.status === 'dwelling' ? `At ${from.name}` : `Between ${from.name} and ${to.name}`}
            {' · '}
            {run.stopsRemaining} stop{run.stopsRemaining === 1 ? '' : 's'} to go
          </DrawerDescription>
        </DrawerHeader>
        <div className="mx-4 mt-3 mb-6 surface rounded-[20px] px-4 py-1">
          <Row label="Status" value={run.status === 'dwelling' ? 'At platform' : 'En route'} />
          {run.stopsRemaining > 0 && (
            <Row label={`Reaches ${to.name} in`} value={formatCountdown(run.secondsToNextArrival)} />
          )}
          {run.status === 'dwelling' && run.stopsRemaining > 0 && (
            <Row label="Departs in" value={formatCountdown(run.secondsToNextStop)} />
          )}
          <Row label="Started from" value={requireStation(run.originStationId).name} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 text-[14px] last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="tnum font-mono font-semibold text-foreground">{value}</span>
    </div>
  );
}
