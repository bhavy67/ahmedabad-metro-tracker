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
    return <p className="px-3 py-5 text-[14px] text-muted-foreground">No more departures scheduled from here today.</p>;
  }

  return (
    <ul className="flex flex-col">
      {departures.map((dep, i) => (
        <DepartureRow key={`${dep.tripKey}-${dep.direction}`} dep={dep} index={i} />
      ))}
    </ul>
  );
}

function DepartureRow({ dep, index }: { dep: UpcomingDeparture; index: number }) {
  const destination = requireStation(dep.destinationStationId);
  const imminent = dep.minutesAway <= 2 && !dep.isTomorrow;

  // The whole row is the link (to the train's destination station), so the tap
  // target is the full ~60px row rather than just the destination text.
  return (
    <li className="row-fade-in" style={{ animationDelay: `${index * 45}ms` }}>
      <Link
        to={`/station/${destination.id}`}
        className={cn(
          'flex items-center gap-3 rounded-[18px] px-3 py-2.5 transition-colors duration-300 hover:bg-white/4',
          imminent && 'bg-live/6'
        )}
      >
        <span
          className="h-9 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: `var(--line-${dep.line})`, boxShadow: `0 0 14px var(--line-${dep.line})` }}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1 text-[15px] font-bold text-foreground">
            <IconArrowRight size={14} stroke={1.75} className="shrink-0 text-muted-foreground" />
            <span className="truncate">{destination.name}</span>
          </span>
          <span className="tnum mt-0.5 block font-mono text-[12px] text-muted-foreground">
            {dep.isTomorrow ? 'Tomorrow · ' : ''}
            {formatClockShort12(dep.departureSeconds)}
          </span>
        </span>
        <span className="tnum shrink-0 text-right">
          {dep.isTomorrow ? (
            <span className="font-mono text-[15px] font-semibold">{formatHours(dep.minutesAway)}</span>
          ) : dep.minutesAway <= 0 ? (
            <span className="block font-display text-[22px] leading-none font-medium text-live [text-shadow:0_0_18px_rgb(92_242_181/0.55)]">
              Now
              <small className="mt-1 block font-sans text-[10px] font-bold tracking-[0.14em] text-muted-foreground">BOARD</small>
            </span>
          ) : (
            <span className={cn('block font-display text-[24px] leading-none font-medium tracking-[-0.04em]', imminent && 'text-live')}>
              {dep.minutesAway}
              <small className="mt-1 block font-sans text-[10px] font-bold tracking-[0.14em] text-muted-foreground">MIN</small>
            </span>
          )}
        </span>
      </Link>
    </li>
  );
}

function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
