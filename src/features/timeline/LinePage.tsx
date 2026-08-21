import { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router';
import { animate, stagger } from 'animejs';
import { IconClock, IconChevronDown, IconArrowsExchange, IconArrowLeft } from '@tabler/icons-react';
import { network, requireStation } from '@/src/lib/metro/network.ts';
import { useLiveTrains } from '@/src/hooks/useLiveTrains.ts';
import { useAnimeScope } from '@/src/hooks/useAnimeScope.ts';
import { formatScheduleTime12 } from '@/src/lib/metro/clock.ts';
import type { LineId, TrainRun } from '@/src/lib/metro/types.ts';

const ROW_HEIGHT = 64;
/** Shared x-center (px, relative to the timeline container) for the track, station dots, and train markers. */
const RAIL_LEFT = 28;

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
        translateX: [-10, 0],
        delay: stagger(24),
        duration: 380,
        ease: 'outQuad',
      });
      animate(root.querySelectorAll('[data-line-dot]'), {
        opacity: [0, 1],
        scale: [0, 1],
        delay: stagger(24),
        duration: 380,
        ease: 'outQuad',
      });
      const track = root.querySelector('[data-line-track]');
      if (track) {
        animate(track, {
          scaleY: [0, 1],
          duration: Math.min(800, stationOrder.length * 40),
          ease: 'outQuad',
        });
      }
    },
    [line]
  );

  return (
    <div className="pb-8">
      {/* Full-bleed line color header — the identity anchor for the page. */}
      <div
        className="relative px-4 pt-4 pb-5"
        style={{ backgroundColor: `var(--line-${line})`, color: `var(--line-${line}-ink)` }}
      >
        <Link
          to="/"
          aria-label="Back to home"
          className="press mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/15 backdrop-blur"
        >
          <IconArrowLeft size={18} />
        </Link>
        <p className="font-display text-[11px] font-bold uppercase tracking-widest opacity-80">
          {meta.name} Line
        </p>
        <h1 className="mt-1 font-display text-[22px] font-semibold leading-tight">
          {meta.from}
          <span className="mx-1.5 opacity-70">→</span>
          {meta.to}
        </h1>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] font-medium opacity-90">
          <span className="tnum flex items-center gap-1 font-mono">
            <IconClock size={14} /> {formatScheduleTime12(meta.firstDeparture)} – {formatScheduleTime12(meta.lastArrival)}
          </span>
          <span className="tnum font-mono">{stationOrder.length} stations</span>
        </div>
      </div>

      <div ref={listRef} className="relative px-4 pt-5">
        {/* The track spans from the vertical center of the first station dot to the
            vertical center of the last — not from the container's top edge — so it
            terminates exactly at both end dots rather than overshooting or falling short. */}
        <div
          data-line-track
          className="absolute w-[3px] origin-top -translate-x-1/2 rounded-full"
          style={{
            left: RAIL_LEFT,
            top: 20 + ROW_HEIGHT / 2,
            height: (stationOrder.length - 1) * ROW_HEIGHT,
            backgroundColor: `var(--line-${line})`,
            opacity: 0.4,
          }}
        />

        {stationOrder.map((stationId, idx) => {
          const station = requireStation(stationId);
          return (
            <span
              key={stationId}
              data-line-dot
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-background"
              style={{
                left: RAIL_LEFT,
                top: 20 + idx * ROW_HEIGHT + ROW_HEIGHT / 2,
                width: station.isInterchange ? 16 : 12,
                height: station.isInterchange ? 16 : 12,
                backgroundColor: `var(--line-${line})`,
              }}
            />
          );
        })}

        {runsOnLine.map(run => (
          <TrainMarker key={run.tripKey} run={run} line={line} stationOrder={stationOrder} />
        ))}

        <ul className="list-none p-0 m-0">
          {stationOrder.map(stationId => {
            const station = requireStation(stationId);
            return (
              <li key={stationId} data-line-node style={{ height: ROW_HEIGHT }} className="relative">
                <Link
                  to={`/station/${stationId}`}
                  className="press flex h-full flex-col justify-center rounded-lg pr-2"
                  style={{ paddingLeft: RAIL_LEFT + 24 }}
                >
                  <p className="truncate text-[15px] font-medium text-foreground">{station.name}</p>
                  {station.isInterchange && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <IconArrowsExchange size={11} /> Interchange
                    </p>
                  )}
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
  const top = 20 + fraction * ROW_HEIGHT + ROW_HEIGHT / 2;
  const movingDown = toIdx > fromIdx;

  return (
    <div
      className="absolute z-20 -translate-x-1/2 -translate-y-1/2 transition-[top] duration-[950ms] ease-linear"
      style={{ left: RAIL_LEFT, top }}
      title={`${run.status === 'dwelling' ? 'At platform' : 'En route'} → ${run.destinationStationId}`}
    >
      <span className="relative flex h-6 w-6 items-center justify-center">
        <span className="signal-ping absolute inset-0 opacity-60" style={{ color: `var(--line-${line})` }} />
        <span
          className="relative flex h-6 w-6 items-center justify-center rounded-full border-2 border-background shadow-md"
          style={{ backgroundColor: `var(--line-${line})` }}
        >
          <IconChevronDown
            size={14}
            stroke={3.25}
            className="text-white/95 transition-transform duration-500"
            style={{ transform: movingDown ? 'rotate(0deg)' : 'rotate(180deg)' }}
          />
        </span>
      </span>
    </div>
  );
}
