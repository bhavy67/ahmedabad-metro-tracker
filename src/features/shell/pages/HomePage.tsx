import { Link } from 'react-router';
import { IconLocation, IconStar, IconLoader2, IconChevronRight, IconMapPin, IconRoute } from '@tabler/icons-react';
import { useMetroClock } from '@/src/hooks/useMetroClock.ts';
import { useNearestStation } from '@/src/hooks/useNearestStation.ts';
import { useFavourites } from '@/src/hooks/useFavourites.ts';
import { useLiveTrains } from '@/src/hooks/useLiveTrains.ts';
import { LINE_IDS, network, getStation } from '@/src/lib/metro/network.ts';
import { formatClock12, formatScheduleTime12 } from '@/src/lib/metro/clock.ts';
import { DepartureBoard } from '@/src/features/station/DepartureBoard.tsx';
import { LastTrainStrip } from '@/src/features/station/LastTrainStrip.tsx';
import { Button } from '@/components/ui/button';

function greeting(secondsOfDay: number): string {
  const h = Math.floor(secondsOfDay / 3600);
  if (h < 4) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

export function HomePage() {
  const clock = useMetroClock();
  const nearest = useNearestStation();
  const { favourites } = useFavourites();
  const trains = useLiveTrains();
  const { time, meridiem } = formatClock12(clock.secondsOfDay);

  return (
    <div className="pb-8">
      {/* Hero — greeting + status on the left, prominent live clock on the right. */}
      <section className="px-4 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{greeting(clock.secondsOfDay)}</p>
            <h1 className="mt-1 font-display text-[26px] font-semibold leading-tight tracking-tight">
              {trains.length > 0 ? 'Metro is running' : 'No trains right now'}
            </h1>
            <p className="mt-2 text-[14px] text-muted-foreground">
              <span className="tnum font-mono text-[16px] font-semibold text-foreground">
                {trains.length}
              </span>{' '}
              train{trains.length === 1 ? '' : 's'} live across the network
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="tnum font-mono text-[30px] font-bold leading-none tracking-tight text-foreground">
              {time}
            </p>
            <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {meridiem} · IST
            </p>
          </div>
        </div>
      </section>

      {/* Nearest station — primary destination card. */}
      <section className="px-4">
        {nearest.status === 'idle' || nearest.status === 'error' ? (
          <div className="rounded-2xl border border-dashed border-border-strong bg-card-muted/50 px-5 py-6 text-center">
            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <IconLocation size={22} />
            </div>
            <p className="mb-3 text-[15px] font-medium text-foreground">Find the nearest station</p>
            <p className="mx-auto mb-4 max-w-[26ch] text-[13px] text-muted-foreground">
              See live departures from wherever you are right now.
            </p>
            <Button onClick={nearest.locate} className="h-11 px-5 text-sm">
              Use my location
            </Button>
            {nearest.status === 'error' && (
              <p className="mt-3 text-[12px] text-destructive">{nearest.errorMessage}</p>
            )}
          </div>
        ) : nearest.status === 'locating' ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground">
            <IconLoader2 size={16} className="animate-spin" /> Locating you…
          </div>
        ) : nearest.station ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <IconMapPin size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Nearest station
                </p>
                <p className="truncate font-display text-[17px] font-semibold leading-tight">
                  {nearest.station.name}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {Math.round((nearest.distanceMeters ?? 0) / 100) / 10} km away
                </p>
              </div>
              <Link
                to={`/station/${nearest.station.id}`}
                className="press flex h-9 items-center gap-0.5 rounded-full bg-accent px-3 text-[13px] font-medium text-foreground"
              >
                Board <IconChevronRight size={14} />
              </Link>
            </div>
            <div className="border-t border-border px-4 py-1">
              <DepartureBoard stationId={nearest.station.id} limit={3} />
            </div>
          </div>
        ) : null}
      </section>

      {favourites.length > 0 && (
        <section className="px-4 pt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 font-display text-[15px] font-semibold">
              <IconStar size={16} className="text-line-yellow" fill="currentColor" /> Favourites
            </h2>
            <span className="text-[12px] text-muted-foreground">{favourites.length} saved</span>
          </div>
          <div className="space-y-3">
            {favourites.map(id => {
              const station = getStation(id);
              if (!station) return null;
              return (
                <div key={id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                  <div className="flex items-center justify-between gap-2 px-4 py-3">
                    <Link
                      to={`/station/${id}`}
                      className="min-w-0 flex-1 font-display text-[16px] font-semibold hover:underline"
                    >
                      {station.name}
                    </Link>
                    <Link
                      to={`/station/${id}`}
                      className="press flex h-8 items-center gap-0.5 rounded-full bg-accent px-2.5 text-[12px] font-medium text-foreground"
                    >
                      Board <IconChevronRight size={12} />
                    </Link>
                  </div>
                  <LastTrainStrip stationId={id} />
                  <div className="border-t border-border px-4 py-1">
                    <DepartureBoard stationId={id} limit={3} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Lines — horizontal scroll of full-color cards. Brand identity gets a real hero moment. */}
      <section className="pt-6">
        <div className="mb-2 flex items-center justify-between px-4">
          <h2 className="flex items-center gap-1.5 font-display text-[15px] font-semibold">
            <IconRoute size={16} className="text-muted-foreground" /> Lines
          </h2>
          <span className="text-[12px] text-muted-foreground">Tap to explore</span>
        </div>
        <div className="scrollbar-hidden flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 lg:grid lg:grid-cols-2 lg:overflow-visible lg:snap-none">
          {LINE_IDS.map(line => {
            const l = network.lines[line];
            return (
              <Link
                key={line}
                to={`/line/${line}`}
                className="press flex w-[68%] shrink-0 snap-start flex-col justify-between rounded-2xl p-4 shadow-sm lg:w-auto"
                style={{
                  backgroundColor: `var(--line-${line})`,
                  color: `var(--line-${line}-ink)`,
                  minHeight: 132,
                }}
              >
                <div>
                  <span className="inline-block rounded-full bg-black/15 px-2 py-0.5 font-display text-[11px] font-bold uppercase tracking-wide">
                    {l.name}
                  </span>
                  <p className="mt-2.5 font-display text-[15px] font-semibold leading-tight">
                    {l.from}
                    <span className="mx-1 opacity-70">→</span>
                    {l.to}
                  </p>
                </div>
                <p className="tnum mt-3 font-mono text-[12px] font-medium opacity-90">
                  {formatScheduleTime12(l.firstDeparture)} – {formatScheduleTime12(l.lastArrival)}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
