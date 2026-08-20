import { useMemo } from 'react';
import { IconMoonStars } from '@tabler/icons-react';
import { useMetroClock } from '@/src/hooks/useMetroClock.ts';
import { lastTrainToday } from '@/src/lib/metro/eta.ts';
import { requireStation } from '@/src/lib/metro/network.ts';
import { cn } from '@/lib/utils';
import ElectricBorder from '@/components/ElectricBorder.tsx';

const WARNING_THRESHOLD_MINUTES = 60;
const URGENT_THRESHOLD_MINUTES = 15;

export function LastTrainStrip({ stationId }: { stationId: string }) {
  const { secondsOfDay, dayOfWeek } = useMetroClock();
  const lastTrains = useMemo(() => lastTrainToday(stationId, secondsOfDay, dayOfWeek), [stationId, secondsOfDay, dayOfWeek]);

  const relevant = lastTrains.filter(t => t.minutesRemaining >= 0 && t.minutesRemaining <= WARNING_THRESHOLD_MINUTES);
  if (relevant.length === 0) return null;

  // A genuinely urgent "can I still get home?" moment earns the one bold,
  // energetic touch in this app — everywhere else stays quiet by design.
  const anyUrgent = relevant.some(t => t.minutesRemaining <= URGENT_THRESHOLD_MINUTES);

  const body = (
    <div className={cn('space-y-1.5 rounded-xl px-3 py-2.5', anyUrgent ? 'bg-destructive/10' : 'border border-destructive/30 bg-destructive/10')}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-destructive">
        <IconMoonStars size={14} />
        Last train tonight
      </div>
      {relevant.map(t => {
        const destination = requireStation(t.destinationStationId);
        const urgent = t.minutesRemaining <= URGENT_THRESHOLD_MINUTES;
        return (
          <div key={`${t.line}-${t.direction}`} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `var(--line-${t.line})` }} />
              to {destination.name}
            </span>
            <span className={cn('tnum font-mono font-semibold', urgent ? 'text-destructive' : 'text-foreground')}>
              {t.minutesRemaining} min
            </span>
          </div>
        );
      })}
    </div>
  );

  if (!anyUrgent) return <div className="mx-4 mb-3">{body}</div>;

  return (
    <div className="mx-4 mb-3">
      <ElectricBorder color="#ff4757" speed={1.3} chaos={0.5} borderRadius={12}>
        {body}
      </ElectricBorder>
    </div>
  );
}
