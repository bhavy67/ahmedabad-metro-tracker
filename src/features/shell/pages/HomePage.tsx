import { Link } from 'react-router';
import { IconLocation, IconLoader2, IconArrowUpRight, IconStarFilled, IconMap2 } from '@tabler/icons-react';
import { useMetroClock } from '@/src/hooks/useMetroClock.ts';
import { useNearestStation } from '@/src/hooks/useNearestStation.ts';
import { useFavourites } from '@/src/hooks/useFavourites.ts';
import { useLiveCounts } from '@/src/hooks/useLiveTrains.ts';
import { LINE_IDS, network, getStation } from '@/src/lib/metro/network.ts';
import { formatScheduleTime12 } from '@/src/lib/metro/clock.ts';
import { DepartureBoard } from '@/src/features/station/DepartureBoard.tsx';
import { LastTrainStrip } from '@/src/features/station/LastTrainStrip.tsx';
import { CommuteCard } from '@/src/features/commute/CommuteCard.tsx';
import { NetworkPulse } from '@/src/features/map/NetworkPulse.tsx';
import { Bezel } from '@/components/Bezel.tsx';
import { AppFooter } from '@/src/features/shell/AppFooter.tsx';

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
  const counts = useLiveCounts();
  const total = LINE_IDS.reduce((n, l) => n + counts[l], 0);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-3.5 md:px-7">
      {/* Hero — headline on the left, the live network as a field of light on the right. */}
      <section className="grid gap-3.5 lg:grid-cols-12">
        <div className="rise flex flex-col justify-center px-1.5 pt-2 pb-4 lg:col-span-5 lg:pr-6">
          <span className="eyebrow self-start">
            <span className="live-dot" />
            {total > 0 ? `Live · ${total} train${total === 1 ? '' : 's'}` : 'No service right now'}
          </span>
          <h1 className="mt-4 font-display text-[clamp(2rem,7.6vw,3.6rem)] leading-[1.02] font-medium tracking-[-0.045em]">
            {greeting(clock.secondsOfDay)},
            <br />
            <span className="glow-text">{total > 0 ? 'the city is moving.' : 'the metro is resting.'}</span>
          </h1>
          <p className="mt-4 max-w-[40ch] text-[15px] text-muted-foreground md:text-[16px]">
            Every train on Ahmedabad Metro, in real time, computed from the official GMRC timetable. Works without
            signal underground.
          </p>
        </div>

        <Bezel className="rise lg:col-span-7" coreClassName="relative p-2.5 md:p-3" style={{ '--i': 1 } as React.CSSProperties}>
          <NetworkPulse />
          <div className="flex flex-wrap items-center gap-1.5 px-1.5 pt-2 pb-1">
            {LINE_IDS.map(line => (
              <Link
                key={line}
                to={`/line/${line}`}
                className="press surface surface-hover inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-bold"
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: `var(--line-${line})`, boxShadow: `0 0 8px var(--line-${line})` }}
                />
                {network.lines[line].name}
                <span className="tnum font-mono font-normal text-muted-foreground">{counts[line]}</span>
              </Link>
            ))}
            <Link
              to="/map"
              className="press ml-auto inline-flex items-center gap-1.5 rounded-full bg-white/8 px-3 py-1 text-[12px] font-bold hover:bg-white/12"
            >
              <IconMap2 size={14} stroke={1.75} /> Live map
            </Link>
          </div>
        </Bezel>
      </section>

      <section className="mt-3.5 grid gap-3.5 lg:grid-cols-12">
        <CommuteCard className="rise lg:col-span-7" style={{ '--i': 2 } as React.CSSProperties} />
        <NearestCard nearest={nearest} />
      </section>

      {favourites.length > 0 && (
        <section className="mt-10">
          <SectionHeading title="Favourites" aside={`${favourites.length} saved`} />
          <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-3">
            {favourites.map((id, i) => {
              const station = getStation(id);
              if (!station) return null;
              return (
                <Bezel key={id} className="rise" coreClassName="p-2 md:p-2" style={{ '--i': i + 3 } as React.CSSProperties}>
                  <div className="flex items-center gap-2 px-3 pt-3 pb-1">
                    <IconStarFilled size={15} className="text-line-yellow" />
                    <Link to={`/station/${id}`} className="min-w-0 flex-1 truncate font-display text-[17px] font-medium tracking-tight">
                      {station.name}
                    </Link>
                    <BoardLink to={`/station/${id}`} />
                  </div>
                  <LastTrainStrip stationId={id} />
                  <DepartureBoard stationId={id} limit={3} />
                </Bezel>
              );
            })}
          </div>
        </section>
      )}

      {/* Lines — glowing cards; swipe on mobile, a 4-up row on desktop. */}
      <section className="mt-10">
        <SectionHeading title="Lines" aside={<span className="md:hidden">Swipe →</span>} />
        <div className="scrollbar-hidden -mx-3.5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-3.5 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-4">
          {LINE_IDS.map(line => {
            const l = network.lines[line];
            return (
              <Link
                key={line}
                to={`/line/${line}`}
                className="group relative flex min-h-[176px] w-[78%] shrink-0 snap-start flex-col justify-between overflow-hidden rounded-[24px] border border-border bg-white/3 p-5 transition-[transform,border-color] duration-500 ease-(--spring) hover:-translate-y-1 hover:border-border-strong sm:w-[46%] md:w-auto"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-24 -right-16 h-56 w-56 rounded-full opacity-45 blur-[50px] transition-opacity duration-500 group-hover:opacity-75"
                  style={{ backgroundColor: `var(--line-${line})` }}
                />
                <span className="relative flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: `var(--line-${line})`, boxShadow: `0 0 12px var(--line-${line})` }}
                    />
                    {l.name}
                  </span>
                  <span className="tnum font-mono text-[12px] text-muted-foreground">{counts[line]} live</span>
                </span>
                <span className="relative mt-4 font-display text-[19px] leading-tight font-medium tracking-[-0.03em]">
                  {l.from}
                  <br />→ {l.to}
                </span>
                <span className="tnum relative mt-5 flex justify-between font-mono text-[12px] text-muted-foreground">
                  <span>{l.stations.length} stations</span>
                  <span>
                    {formatScheduleTime12(l.firstDeparture)} – {formatScheduleTime12(l.lastArrival)}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-14">
        <AppFooter />
      </section>
    </div>
  );
}

function NearestCard({ nearest }: { nearest: ReturnType<typeof useNearestStation> }) {
  const style = { '--i': 3 } as React.CSSProperties;

  if (nearest.status === 'ready' && nearest.station) {
    return (
      <Bezel className="rise lg:col-span-5" coreClassName="p-2 md:p-2" style={style}>
        <div className="flex items-start gap-3 px-3 pt-3 pb-2">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground uppercase">Nearest station</p>
            <p className="mt-1 truncate font-display text-[20px] leading-tight font-medium tracking-tight">{nearest.station.name}</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {Math.round((nearest.distanceMeters ?? 0) / 100) / 10} km away
            </p>
          </div>
          <BoardLink to={`/station/${nearest.station.id}`} />
        </div>
        <DepartureBoard stationId={nearest.station.id} limit={4} />
      </Bezel>
    );
  }

  return (
    <Bezel className="rise lg:col-span-5" coreClassName="flex flex-col items-center justify-center px-6 py-9 text-center" style={style}>
      {nearest.status === 'locating' ? (
        <p className="flex items-center gap-2 text-[14px] text-muted-foreground">
          <IconLoader2 size={16} className="animate-spin" /> Locating you…
        </p>
      ) : (
        <>
          <span
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/14 text-primary"
            style={{ boxShadow: '0 0 40px -6px var(--primary)' }}
          >
            <IconLocation size={22} stroke={1.5} />
          </span>
          <p className="font-display text-[18px] font-medium tracking-tight">Find the nearest station</p>
          <p className="mx-auto mt-1.5 mb-5 max-w-[28ch] text-[13px] text-muted-foreground">
            See live departures from wherever you are right now.
          </p>
          <button type="button" onClick={nearest.locate} className="pill-btn">
            Use my location
            <span className="knob">
              <IconArrowUpRight size={17} stroke={1.75} />
            </span>
          </button>
          {nearest.status === 'error' && <p className="mt-3 text-[12px] text-destructive">{nearest.errorMessage}</p>}
        </>
      )}
    </Bezel>
  );
}

function BoardLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="press inline-flex h-9 shrink-0 items-center gap-1 rounded-full bg-white/8 pr-1.5 pl-3.5 text-[13px] font-bold hover:bg-white/12"
    >
      Board
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
        <IconArrowUpRight size={14} stroke={1.75} />
      </span>
    </Link>
  );
}

function SectionHeading({ title, aside }: { title: string; aside?: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center justify-between px-1.5">
      <h2 className="font-display text-[22px] font-medium tracking-[-0.03em]">{title}</h2>
      {aside && <span className="text-[13px] text-muted-foreground">{aside}</span>}
    </div>
  );
}
