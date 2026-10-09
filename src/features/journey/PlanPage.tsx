import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  IconArrowsUpDown, IconClock, IconArrowsExchange, IconTicket, IconArrowRight, IconClockHour4,
  IconShare3, IconCheck, IconArrowUpRight, IconRoute,
} from '@tabler/icons-react';
import { StationPicker } from './StationPicker.tsx';
import { useMetroClock } from '@/src/hooks/useMetroClock.ts';
import { planJourney, planJourneyArriveBy } from '@/src/lib/metro/plan.ts';
import { requireStation, getStation, network } from '@/src/lib/metro/network.ts';
import { formatClockShort12 } from '@/src/lib/metro/clock.ts';
import type { NetworkStation } from '@/src/lib/metro/types.ts';
import { Bezel } from '@/components/Bezel.tsx';
import CountUp from '@/components/CountUp.tsx';
import { cn } from '@/lib/utils';
import { useRecentJourneys } from '@/src/hooks/useRecentJourneys.ts';

type PlanMode = 'depart' | 'arrive';

function secondsToHHMM(s: number): string {
  const h = Math.floor(s / 3600) % 24;
  const m = Math.floor((s % 3600) / 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Waits at or above this get called out — the Violet line, for one, has a midday gap of several hours. */
const LONG_WAIT_SECONDS = 20 * 60;

function formatWait(seconds: number): string {
  const total = Math.max(0, Math.round(seconds / 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h} h${m ? ` ${m} min` : ''}` : `${m} min`;
}

function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 3600 + (m ?? 0) * 60;
}

export function PlanPage() {
  // The journey lives in the URL (?from=&to=&by=HH:MM) so refresh, back/forward
  // and shared links all restore it. State is seeded from the URL once, then
  // mirrored back into it below.
  const [searchParams, setSearchParams] = useSearchParams();
  const [origin, setOrigin] = useState<NetworkStation | null>(() => getStation(searchParams.get('from') ?? '') ?? null);
  const [destination, setDestination] = useState<NetworkStation | null>(() => getStation(searchParams.get('to') ?? '') ?? null);
  const urlArriveBy = searchParams.get('by');
  const [mode, setMode] = useState<PlanMode>(() => (urlArriveBy && HHMM.test(urlArriveBy) ? 'arrive' : 'depart'));
  const { secondsOfDay, dayOfWeek } = useMetroClock();

  // Default arrive-by time: current time + 30 min, initialised lazily so it
  // doesn't stale the moment the user switches tabs.
  const [arriveByTime, setArriveByTime] = useState<string>(() =>
    urlArriveBy && HHMM.test(urlArriveBy) ? urlArriveBy : secondsToHHMM(secondsOfDay + 30 * 60)
  );

  const { recents, add: addRecent } = useRecentJourneys();

  useEffect(() => {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev);
        const put = (key: string, value: string | null) => (value ? next.set(key, value) : next.delete(key));
        put('from', origin?.id ?? null);
        put('to', destination?.id ?? null);
        put('by', mode === 'arrive' ? arriveByTime : null);
        return next;
      },
      { replace: true }
    );
  }, [origin?.id, destination?.id, mode, arriveByTime, setSearchParams]);

  // Save to recents whenever a complete pair is selected
  useEffect(() => {
    if (origin && destination && origin.id !== destination.id) {
      addRecent(origin.id, destination.id);
    }
  }, [origin?.id, destination?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const plan = useMemo(() => {
    if (!origin || !destination) return undefined;
    if (mode === 'depart') {
      return planJourney(origin.id, destination.id, secondsOfDay, dayOfWeek);
    }
    return planJourneyArriveBy(origin.id, destination.id, parseHHMM(arriveByTime), dayOfWeek);
  }, [origin, destination, secondsOfDay, dayOfWeek, mode, arriveByTime]);

  function pickRecent(originId: string, destinationId: string) {
    const o = getStation(originId);
    const d = getStation(destinationId);
    if (o) setOrigin(o);
    if (d) setDestination(d);
  }

  function switchMode(next: PlanMode) {
    if (next === 'arrive' && mode === 'depart') {
      // Seed arrive-by with current time + 30 min when first switching
      setArriveByTime(secondsToHHMM(secondsOfDay + 30 * 60));
    }
    setMode(next);
  }

  const showRecents = recents.length > 0 && !origin && !destination;

  return (
    <div className="mx-auto grid w-full max-w-[1240px] gap-3.5 px-3.5 md:px-7 lg:grid-cols-12 lg:items-start">
      <div className="flex flex-col gap-3.5 lg:sticky lg:top-0 lg:col-span-5">
        <header className="rise px-1.5 pb-2">
          <span className="eyebrow">
            <IconRoute size={11} /> Journey planner
          </span>
          <h1 className="mt-4 font-display text-[clamp(2rem,7.6vw,3rem)] leading-[1.02] font-medium tracking-[-0.045em]">
            Plan a <span className="glow-text">journey.</span>
          </h1>
        </header>

        <Bezel className="rise" style={{ '--i': 1 } as React.CSSProperties}>
          {/* Mode toggle with a sliding thumb */}
          <div className="surface relative mb-4 grid grid-cols-2 rounded-full p-1">
            <span
              aria-hidden
              className={cn(
                'absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-full bg-white/12 transition-transform duration-500 ease-(--spring)',
                mode === 'arrive' && 'translate-x-full'
              )}
            />
            <ModeTab label="Depart now" active={mode === 'depart'} onClick={() => switchMode('depart')} />
            <ModeTab label="Arrive by" active={mode === 'arrive'} onClick={() => switchMode('arrive')} />
          </div>

          {mode === 'arrive' && (
            <label className="surface row-fade-in mb-3 flex items-center gap-3 rounded-[20px] px-4 py-2.5 transition-colors focus-within:border-primary/60 focus-within:bg-primary/6">
              <IconClock size={18} stroke={1.75} className="shrink-0 text-muted-foreground" />
              <span className="flex-1">
                <span className="block text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Arrive by</span>
                <input
                  type="time"
                  value={arriveByTime}
                  onChange={e => setArriveByTime(e.target.value)}
                  className="w-full bg-transparent font-mono text-[16px] font-medium text-foreground outline-none"
                />
              </span>
            </label>
          )}

          <div className="relative flex flex-col gap-2">
            <StationPicker label="From" icon="from" value={origin} onChange={setOrigin} exclude={destination?.id} />
            <StationPicker label="To" icon="to" value={destination} onChange={setDestination} exclude={origin?.id} />
            {origin && destination && (
              <button
                type="button"
                onClick={() => { setOrigin(destination); setDestination(origin); }}
                aria-label="Swap origin and destination"
                className="absolute top-1/2 right-12 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border-strong bg-[#16161D] transition-transform duration-600 ease-(--spring) hover:rotate-180"
              >
                <IconArrowsUpDown size={16} stroke={1.75} />
              </button>
            )}
          </div>

          {showRecents && (
            <div className="mt-5">
              <p className="mb-2 flex items-center gap-1.5 px-1 text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
                <IconClockHour4 size={13} stroke={1.75} /> Recent
              </p>
              <div className="flex flex-col gap-1.5">
                {recents.map(r => {
                  const o = getStation(r.originId);
                  const d = getStation(r.destinationId);
                  if (!o || !d) return null;
                  return (
                    <button
                      key={`${r.originId}-${r.destinationId}`}
                      type="button"
                      onClick={() => pickRecent(r.originId, r.destinationId)}
                      className="press surface surface-hover flex w-full items-center gap-2 rounded-[18px] px-4 py-3 text-left text-[14px] font-bold"
                    >
                      <span className="truncate">{o.name}</span>
                      <IconArrowRight size={14} stroke={1.75} className="shrink-0 text-muted-foreground" />
                      <span className="truncate">{d.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </Bezel>
      </div>

      <div className="lg:col-span-7">
        {!origin || !destination ? (
          <EmptyState
            title="Choose two stations"
            body="Pick an origin and destination to see the fastest route, fare and changes."
          />
        ) : origin.id === destination.id ? (
          <EmptyState title="Pick two different stations" body="Origin and destination need to be different." />
        ) : !plan ? (
          <EmptyState title="No route found" body="No route is available between these stations right now." />
        ) : (
          <JourneyResult plan={plan} mode={mode} nowSeconds={secondsOfDay} />
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
      aria-pressed={active}
      className={cn(
        'relative rounded-full py-2.5 text-[13px] font-bold transition-colors duration-300',
        active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
      )}
    >
      {label}
    </button>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Bezel className="rise" style={{ '--i': 2 } as React.CSSProperties} coreClassName="flex flex-col items-center px-6 py-12 text-center lg:py-20">
      <span
        className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/14 text-primary"
        style={{ boxShadow: '0 0 40px -6px var(--primary)' }}
      >
        <IconRoute size={22} stroke={1.5} />
      </span>
      <p className="font-display text-[18px] font-medium tracking-tight">{title}</p>
      <p className="mx-auto mt-1.5 max-w-[32ch] text-[13px] text-muted-foreground">{body}</p>
    </Bezel>
  );
}

function JourneyResult({
  plan,
  mode,
  nowSeconds,
}: {
  plan: NonNullable<ReturnType<typeof planJourney>>;
  mode: PlanMode;
  nowSeconds: number;
}) {
  const [copied, setCopied] = useState(false);

  // Time spent standing on a platform: before the first train (depart-now only)
  // and at each change. Long ones are surfaced instead of hiding inside a big
  // total duration.
  const firstWait = mode === 'depart' && !plan.isTomorrow ? plan.departSeconds - nowSeconds : 0;
  const changeWaits = plan.legs.map((leg, i) => (i === 0 ? 0 : leg.departSeconds - plan.legs[i - 1].arriveSeconds));
  const longWaits: string[] = [];
  if (firstWait >= LONG_WAIT_SECONDS) {
    longWaits.push(
      `The next train from ${requireStation(plan.originStationId).name} leaves at ${formatClockShort12(plan.departSeconds)} — a ${formatWait(firstWait)} wait.`
    );
  }
  plan.legs.forEach((leg, i) => {
    if (changeWaits[i] >= LONG_WAIT_SECONDS) {
      longWaits.push(
        `Long wait at ${requireStation(leg.boardStationId).name}: the next ${network.lines[leg.line].name} train leaves at ${formatClockShort12(leg.departSeconds)} — ${formatWait(changeWaits[i])}.`
      );
    }
  });

  async function handleShare() {
    const params = new URLSearchParams({ from: plan.originStationId, to: plan.destinationStationId });
    if (mode === 'arrive') params.set('by', secondsToHHMM(plan.arriveSeconds));
    const url = `${window.location.origin}/plan?${params}`;
    if (navigator.share) {
      try { await navigator.share({ title: 'Ahmedabad Metro journey', url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="rise grid grid-cols-3 gap-2.5" style={{ '--i': 2 } as React.CSSProperties}>
        <StatCard icon={IconClock} label="Duration" value={plan.durationMinutes} suffix=" min" />
        <StatCard icon={IconArrowsExchange} label="Changes" value={plan.transferCount} />
        <StatCard icon={IconTicket} label="Fare" value={plan.fare} prefix="₹" />
      </div>

      {plan.isTomorrow && (
        <p className="rounded-[20px] border border-line-yellow/30 bg-line-yellow/8 px-4 py-3 text-[13px] font-semibold">
          {mode === 'arrive'
            ? 'No connections reach your destination before this time today — showing tomorrow\'s schedule.'
            : 'No more trains today — this is the first departure tomorrow morning.'}
        </p>
      )}

      {longWaits.map(text => (
        <p key={text} className="row-fade-in rounded-[20px] border border-line-yellow/30 bg-line-yellow/8 px-4 py-3 text-[13px] font-semibold">
          {text}
        </p>
      ))}

      <Bezel className="rise" coreClassName="p-0 md:p-0" style={{ '--i': 3 } as React.CSSProperties}>
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div>
            <span className="block text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
              {mode === 'arrive' ? 'Latest depart' : 'Depart'}
            </span>
            <span className="tnum font-display text-[22px] font-medium tracking-[-0.03em]">
              {formatClockShort12(plan.departSeconds)}
            </span>
          </div>
          <span className="mx-2 h-px flex-1 bg-gradient-to-r from-white/5 via-white/25 to-white/5" />
          <div className="text-right">
            <span className="block text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Arrive</span>
            <span className="tnum font-display text-[22px] font-medium tracking-[-0.03em]">
              {formatClockShort12(plan.arriveSeconds)}
            </span>
          </div>
        </div>

        <ol className="flex flex-col gap-4 p-5">
          {plan.legs.map((leg, i) => {
            const board = requireStation(leg.boardStationId);
            const alight = requireStation(leg.alightStationId);
            return (
              <li key={leg.tripKey} className="row-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                {i > 0 && (
                  <div className="surface mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-muted-foreground">
                    <IconArrowsExchange size={13} stroke={1.75} /> Change at {board.name}
                    <span className={changeWaits[i] >= LONG_WAIT_SECONDS ? 'text-line-yellow' : ''}>
                      · {formatWait(changeWaits[i])} wait
                    </span>
                  </div>
                )}
                <div className="flex gap-3.5">
                  <div className="flex flex-col items-center pt-1.5">
                    <span className="h-3 w-3 rounded-full border-[3px] bg-[#0E0E14]" style={{ borderColor: `var(--line-${leg.line})` }} />
                    <span
                      className="my-1 w-[3px] flex-1 rounded-full"
                      style={{ backgroundColor: `var(--line-${leg.line})`, boxShadow: `0 0 10px var(--line-${leg.line})`, minHeight: 40 }}
                    />
                    <span className="h-3 w-3 rounded-full border-[3px] bg-[#0E0E14]" style={{ borderColor: `var(--line-${leg.line})` }} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-bold">{board.name}</p>
                    <p className="my-2 inline-flex items-center gap-2 text-[12px] font-semibold text-muted-foreground">
                      <span className="tnum rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide uppercase" style={{ color: `var(--line-${leg.line}-ink)`, backgroundColor: `var(--line-${leg.line})` }}>
                        {leg.line}
                      </span>
                      {leg.stops.length - 1} stop{leg.stops.length - 1 === 1 ? '' : 's'} ·{' '}
                      {Math.round((leg.arriveSeconds - leg.departSeconds) / 60)} min
                    </p>
                    <p className="text-[15px] font-bold">{alight.name}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </Bezel>

      <div className="rise flex flex-wrap gap-2" style={{ '--i': 4 } as React.CSSProperties}>
        <Link to={`/station/${plan.originStationId}`} className="pill-btn min-w-0 flex-1 sm:flex-none">
          <span className="truncate">Departures · {requireStation(plan.originStationId).name}</span>
          <span className="knob">
            <IconArrowUpRight size={17} stroke={1.75} />
          </span>
        </Link>
        <button type="button" onClick={handleShare} aria-label="Share journey" className="pill-btn ghost px-1.5">
          <span className="knob">{copied ? <IconCheck size={17} className="text-live" /> : <IconShare3 size={17} stroke={1.75} />}</span>
        </button>
      </div>
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
    <div className="surface rounded-[22px] px-3 py-4 text-center">
      <Icon size={17} stroke={1.5} className="mx-auto mb-2 text-muted-foreground" />
      <p className="tnum flex items-baseline justify-center font-display text-[20px] font-medium tracking-[-0.03em]">
        {prefix}
        <CountUp to={value} duration={0.6} />
        <span className="text-[13px] text-muted-foreground">{suffix}</span>
      </p>
      <p className="mt-1 text-[10px] font-bold tracking-[0.14em] text-muted-foreground uppercase">{label}</p>
    </div>
  );
}
