import { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router';
import { animate, stagger } from 'animejs';
import { IconClock, IconChevronDown } from '@tabler/icons-react';
import { network, requireStation } from '@/src/lib/metro/network.ts';
import { useLiveTrains } from '@/src/hooks/useLiveTrains.ts';
import { useAnimeScope } from '@/src/hooks/useAnimeScope.ts';
import type { LineId, TrainRun } from '@/src/lib/metro/types.ts';

const ROW_HEIGHT = 56;
/** Shared x-center (px, relative to the timeline container) for the track, station dots, and train markers. */
const RAIL_LEFT = 23;

export function LinePage() {
  const { lineId } = useParams<{ lineId: string }>();
  const trains = useLiveTrains();

  if (!lineId || !(lineId in network.lines)) return <Navigate to="/" replace />;
  const line = lineId as LineId;
  const meta = network.lines[line];
  const stationOrder = meta.stations;

  const runsOnLine = useMemo(() => {
    const stationSet = new Set(stationOrder);
    return trains.filter(t => stationSet.has(t.fromStationId) && stationSet.has(t.toStationId));
  }, [trains, stationOrder]);

  const listRef = useAnimeScope<HTMLDivElement>(
    root => {
      animate(root.querySelectorAll('[data-line-node]'), {
        opacity: [0, 1],
        translateX: [-12, 0],
        delay: stagger(28),
        duration: 420,
        ease: 'outQuad',
      });
      animate(root.querySelectorAll('[data-line-dot]'), {
        opacity: [0, 1],
        scale: [0, 1],
        delay: stagger(28),
        duration: 420,
        ease: 'outQuad',
      });
      const track = root.querySelector('[data-line-track]');
      if (track) {
        animate(track, {
          scaleY: [0, 1],
          duration: Math.min(900, stationOrder.length * 45),
          ease: 'outQuad',
        });
      }
    },
    [line]
  );

  return (
    <div className="pb-8">
      <div className="border-b border-border bg-card px-4 pb-4 pt-3">
        <span
          className="mb-2 inline-block rounded-full px-2.5 py-1 font-display text-xs font-bold uppercase tracking-wide"
          style={{ backgroundColor: `var(--line-${line})`, color: `var(--line-${line}-ink)` }}
        >
          {meta.name}
        </span>
        <h1 className="font-display text-lg font-semibold leading-tight">
          {meta.from} → {meta.to}
        </h1>
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <IconClock size={13} /> {meta.firstDeparture.slice(0, 5)} – {meta.lastArrival.slice(0, 5)} ·{' '}
          {stationOrder.length} stations
        </p>
      </div>

      <div ref={listRef} className="relative px-4 pt-4">
        {/* The track spans from the vertical center of the first station dot to the
            vertical center of the last — not from the container's top edge — so it
            terminates exactly at both end dots rather than overshooting or falling short. */}
        <div
          data-line-track
          className="absolute w-[3px] origin-top -translate-x-1/2 rounded-full"
          style={{
            left: RAIL_LEFT,
            top: 16 + ROW_HEIGHT / 2,
            height: (stationOrder.length - 1) * ROW_HEIGHT,
            backgroundColor: `var(--line-${line})`,
            opacity: 0.35,
          }}
        />

        {/* Station dots are positioned exactly like the track and train markers above —
            absolute, relative to THIS container directly — deliberately not nested
            inside the <li> below. Nesting them in the (normal-flow, px-4-indented) list
            item stacks the container's own padding on top of the dot's own absolute
            offset, since an absolutely positioned element ignores its ancestor's
            padding while a normal-flow ancestor does not — that mismatch is exactly
            what pushed the dots to the right of the rail before this fix. */}
        {stationOrder.map((stationId, idx) => (
          <span
            key={stationId}
            data-line-dot
            className="absolute z-10 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background"
            style={{ left: RAIL_LEFT, top: 16 + idx * ROW_HEIGHT + ROW_HEIGHT / 2, backgroundColor: `var(--line-${line})` }}
          />
        ))}

        {/* Live train markers, positioned by fractional row offset from the top. */}
        {runsOnLine.map(run => (
          <TrainMarker key={run.tripKey} run={run} line={line} stationOrder={stationOrder} />
        ))}

        <ul className="list-none p-0 m-0">
          {stationOrder.map(stationId => {
            const station = requireStation(stationId);
            return (
              <li key={stationId} data-line-node style={{ height: ROW_HEIGHT }} className="relative">
                <Link to={`/station/${stationId}`} className="flex h-full flex-col justify-center" style={{ paddingLeft: RAIL_LEFT + 20 }}>
                  <p className="truncate text-sm font-medium">{station.name}</p>
                  {station.isInterchange && <p className="text-[10px] text-muted-foreground">Interchange</p>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function TrainMarker({ run, line, stationOrder }: { run: TrainRun; line: LineId; stationOrder: string[] }) {
  const fromIdx = stationOrder.indexOf(run.fromStationId);
  const toIdx = stationOrder.indexOf(run.toStationId);
  if (fromIdx === -1 || toIdx === -1) return null;

  const fraction = fromIdx + (toIdx - fromIdx) * run.progress;
  const top = 16 + fraction * ROW_HEIGHT + ROW_HEIGHT / 2;
  // Direction derived straight from the station indices, not the trip's own
  // fwd/bwd label — so it stays correct even for through-running trips whose
  // label refers to the whole (possibly multi-line) journey, not this segment.
  const movingDown = toIdx > fromIdx;

  return (
    <div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-[top] duration-[950ms] ease-linear"
      style={{ left: RAIL_LEFT, top }}
      title={`${run.status === 'dwelling' ? 'At platform' : 'En route'} → ${run.destinationStationId}`}
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        <span className="signal-ping absolute inset-0 opacity-60" style={{ color: `var(--line-${line})` }} />
        <span
          className="relative flex h-5 w-5 items-center justify-center rounded-full border-2 border-background shadow-md"
          style={{ backgroundColor: `var(--line-${line})` }}
        >
          <IconChevronDown
            size={12}
            stroke={3.5}
            className="text-white/95 transition-transform duration-500"
            style={{ transform: movingDown ? 'rotate(0deg)' : 'rotate(180deg)' }}
          />
        </span>
      </span>
    </div>
  );
}
