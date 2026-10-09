import { useParams, Link, Navigate } from 'react-router';
import {
  IconStar, IconStarFilled, IconBuildingArch, IconArrowsExchange, IconArrowUpRight,
} from '@tabler/icons-react';
import { getStation, network } from '@/src/lib/metro/network.ts';
import { useFavourites } from '@/src/hooks/useFavourites.ts';
import { formatScheduleTime12 } from '@/src/lib/metro/clock.ts';
import { Bezel } from '@/components/Bezel.tsx';
import { BackButton } from '@/src/features/shell/BackButton.tsx';
import { DepartureBoard } from './DepartureBoard.tsx';
import { LastTrainStrip } from './LastTrainStrip.tsx';

export function StationPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const station = stationId ? getStation(stationId) : undefined;
  const { isFavourite, toggle } = useFavourites();

  if (!station) return <Navigate to="/" replace />;

  const primaryLine = station.lines[0];
  const favourite = isFavourite(station.id);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-3.5 md:px-7">
      <header className="rise relative px-1.5 pb-7">
        {/* The station's line colour lights the header from behind. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-28 -left-16 h-80 w-80 rounded-full opacity-30 blur-[90px]"
          style={{ backgroundColor: `var(--line-${primaryLine})` }}
        />

        <div className="relative mb-6 flex items-center justify-between">
          <BackButton />
          <button
            type="button"
            onClick={() => toggle(station.id)}
            aria-pressed={favourite}
            aria-label={favourite ? 'Saved to favourites' : 'Save to favourites'}
            className="press surface surface-hover flex h-11 items-center gap-2 rounded-full px-4 text-[13px] font-bold"
          >
            {favourite ? (
              <IconStarFilled size={18} className="text-line-yellow" style={{ filter: 'drop-shadow(0 0 6px var(--line-yellow))' }} />
            ) : (
              <IconStar size={18} stroke={1.75} className="text-muted-foreground" />
            )}
            {favourite ? 'Saved' : 'Save'}
          </button>
        </div>

        <div className="relative flex flex-wrap items-center gap-2">
          {station.lines.map(line => (
            <Link
              key={line}
              to={`/line/${line}`}
              className="press surface surface-hover inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.14em] uppercase"
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: `var(--line-${line})`, boxShadow: `0 0 10px var(--line-${line})` }}
              />
              {network.lines[line].name}
            </Link>
          ))}
        </div>

        <h1 className="relative mt-4 font-display text-[clamp(2rem,8vw,3.6rem)] leading-[1.02] font-medium tracking-[-0.045em]">
          {station.name}
        </h1>
        <p className="relative mt-2 text-[15px] text-muted-foreground">
          {station.nameGu} · {station.nameHi}
        </p>

        <div className="relative mt-4 flex flex-wrap gap-2 text-[12px] font-semibold text-muted-foreground">
          {station.isInterchange && (
            <span className="surface inline-flex items-center gap-1.5 rounded-full px-3 py-1.5">
              <IconArrowsExchange size={14} stroke={1.75} /> Interchange
            </span>
          )}
          <span className="surface inline-flex items-center gap-1.5 rounded-full px-3 py-1.5">
            <IconBuildingArch size={14} stroke={1.75} /> {station.isUnderground ? 'Underground' : 'Elevated'}
          </span>
        </div>
      </header>

      <div className="grid gap-3.5 lg:grid-cols-12">
        <Bezel className="rise lg:col-span-7" coreClassName="p-2 md:p-2" style={{ '--i': 1 } as React.CSSProperties}>
          <div className="flex items-center justify-between px-3 pt-3 pb-2">
            <h2 className="font-display text-[19px] font-medium tracking-tight">Next departures</h2>
            <span className="eyebrow">
              <span className="live-dot" /> Live
            </span>
          </div>
          <LastTrainStrip stationId={station.id} />
          <DepartureBoard stationId={station.id} limit={10} />
        </Bezel>

        <div className="flex flex-col gap-3.5 lg:col-span-5">
          <Bezel className="rise" style={{ '--i': 2 } as React.CSSProperties}>
            <h2 className="mb-3 font-display text-[19px] font-medium tracking-tight">Service hours</h2>
            <div className="flex flex-col gap-2">
              {station.lines.map(line => {
                const l = network.lines[line];
                return (
                  <div key={line} className="surface flex items-center justify-between gap-3 rounded-[18px] px-4 py-3">
                    <span className="flex items-center gap-2.5 text-[14px] font-bold">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: `var(--line-${line})`, boxShadow: `0 0 10px var(--line-${line})` }}
                      />
                      {l.name}
                    </span>
                    <span className="tnum font-mono text-[13px] text-muted-foreground">
                      {formatScheduleTime12(l.firstDeparture)} – {formatScheduleTime12(l.lastArrival)}
                    </span>
                  </div>
                );
              })}
            </div>
          </Bezel>

          <Bezel className="rise" style={{ '--i': 3 } as React.CSSProperties}>
            <h2 className="font-display text-[19px] font-medium tracking-tight">Going somewhere?</h2>
            <p className="mt-1 mb-5 text-[13px] text-muted-foreground">
              Plan the fastest route from {station.name}, with fare and changes.
            </p>
            <Link to={`/plan?from=${station.id}`} className="pill-btn">
              Plan from here
              <span className="knob">
                <IconArrowUpRight size={17} stroke={1.75} />
              </span>
            </Link>
          </Bezel>
        </div>
      </div>
    </div>
  );
}
