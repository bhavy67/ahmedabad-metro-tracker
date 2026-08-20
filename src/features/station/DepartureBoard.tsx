import { useMemo } from 'react';
import { Link } from 'react-router';
import { IconArrowRight } from '@tabler/icons-react';
import { useMetroClock } from '@/src/hooks/useMetroClock.ts';
import { nextDepartures, type UpcomingDeparture } from '@/src/lib/metro/eta.ts';
import { requireStation } from '@/src/lib/metro/network.ts';
import { cn } from '@/lib/utils';

export function DepartureBoard({ stationId, limit = 6 }: { stationId: string; limit?: number }) {
  const { secondsOfDay, dayOfWeek } = useMetroClock();
  const departures = useMemo(
    () => nextDepartures(stationId, secondsOfDay, dayOfWeek, { limit }),
    [stationId, secondsOfDay, dayOfWeek, limit]
  );

  if (departures.length === 0) {
    return <p className="px-1 py-3 text-sm text-muted-foreground">No more departures scheduled from here today.</p>;
  }

  return (
    <ul className="divide-y divide-border">
      {departures.map(dep => (
        <DepartureRow key={`${dep.tripKey}-${dep.direction}`} dep={dep} />
      ))}
    </ul>
  );
}

function DepartureRow({ dep }: { dep: UpcomingDeparture }) {
  const destination = requireStation(dep.destinationStationId);
  const imminent = dep.minutesAway <= 2 && !dep.isTomorrow;

  return (
    <li className="flex items-center gap-3 py-2.5">
      <span
        className="h-8 w-1 shrink-0 rounded-full"
        style={{ backgroundColor: `var(--line-${dep.line})` }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          <IconArrowRight size={13} className="shrink-0 text-muted-foreground" />
          <Link to={`/station/${destination.id}`} className="truncate hover:underline">
            {destination.name}
          </Link>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {dep.isTomorrow ? 'Tomorrow · ' : ''}
          {formatClockShort(dep.departureSeconds)}
        </p>
      </div>
      <div className={cn('tnum shrink-0 text-right font-mono text-sm font-semibold', imminent && 'text-primary')}>
        {dep.isTomorrow ? formatHours(dep.minutesAway) : dep.minutesAway <= 0 ? 'Now' : `${dep.minutesAway} min`}
      </div>
    </li>
  );
}

function formatClockShort(secondsOfDay: number): string {
  const h = Math.floor(secondsOfDay / 3600);
  const m = Math.floor((secondsOfDay % 3600) / 60);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
