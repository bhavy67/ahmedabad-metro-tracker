import { useMemo } from 'react';
import { Link } from 'react-router';
import { IconArrowRight } from '@tabler/icons-react';
import { useMetroClock } from '@/src/hooks/useMetroClock.ts';
import { nextDepartures, type UpcomingDeparture } from '@/src/lib/metro/eta.ts';
import { requireStation } from '@/src/lib/metro/network.ts';
import { formatClockShort12 } from '@/src/lib/metro/clock.ts';
import { cn } from '@/lib/utils';

export function DepartureBoard({ stationId, limit = 6 }: { stationId: string; limit?: number }) {
  const { secondsOfDay, dayOfWeek } = useMetroClock();
  const departures = useMemo(
    () => nextDepartures(stationId, secondsOfDay, dayOfWeek, { limit }),
    [stationId, secondsOfDay, dayOfWeek, limit]
  );

  if (departures.length === 0) {
    return <p className="px-1 py-4 text-sm text-muted-foreground">No more departures scheduled from here today.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {departures.map((dep, i) => (
        <DepartureRow key={`${dep.tripKey}-${dep.direction}`} dep={dep} index={i} />
      ))}
    </ul>
  );
}

function DepartureRow({ dep, index }: { dep: UpcomingDeparture; index: number }) {
  const destination = requireStation(dep.destinationStationId);
  const imminent = dep.minutesAway <= 2 && !dep.isTomorrow;

  return (
    <li
      className={cn('row-fade-in flex items-center gap-3 py-3', imminent && 'rounded-lg bg-primary/8')}
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <span
        className="h-10 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: `var(--line-${dep.line})` }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <Link
          to={`/station/${destination.id}`}
          className="flex items-center gap-1.5 text-[15px] font-semibold text-foreground hover:underline"
        >
          <IconArrowRight size={14} className="shrink-0 text-muted-foreground" />
          <span className="truncate">{destination.name}</span>
        </Link>
        <p className="mt-0.5 text-[12px] text-muted-foreground">
          {dep.isTomorrow ? 'Tomorrow · ' : ''}
          {formatClockShort12(dep.departureSeconds)}
        </p>
      </div>
      <div className={cn('tnum shrink-0 text-right font-mono', imminent ? 'text-primary' : 'text-foreground')}>
        {dep.isTomorrow ? (
          <span className="text-[15px] font-semibold">{formatHours(dep.minutesAway)}</span>
        ) : dep.minutesAway <= 0 ? (
          <span className="text-[15px] font-bold uppercase">Now</span>
        ) : (
          <>
            <span className="text-[18px] font-bold leading-none">{dep.minutesAway}</span>{' '}
            <span className="text-[11px] font-medium uppercase text-muted-foreground">min</span>
          </>
        )}
      </div>
    </li>
  );
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
