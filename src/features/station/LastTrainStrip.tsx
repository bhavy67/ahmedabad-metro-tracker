import { useMemo } from 'react';
import { IconMoonStars } from '@tabler/icons-react';
import { useMetroClock } from '@/src/hooks/useMetroClock.ts';
import { lastTrainToday } from '@/src/lib/metro/eta.ts';
import { requireStation } from '@/src/lib/metro/network.ts';
import { cn } from '@/lib/utils';

const WARNING_THRESHOLD_MINUTES = 60;
const URGENT_THRESHOLD_MINUTES = 15;

export function LastTrainStrip({ stationId }: { stationId: string }) {
  const { secondsOfDay, dayOfWeek } = useMetroClock();
  const lastTrains = useMemo(() => lastTrainToday(stationId, secondsOfDay, dayOfWeek), [stationId, secondsOfDay, dayOfWeek]);

  const relevant = lastTrains.filter(t => t.minutesRemaining >= 0 && t.minutesRemaining <= WARNING_THRESHOLD_MINUTES);
  if (relevant.length === 0) return null;

  // A genuinely urgent "can I still get home?" moment — a quiet, unmistakable
  // pulse (see .urgent-pulse in index.css) replaces the previous chaotic border.
  const anyUrgent = relevant.some(t => t.minutesRemaining <= URGENT_THRESHOLD_MINUTES);

  return (
    <div className="px-1 pt-1 pb-2">
      <div
        className={cn(
          'space-y-2 rounded-[20px] border px-4 py-3',
          anyUrgent
            ? 'urgent-pulse border-destructive/40 bg-destructive/12'
            : 'border-destructive/25 bg-destructive/8'
        )}
      >
        <div className="flex items-center gap-1.5 text-[12px] font-bold tracking-[0.1em] text-destructive uppercase">
          <IconMoonStars size={15} stroke={1.75} />
          Last train tonight
        </div>
        {relevant.map(t => {
          const destination = requireStation(t.destinationStationId);
          const urgent = t.minutesRemaining <= URGENT_THRESHOLD_MINUTES;
          return (
            <div key={`${t.line}-${t.direction}`} className="flex items-center justify-between text-[14px]">
              <span className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: `var(--line-${t.line})`, boxShadow: `0 0 10px var(--line-${t.line})` }}
                />
                <span className="font-semibold">to {destination.name}</span>
              </span>
              <span className={cn('tnum font-mono', urgent ? 'text-destructive' : 'text-foreground')}>
                <span className="text-[17px] font-semibold">{t.minutesRemaining}</span>{' '}
                <span className="text-[11px] font-medium uppercase opacity-70">min</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
