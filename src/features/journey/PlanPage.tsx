import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { IconArrowsUpDown, IconClock, IconArrowsExchange, IconTicket, IconArrowRight } from '@tabler/icons-react';
import { StationPicker } from './StationPicker.tsx';
import { useMetroClock } from '@/src/hooks/useMetroClock.ts';
import { planJourney } from '@/src/lib/metro/plan.ts';
import { requireStation } from '@/src/lib/metro/network.ts';
import { formatClock } from '@/src/lib/metro/clock.ts';
import type { NetworkStation } from '@/src/lib/metro/types.ts';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import CountUp from '@/components/CountUp.tsx';

export function PlanPage() {
  const [origin, setOrigin] = useState<NetworkStation | null>(null);
  const [destination, setDestination] = useState<NetworkStation | null>(null);
  const { secondsOfDay, dayOfWeek } = useMetroClock();

  const plan = useMemo(() => {
    if (!origin || !destination) return undefined;
    return planJourney(origin.id, destination.id, secondsOfDay, dayOfWeek);
  }, [origin, destination, secondsOfDay, dayOfWeek]);

  return (
    <div className="pb-6">
      <div className="border-b border-border bg-card px-4 pb-4 pt-3">
        <h1 className="mb-3 font-display text-lg font-semibold">Plan your journey</h1>
        <div className="relative flex flex-col gap-2">
          <StationPicker label="From" value={origin} onChange={setOrigin} exclude={destination?.id} />
          <StationPicker label="To" value={destination} onChange={setDestination} exclude={origin?.id} />
          {origin && destination && (
            <button
              type="button"
              onClick={() => {
                setOrigin(destination);
                setDestination(origin);
              }}
              aria-label="Swap origin and destination"
              className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-sm"
            >
              <IconArrowsUpDown size={15} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-4">
        {!origin || !destination ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Choose an origin and destination to see routes.</p>
        ) : origin.id === destination.id ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Pick two different stations.</p>
        ) : !plan ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No route found between these stations.</p>
        ) : (
          <JourneyResult plan={plan} />
        )}
      </div>
    </div>
  );
}

function JourneyResult({ plan }: { plan: NonNullable<ReturnType<typeof planJourney>> }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={IconClock} label="Duration" value={plan.durationMinutes} suffix=" min" />
        <StatCard icon={IconArrowsExchange} label="Transfers" value={plan.transferCount} />
        <StatCard icon={IconTicket} label="Fare" value={plan.fare} prefix="₹" />
      </div>

      {plan.isTomorrow && (
        <p className="rounded-lg border border-line-yellow/40 bg-line-yellow/10 px-3 py-2 text-xs font-medium text-foreground">
          No more trains today — this is the first departure tomorrow morning.
        </p>
      )}

      <div className="rounded-xl border border-border bg-card px-4 py-3">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="tnum font-mono font-semibold">{formatClock(plan.departSeconds).slice(0, 5)}</span>
          <span className="text-muted-foreground">→</span>
          <span className="tnum font-mono font-semibold">{formatClock(plan.arriveSeconds).slice(0, 5)}</span>
        </div>
        <ol className="space-y-3">
          {plan.legs.map((leg, i) => {
            const board = requireStation(leg.boardStationId);
            const alight = requireStation(leg.alightStationId);
            return (
              <li key={leg.tripKey}>
                {i > 0 && (
                  <div className="mb-2 flex items-center gap-1.5 pl-1 text-[11px] text-muted-foreground">
                    <IconArrowsExchange size={12} /> Change at {board.name}
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-background" style={{ backgroundColor: `var(--line-${leg.line})` }} />
                    <span className="my-0.5 w-0.5 flex-1 rounded-full" style={{ backgroundColor: `var(--line-${leg.line})`, minHeight: 24 }} />
                    <span className="h-2.5 w-2.5 rounded-full border-2 border-background" style={{ backgroundColor: `var(--line-${leg.line})` }} />
                  </div>
                  <div className="flex-1 pb-1">
                    <p className="text-sm font-medium">{board.name}</p>
                    <p className="my-1 flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide" style={{ color: `var(--line-${leg.line})` }}>
                      <IconArrowRight size={11} /> {leg.stops.length - 1} stop{leg.stops.length - 1 === 1 ? '' : 's'} · {Math.round((leg.arriveSeconds - leg.departSeconds) / 60)} min
                    </p>
                    <p className="text-sm font-medium">{alight.name}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <Link to={`/station/${plan.originStationId}`}>
        <Button variant="outline" className="w-full">
          View departure board at {requireStation(plan.originStationId).name}
        </Button>
      </Link>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  prefix = '',
  suffix = '',
}: {
  icon: typeof IconClock;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-border bg-card px-2.5 py-2 text-center')}>
      <Icon size={14} className="mx-auto mb-1 text-muted-foreground" />
      <p className="tnum flex items-baseline justify-center font-mono text-sm font-semibold">
        {prefix}
        <CountUp to={value} duration={0.6} />
        {suffix}
      </p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
