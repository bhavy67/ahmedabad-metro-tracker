import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { IconArrowsUpDown, IconClock, IconArrowsExchange, IconTicket, IconArrowRight } from '@tabler/icons-react';
import { StationPicker } from './StationPicker.tsx';
import { useMetroClock } from '@/src/hooks/useMetroClock.ts';
import { planJourney, planJourneyArriveBy } from '@/src/lib/metro/plan.ts';
import { requireStation } from '@/src/lib/metro/network.ts';
import { formatClockShort12 } from '@/src/lib/metro/clock.ts';
import type { NetworkStation } from '@/src/lib/metro/types.ts';
import { Button } from '@/components/ui/button';
import CountUp from '@/components/CountUp.tsx';
import { cn } from '@/lib/utils';

type PlanMode = 'depart' | 'arrive';

function secondsToHHMM(s: number): string {
  const h = Math.floor(s / 3600) % 24;
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 3600 + (m ?? 0) * 60;
}

export function PlanPage() {
  const [origin, setOrigin] = useState<NetworkStation | null>(null);
  const [destination, setDestination] = useState<NetworkStation | null>(null);
  const [mode, setMode] = useState<PlanMode>('depart');
  const { secondsOfDay, dayOfWeek } = useMetroClock();

  // Default arrive-by time: current time + 30 min, initialised lazily so it
  // doesn't stale the moment the user switches tabs.
  const [arriveByTime, setArriveByTime] = useState<string>(() =>
    secondsToHHMM(secondsOfDay + 30 * 60)
  );

  const plan = useMemo(() => {
    if (!origin || !destination) return undefined;
    if (mode === 'depart') {
      return planJourney(origin.id, destination.id, secondsOfDay, dayOfWeek);
    }
    return planJourneyArriveBy(origin.id, destination.id, parseHHMM(arriveByTime), dayOfWeek);
  }, [origin, destination, secondsOfDay, dayOfWeek, mode, arriveByTime]);

  function switchMode(next: PlanMode) {
    if (next === 'arrive' && mode === 'depart') {
      // Seed arrive-by with current time + 30 min when first switching
      setArriveByTime(secondsToHHMM(secondsOfDay + 30 * 60));
    }
    setMode(next);
  }

  return (
    <div className="pb-8">
      <div className="border-b border-border bg-card px-4 pb-5 pt-4">
        <h1 className="mb-4 font-display text-[22px] font-semibold tracking-tight">Plan your journey</h1>

        {/* Mode toggle */}
        <div className="mb-3 flex rounded-xl border border-border bg-background p-1">
          <ModeTab label="Depart now" active={mode === 'depart'} onClick={() => switchMode('depart')} />
          <ModeTab label="Arrive by" active={mode === 'arrive'} onClick={() => switchMode('arrive')} />
        </div>

        {/* Arrive-by time picker */}
        {mode === 'arrive' && (
          <div className="mb-3">
            <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Arrive by
            </label>
            <div className="relative">
              <IconClock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="time"
                value={arriveByTime}
                onChange={e => setArriveByTime(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-3 font-mono text-[15px] font-semibold text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
            </div>
          </div>
        )}

        {/* Station pickers */}
        <div className="relative flex flex-col gap-2">
          <StationPicker label="From" icon="from" value={origin} onChange={setOrigin} exclude={destination?.id} />
          <StationPicker label="To" icon="to" value={destination} onChange={setDestination} exclude={origin?.id} />
          {origin && destination && (
            <button
              type="button"
              onClick={() => { setOrigin(destination); setDestination(origin); }}
              aria-label="Swap origin and destination"
              className="press absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-background shadow-md"
            >
              <IconArrowsUpDown size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="px-4 pt-5">
        {!origin || !destination ? (
          <EmptyState
            title="Choose two stations"
            body="Pick an origin and destination to see the fastest route, fare and transfers."
          />
        ) : origin.id === destination.id ? (
          <EmptyState title="Pick two different stations" body="Origin and destination need to be different." />
        ) : !plan ? (
          <EmptyState title="No route found" body="No route is available between these stations right now." />
        ) : (
          <JourneyResult plan={plan} mode={mode} />
        )}
      </div>
    </div>
  );
}

function ModeTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-lg py-2 text-[13px] font-medium transition-colors',
        active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border-strong bg-card-muted/40 px-6 py-10 text-center">
      <p className="font-display text-[16px] font-semibold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-[32ch] text-[13px] text-muted-foreground">{body}</p>
    </div>
  );
}

function JourneyResult({ plan, mode }: { plan: NonNullable<ReturnType<typeof planJourney>>; mode: PlanMode }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        <StatCard icon={IconClock} label="Duration" value={plan.durationMinutes} suffix=" min" />
        <StatCard icon={IconArrowsExchange} label="Transfers" value={plan.transferCount} />
        <StatCard icon={IconTicket} label="Fare" value={plan.fare} prefix="₹" />
      </div>

      {plan.isTomorrow && (
        <p className="rounded-xl border border-line-yellow/40 bg-line-yellow/10 px-3.5 py-2.5 text-[13px] font-medium text-foreground">
          {mode === 'arrive'
            ? 'No connections reach your destination before this time today — showing tomorrow\'s schedule.'
            : 'No more trains today — this is the first departure tomorrow morning.'}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b border-border bg-card-muted/40 px-4 py-3 text-[14px]">
          <div className="flex items-baseline gap-1.5">
            <span className="tnum font-mono text-[16px] font-semibold text-foreground">
              {formatClockShort12(plan.departSeconds)}
            </span>
            <span className="text-[11px] uppercase text-muted-foreground">
              {mode === 'arrive' ? 'latest depart' : 'depart'}
            </span>
          </div>
          <IconArrowRight size={16} className="text-muted-foreground" />
          <div className="flex items-baseline gap-1.5">
            <span className="tnum font-mono text-[16px] font-semibold text-foreground">
              {formatClockShort12(plan.arriveSeconds)}
            </span>
            <span className="text-[11px] uppercase text-muted-foreground">arrive</span>
          </div>
        </div>

        <ol className="space-y-4 p-4">
          {plan.legs.map((leg, i) => {
            const board = requireStation(leg.boardStationId);
            const alight = requireStation(leg.alightStationId);
            return (
              <li key={leg.tripKey}>
                {i > 0 && (
                  <div className="mb-3 flex items-center gap-1.5 pl-1 text-[12px] font-medium text-muted-foreground">
                    <IconArrowsExchange size={13} /> Change at {board.name}
                  </div>
                )}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center pt-1">
                    <span
                      className="h-3 w-3 rounded-full border-2 border-background"
                      style={{ backgroundColor: `var(--line-${leg.line})` }}
                    />
                    <span
                      className="my-1 w-[3px] flex-1 rounded-full"
                      style={{ backgroundColor: `var(--line-${leg.line})`, minHeight: 34, opacity: 0.85 }}
                    />
                    <span
                      className="h-3 w-3 rounded-full border-2 border-background"
                      style={{ backgroundColor: `var(--line-${leg.line})` }}
                    />
                  </div>
                  <div className="flex-1 pb-1">
                    <p className="text-[15px] font-semibold">{board.name}</p>
                    <p
                      className="my-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide"
                      style={{
                        color: `var(--line-${leg.line}-ink)`,
                        backgroundColor: `var(--line-${leg.line})`,
                      }}
                    >
                      <IconArrowRight size={11} /> {leg.stops.length - 1} stop
                      {leg.stops.length - 1 === 1 ? '' : 's'} · {Math.round((leg.arriveSeconds - leg.departSeconds) / 60)} min
                    </p>
                    <p className="text-[15px] font-semibold">{alight.name}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <Link to={`/station/${plan.originStationId}`} className="block">
        <Button variant="outline" className="h-11 w-full text-sm">
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
    <div className="rounded-xl border border-border bg-card px-3 py-3 text-center shadow-sm">
      <Icon size={16} className="mx-auto mb-1.5 text-muted-foreground" />
      <p className="tnum flex items-baseline justify-center font-mono text-[17px] font-bold text-foreground">
        {prefix}
        <CountUp to={value} duration={0.6} />
        {suffix}
      </p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}
