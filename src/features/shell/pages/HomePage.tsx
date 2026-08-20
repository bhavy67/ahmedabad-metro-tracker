import { Link } from 'react-router';
import { animate, stagger } from 'animejs';
import { IconLocation, IconStar, IconLoader2 } from '@tabler/icons-react';
import { useMetroClock } from '@/src/hooks/useMetroClock.ts';
import { useNearestStation } from '@/src/hooks/useNearestStation.ts';
import { useFavourites } from '@/src/hooks/useFavourites.ts';
import { useLiveTrains } from '@/src/hooks/useLiveTrains.ts';
import { useAnimeScope } from '@/src/hooks/useAnimeScope.ts';
import { LINE_IDS, network, getStation } from '@/src/lib/metro/network.ts';
import { formatClock } from '@/src/lib/metro/clock.ts';
import { DepartureBoard } from '@/src/features/station/DepartureBoard.tsx';
import { LastTrainStrip } from '@/src/features/station/LastTrainStrip.tsx';
import { Button } from '@/components/ui/button';
import CountUp from '@/components/CountUp.tsx';

export function HomePage() {
  const clock = useMetroClock();
  const nearest = useNearestStation();
  const { favourites } = useFavourites();
  const trains = useLiveTrains();

  const linesGridRef = useAnimeScope<HTMLDivElement>(root => {
    animate(root.querySelectorAll('[data-line-card]'), {
      opacity: [0, 1],
      translateY: [16, 0],
      delay: stagger(60),
      duration: 380,
      ease: 'outQuad',
    });
  }, []);

  return (
    <div className="pb-6">
      <section className="border-b border-border bg-card px-4 pb-5 pt-4">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Ahmedabad · IST</p>
        <p className="tnum font-display text-4xl font-bold tabular-nums leading-none">{formatClock(clock.secondsOfDay).slice(0, 5)}</p>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <CountUp to={trains.length} duration={0.8} className="tnum font-mono font-semibold text-foreground" />
          train{trains.length === 1 ? '' : 's'} running across the network right now
        </p>
      </section>

      <section className="px-4 pt-4">
        {nearest.status === 'idle' || nearest.status === 'error' ? (
          <div className="rounded-xl border border-dashed border-border px-4 py-5 text-center">
            <IconLocation size={22} className="mx-auto mb-1.5 text-muted-foreground" />
            <p className="mb-2.5 text-sm text-muted-foreground">Find the nearest station and see live departures.</p>
            <Button size="sm" onClick={nearest.locate}>
              Use my location
            </Button>
            {nearest.status === 'error' && <p className="mt-2 text-[11px] text-destructive">{nearest.errorMessage}</p>}
          </div>
        ) : nearest.status === 'locating' ? (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-5 text-sm text-muted-foreground">
            <IconLoader2 size={16} className="animate-spin" /> Locating you…
          </div>
        ) : nearest.station ? (
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <div>
                <p className="font-display text-sm font-semibold">{nearest.station.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  Nearest station · {Math.round((nearest.distanceMeters ?? 0) / 100) / 10} km away
                </p>
              </div>
              <Link to={`/station/${nearest.station.id}`} className="text-[11px] font-medium text-primary">
                Full board
              </Link>
            </div>
            <div className="px-4">
              <DepartureBoard stationId={nearest.station.id} limit={3} />
            </div>
          </div>
        ) : null}
      </section>

      {favourites.length > 0 && (
        <section className="px-4 pt-5">
          <h2 className="mb-2 flex items-center gap-1.5 font-display text-sm font-semibold">
            <IconStar size={15} className="text-line-yellow" /> Favourites
          </h2>
          <div className="space-y-3">
            {favourites.map(id => {
              const station = getStation(id);
              if (!station) return null;
              return (
                <div key={id} className="rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between border-b border-border px-4 py-2">
                    <Link to={`/station/${id}`} className="font-display text-sm font-semibold hover:underline">
                      {station.name}
                    </Link>
                  </div>
                  <div className="px-4">
                    <LastTrainStrip stationId={id} />
                    <DepartureBoard stationId={id} limit={3} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="px-4 pt-5">
        <h2 className="mb-2 font-display text-sm font-semibold">Lines</h2>
        <div ref={linesGridRef} className="grid grid-cols-2 gap-2.5">
          {LINE_IDS.map(line => {
            const l = network.lines[line];
            return (
              <Link
                key={line}
                data-line-card
                to={`/line/${line}`}
                className="block rounded-xl border border-border p-3 transition-transform active:scale-[0.98]"
                style={{ backgroundColor: `color-mix(in oklch, var(--line-${line}) 14%, var(--card))` }}
              >
                <span
                  className="mb-2 inline-block rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: `var(--line-${line})`, color: `var(--line-${line}-ink)` }}
                >
                  {l.name}
                </span>
                <p className="text-xs text-muted-foreground">
                  {l.from} → {l.to}
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
