import { useParams, Link, Navigate } from 'react-router';
import { IconStar, IconStarFilled, IconTrain, IconBuildingArch, IconArrowsExchange, IconArrowLeft } from '@tabler/icons-react';
import { getStation, network } from '@/src/lib/metro/network.ts';
import { useFavourites } from '@/src/hooks/useFavourites.ts';
import { formatScheduleTime12 } from '@/src/lib/metro/clock.ts';
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
    <div className="pb-8">
      {/* Line-color wash header — the brand color carries the station identity. */}
      <div
        className="relative border-b border-border px-4 pt-4 pb-5"
        style={{
          background: `linear-gradient(180deg, color-mix(in oklch, var(--line-${primaryLine}) 22%, var(--card)) 0%, var(--card) 100%)`,
        }}
      >
        <div className="mb-3 flex items-center justify-between">
          <Link
            to="/"
            aria-label="Back to home"
            className="press flex h-9 w-9 items-center justify-center rounded-full bg-background/70 text-foreground shadow-sm backdrop-blur"
          >
            <IconArrowLeft size={18} />
          </Link>
          <button
            type="button"
            onClick={() => toggle(station.id)}
            aria-pressed={favourite}
            aria-label={favourite ? 'Remove from favourites' : 'Add to favourites'}
            className="press flex h-11 w-11 items-center justify-center rounded-full bg-background/70 text-foreground shadow-sm backdrop-blur"
          >
            {favourite ? (
              <IconStarFilled size={22} className="text-line-yellow" />
            ) : (
              <IconStar size={22} className="text-muted-foreground" />
            )}
          </button>
        </div>

        <h1 className="font-display text-[28px] font-semibold leading-tight tracking-tight text-foreground">
          {station.name}
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {station.nameGu} · {station.nameHi}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {station.lines.map(line => (
            <Link
              key={line}
              to={`/line/${line}`}
              className="press inline-flex items-center rounded-full px-3 py-1 font-display text-[12px] font-bold uppercase tracking-wide shadow-sm"
              style={{ backgroundColor: `var(--line-${line})`, color: `var(--line-${line}-ink)` }}
            >
              {network.lines[line].name} Line
            </Link>
          ))}
          {station.isInterchange && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[12px] font-medium text-foreground backdrop-blur">
              <IconArrowsExchange size={13} /> Interchange
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background/60 px-2.5 py-1 text-[12px] font-medium text-foreground backdrop-blur">
            <IconBuildingArch size={13} /> {station.isUnderground ? 'Underground' : 'Elevated'}
          </span>
        </div>
      </div>

      <LastTrainStrip stationId={station.id} />

      <section className="px-4 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 font-display text-[15px] font-semibold">
            <IconTrain size={16} className="text-primary" /> Next departures
          </h2>
          <span className="text-[12px] text-muted-foreground">Live</span>
        </div>
        <div className="rounded-2xl border border-border bg-card px-4 shadow-sm">
          <DepartureBoard stationId={station.id} limit={10} />
        </div>
      </section>

      <section className="mt-5 px-4">
        <h2 className="mb-2 font-display text-[15px] font-semibold">Service hours</h2>
        <div className="space-y-2">
          {station.lines.map(line => {
            const l = network.lines[line];
            return (
              <div
                key={line}
                className="flex items-center justify-between rounded-xl border border-border bg-card px-3.5 py-3 shadow-sm"
              >
                <span className="flex items-center gap-2 text-[14px] font-medium">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: `var(--line-${line})` }}
                  />
                  {l.name} Line
                </span>
                <span className="tnum font-mono text-[13px] text-muted-foreground">
                  {formatScheduleTime12(l.firstDeparture)} – {formatScheduleTime12(l.lastArrival)}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
