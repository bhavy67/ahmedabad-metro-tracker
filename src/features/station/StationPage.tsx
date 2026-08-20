import { useParams, Link, Navigate } from 'react-router';
import { IconStar, IconStarFilled, IconTrain, IconBuildingArch, IconArrowsExchange } from '@tabler/icons-react';
import { getStation, network } from '@/src/lib/metro/network.ts';
import { useFavourites } from '@/src/hooks/useFavourites.ts';
import { DepartureBoard } from './DepartureBoard.tsx';
import { LastTrainStrip } from './LastTrainStrip.tsx';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function StationPage() {
  const { stationId } = useParams<{ stationId: string }>();
  const station = stationId ? getStation(stationId) : undefined;
  const { isFavourite, toggle } = useFavourites();

  if (!station) return <Navigate to="/" replace />;

  return (
    <div className="pb-6">
      <div className="border-b border-border bg-card px-4 pb-4 pt-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-semibold leading-tight">{station.name}</h1>
            <p className="text-xs text-muted-foreground">
              {station.nameGu} · {station.nameHi}
            </p>
          </div>
          <button
            type="button"
            onClick={() => toggle(station.id)}
            aria-pressed={isFavourite(station.id)}
            aria-label={isFavourite(station.id) ? 'Remove from favourites' : 'Add to favourites'}
            className="shrink-0 rounded-full p-2 text-muted-foreground transition-colors active:bg-accent"
          >
            {isFavourite(station.id) ? <IconStarFilled size={20} className="text-line-yellow" /> : <IconStar size={20} />}
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {station.lines.map(line => (
            <Link key={line} to={`/line/${line}`}>
              <Badge
                className="border-none font-display text-[11px] font-semibold uppercase tracking-wide"
                style={{ backgroundColor: `var(--line-${line})`, color: `var(--line-${line}-ink)` }}
              >
                {network.lines[line].name}
              </Badge>
            </Link>
          ))}
          {station.isInterchange && (
            <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <IconArrowsExchange size={13} /> Interchange
            </span>
          )}
          <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <IconBuildingArch size={13} /> {station.isUnderground ? 'Underground' : 'Elevated'}
          </span>
        </div>
      </div>

      <LastTrainStrip stationId={station.id} />

      <section className="px-4 pt-2">
        <h2 className="mb-1 flex items-center gap-1.5 font-display text-sm font-semibold">
          <IconTrain size={16} className="text-primary" /> Next departures
        </h2>
        <DepartureBoard stationId={station.id} limit={10} />
      </section>

      <section className="mt-2 px-4">
        <h2 className="mb-1.5 font-display text-sm font-semibold">Service hours</h2>
        <div className="grid grid-cols-1 gap-1.5">
          {station.lines.map(line => {
            const l = network.lines[line];
            return (
              <div key={line} className={cn('flex items-center justify-between rounded-lg border border-border px-3 py-2 text-xs')}>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `var(--line-${line})` }} />
                  {l.name}
                </span>
                <span className="tnum font-mono text-muted-foreground">
                  {l.firstDeparture.slice(0, 5)} – {l.lastArrival.slice(0, 5)}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
