import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { requireStation, network } from '@/src/lib/metro/network.ts';
import { useMetroClock } from '@/src/hooks/useMetroClock.ts';
import { estimateCrowd } from '@/src/lib/metro/crowd.ts';
import type { TrainRun } from '@/src/lib/metro/types.ts';

const CROWD_LABEL = { low: 'Light', moderate: 'Moderate', heavy: 'Crowded' } as const;
const CROWD_TONE = {
  low: 'text-emerald-500 bg-emerald-500/12',
  moderate: 'text-amber-500 bg-amber-500/12',
  heavy: 'text-red-500 bg-red-500/12',
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
            <span
              className="rounded-full px-2.5 py-0.5 font-display text-[11px] font-bold uppercase tracking-wide"
              style={{ backgroundColor: `var(--line-${run.line})`, color: `var(--line-${run.line}-ink)` }}
            >
              {lineMeta.name} Line
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${CROWD_TONE[crowd]}`}>
              {CROWD_LABEL[crowd]}
            </span>
          </div>
          <DrawerTitle className="font-display text-[20px] font-semibold leading-tight">
            To {destination.name}
          </DrawerTitle>
          <DrawerDescription className="text-[13px]">
            {run.status === 'dwelling' ? `At ${from.name}` : `Between ${from.name} and ${to.name}`}
            {' · '}
            {run.stopsRemaining} stop{run.stopsRemaining === 1 ? '' : 's'} to go
          </DrawerDescription>
        </DrawerHeader>
        <div className="space-y-1 px-4 pb-6 pt-2">
          <Row label="Status" value={run.status === 'dwelling' ? 'At platform' : 'En route'} />
          <Row label="Next stop in" value={`${Math.max(0, Math.round(run.secondsToNextStop))}s`} />
          <Row label="Started from" value={requireStation(run.originStationId).name} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 text-[14px] last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="tnum font-mono font-semibold text-foreground">{value}</span>
    </div>
  );
}
