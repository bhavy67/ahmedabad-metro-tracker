import { useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router';
import { animate, stagger } from 'animejs';
import { IconClock, IconChevronDown, IconArrowsExchange } from '@tabler/icons-react';
import { Bezel } from '@/components/Bezel.tsx';
import { BackButton } from '@/src/features/shell/BackButton.tsx';
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

  // Hooks below must run unconditionally, so resolve an invalid id to a
  // placeholder line and redirect after them.
  const valid = !!lineId && lineId in network.lines;
  const line = (valid ? lineId : 'blue') as LineId;
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

  if (!valid) return <Navigate to="/" replace />;

  return (
    <div className="mx-auto grid w-full max-w-[1240px] gap-3.5 px-3.5 md:px-7 lg:grid-cols-12 lg:items-start">
      <header className="rise relative px-1.5 pb-4 lg:sticky lg:top-0 lg:col-span-5 lg:pt-2 lg:pr-6">
        {/* The line's own colour lights the page. */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-28 -left-16 h-80 w-80 rounded-full opacity-35 blur-[90px]"
          style={{ backgroundColor: `var(--line-${line})` }}
        />
        <BackButton className="relative mb-6" />
        <p className="relative inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.16em] uppercase">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: `var(--line-${line})`, boxShadow: `0 0 12px var(--line-${line})` }}
          />
          {meta.name}
        </p>
        <h1 className="relative mt-3 font-display text-[clamp(1.9rem,7vw,3.2rem)] leading-[1.05] font-medium tracking-[-0.04em]">
          {meta.from}
          <br />
          <span style={{ color: `var(--line-${line})` }}>→</span> {meta.to}
        </h1>
        <div className="relative mt-5 flex flex-wrap gap-2 text-[12px] font-semibold text-muted-foreground">
          <span className="surface tnum inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono">
            <IconClock size={14} stroke={1.75} /> {formatScheduleTime12(meta.firstDeparture)} – {formatScheduleTime12(meta.lastArrival)}
          </span>
          <span className="surface tnum inline-flex items-center rounded-full px-3 py-1.5 font-mono">{stationOrder.length} stations</span>
          <span className="surface inline-flex items-center gap-1.5 rounded-full px-3 py-1.5">
            <span className="live-dot" /> {runsOnLine.length} trains live
          </span>
        </div>
      </header>

      <Bezel className="rise lg:col-span-7" coreClassName="p-2 md:p-3" style={{ '--i': 1 } as React.CSSProperties}>
        <div ref={listRef} className="relative px-2 pt-5 pb-5">
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
              boxShadow: `0 0 12px var(--line-${line})`,
              opacity: 0.55,
            }}
          />

          {stationOrder.map((stationId, idx) => {
            const station = requireStation(stationId);
            return (
              <span
                key={stationId}
                data-line-dot
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px]"
                style={{
                  left: RAIL_LEFT,
                  top: 20 + idx * ROW_HEIGHT + ROW_HEIGHT / 2,
                  width: station.isInterchange ? 16 : 12,
                  height: station.isInterchange ? 16 : 12,
                  borderColor: station.isInterchange ? 'var(--foreground)' : `var(--line-${line})`,
                  backgroundColor: '#0E0E14',
                }}
              />
            );
          })}

          {runsOnLine.map(run => (
            <TrainMarker key={run.tripKey} run={run} line={line} stationOrder={stationOrder} />
          ))}

          <ul className="m-0 list-none p-0">
            {stationOrder.map(stationId => {
              const station = requireStation(stationId);
              return (
                <li key={stationId} data-line-node style={{ height: ROW_HEIGHT }} className="relative">
                  <Link
                    to={`/station/${stationId}`}
                    className="press flex h-full flex-col justify-center rounded-[18px] pr-3 hover:bg-white/4"
                    style={{ paddingLeft: RAIL_LEFT + 26 }}
                  >
                    <p className="truncate text-[15px] font-bold text-foreground">{station.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-muted-foreground">
                      {station.isInterchange && <IconArrowsExchange size={12} stroke={1.75} />}
                      {station.isInterchange
                        ? `Change for ${station.lines.filter(l => l !== line).map(l => network.lines[l].name).join(', ')}`
                        : station.nameGu}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </Bezel>
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
          className="relative flex h-6 w-6 items-center justify-center rounded-full bg-foreground"
          style={{ boxShadow: `0 0 0 3px var(--line-${line}), 0 0 18px 2px var(--line-${line})` }}
        >
          <IconChevronDown
            size={14}
            stroke={3.25}
            className="text-background transition-transform duration-500"
            style={{ transform: movingDown ? 'rotate(0deg)' : 'rotate(180deg)' }}
          />
        </span>
      </span>
    </div>
  );
}
