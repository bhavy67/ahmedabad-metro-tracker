import { useEffect, useRef, useState } from 'react';
import { Map as MaplibreMap, Marker, NavigationControl, AttributionControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { IconFocusCentered } from '@tabler/icons-react';
import { buildLineFeatures, networkBounds } from '@/src/lib/metro/mapData.ts';
import { runningTrips, positionOf } from '@/src/lib/metro/live.ts';
import { currentEpochMs, istSecondsOfDay, istDayOfWeek } from '@/src/lib/metro/clock.ts';
import { isClockOverridden } from '@/src/hooks/useMetroClock.ts';
import { allStations, LINE_IDS, network } from '@/src/lib/metro/network.ts';
import type { LineId, TrainRun } from '@/src/lib/metro/types.ts';
import { useLiveCounts } from '@/src/hooks/useLiveTrains.ts';
import { TrainDetailSheet } from './TrainDetailSheet.tsx';
import { StationPopoverCard } from './StationPopoverCard.tsx';

/**
 * Stations and live trains render as MapLibre `Marker`s (plain DOM elements
 * positioned via CSS transform through the map's own projection) rather than
 * GeoJSON circle layers, and the connecting lines render as an SVG overlay
 * re-projected on every camera move — both sidestepping MapLibre's
 * worker-based GeoJSON-vt tiling pipeline entirely. At this dataset size
 * (54 stations, a few dozen concurrent trains) that pipeline buys nothing
 * anyway; going straight to DOM/SVG is simpler and just as fast.
 */

// OpenFreeMap's dark vector style — free, no API key (Carto's raster tiles now
// require one). Tiles are cached by the service worker for offline use.
const BASEMAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';

function stationMarkerEl(line: LineId, isInterchange: boolean): HTMLDivElement {
  const el = document.createElement('div');
  // Kept deliberately small — at real station spacing, anything much bigger
  // than this makes the whole network read as a dense strip of dots instead
  // of a line. Interchanges get one visual cue (a white ring), not two.
  const size = isInterchange ? 13 : 8;
  el.style.cssText = isInterchange
    ? `width:${size}px; height:${size}px; border-radius:9999px; cursor:pointer;
       background:#050507; box-shadow: 0 0 0 2.5px #F4F4F6, 0 0 12px rgba(255,255,255,.5);`
    : `width:${size}px; height:${size}px; border-radius:9999px; cursor:pointer;
       background:var(--line-${line}); box-shadow: 0 0 0 2px #050507, 0 0 10px var(--line-${line});`;
  return el;
}

function trainMarkerEl(line: LineId): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'metro-train-marker';
  el.style.cssText = `width:20px; height:20px; cursor:pointer;`;
  el.innerHTML = `
    <span class="signal-ping" style="position:absolute; inset:0; opacity:.55; color:var(--line-${line});"></span>
    <span style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; border-radius:9999px;
                 background:#F4F4F6; box-shadow:0 0 0 3px var(--line-${line}), 0 0 16px 3px var(--line-${line});">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#050507"
           stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <path d="M6 15l6-6 6 6"/>
      </svg>
    </span>
  `;
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Keeps the network clear of the floating nav island (top) and dock + legend (bottom). */
function fitPadding() {
  return window.innerWidth < 768
    ? { top: 90, bottom: 190, left: 28, right: 28 }
    : { top: 100, bottom: 100, left: 80, right: 80 };
}

export function MapPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MaplibreMap | null>(null);
  const trainMarkersRef = useRef<Map<string, { marker: Marker; line: string }>>(new Map());
  const runsByKeyRef = useRef<Map<string, TrainRun>>(new Map());
  const selectedTrainRef = useRef<TrainRun | null>(null);
  const [ready, setReady] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState<TrainRun | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);

  selectedTrainRef.current = selectedTrain;

  useEffect(() => {
    if (!containerRef.current) return;
    const map = new MaplibreMap({
      container: containerRef.current,
      style: BASEMAP_STYLE,
      bounds: networkBounds(),
      fitBoundsOptions: { padding: fitPadding() },
      attributionControl: false,
      renderWorldCopies: false,
      maxZoom: 18,
      minZoom: 9,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(new AttributionControl({ compact: true }), 'bottom-left');

    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'pointer-events-none absolute inset-0 h-full w-full');
    map.getCanvasContainer().appendChild(svg);

    const lineFeatures = buildLineFeatures();
    const syncLineOverlay = () => {
      const paths = lineFeatures
        .map(f => {
          const d = f.geometry.coordinates.map(([lng, lat], i) => {
            const p = map.project([lng, lat]);
            return `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          }).join(' ');
          return `<path d="${d}" fill="none" style="stroke:var(--line-${f.properties.line})" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#map-line-glow)"/>`;
        })
        .join('');
      svg.innerHTML = `<defs><filter id="map-line-glow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${paths}`;
    };

    let overlaySyncQueued = false;
    const scheduleSyncLineOverlay = () => {
      if (overlaySyncQueued) return;
      overlaySyncQueued = true;
      requestAnimationFrame(() => {
        overlaySyncQueued = false;
        syncLineOverlay();
      });
    };

    for (const station of allStations()) {
      const el = stationMarkerEl(station.lines[0], station.isInterchange);
      el.addEventListener('click', () => setSelectedStationId(station.id));
      new Marker({ element: el }).setLngLat([station.lng, station.lat]).addTo(map);
    }

    map.on('move', scheduleSyncLineOverlay);
    map.on('resize', scheduleSyncLineOverlay);
    map.on('load', () => {
      syncLineOverlay();
      setReady(true);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let frame: number;

    const tick = () => {
      const map = mapRef.current;
      if (map) {
        const epochMs = currentEpochMs();
        const runs = runningTrips(istSecondsOfDay(epochMs), istDayOfWeek(epochMs));
        runsByKeyRef.current = new Map(runs.map(r => [r.tripKey, r]));

        const seen = new Set<string>();
        for (const run of runs) {
          seen.add(run.tripKey);
          const pos = positionOf(run);
          const existing = trainMarkersRef.current.get(run.tripKey);
          if (existing) {
            existing.marker.setLngLat([pos.lng, pos.lat]).setRotation(pos.bearingDeg);
          } else {
            const el = trainMarkerEl(run.line);
            el.addEventListener('click', () => setSelectedTrain(runsByKeyRef.current.get(run.tripKey) ?? null));
            const marker = new Marker({
              element: el,
              rotationAlignment: 'map',
              pitchAlignment: 'viewport',
            })
              .setLngLat([pos.lng, pos.lat])
              .setRotation(pos.bearingDeg)
              .addTo(map);
            trainMarkersRef.current.set(run.tripKey, { marker, line: run.line });
          }
        }
        for (const [tripKey, { marker }] of trainMarkersRef.current) {
          if (!seen.has(tripKey)) {
            marker.remove();
            trainMarkersRef.current.delete(tripKey);
          }
        }

        if (selectedTrainRef.current) {
          const updated = runsByKeyRef.current.get(selectedTrainRef.current.tripKey);
          if (updated) setSelectedTrain(updated);
        }
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [ready]);

  const recenter = () => {
    const map = mapRef.current;
    if (map) map.fitBounds(networkBounds(), { padding: fitPadding(), duration: 700 });
  };

  return (
    <div className="pulse-map relative h-full w-full">
      <div ref={containerRef} className="h-full w-full bg-background" />

      {/* Live legend — floats above the dock on mobile, bottom-left on desktop. */}
      <MapLegend />

      <button
        type="button"
        onClick={recenter}
        aria-label="Recenter to network"
        className="press glass absolute right-4 bottom-[calc(env(safe-area-inset-bottom)+96px)] z-10 flex h-12 w-12 items-center justify-center rounded-full shadow-lg md:bottom-6"
      >
        <IconFocusCentered size={20} stroke={1.75} />
      </button>

      {isClockOverridden() && (
        <div className="pointer-events-none absolute top-[calc(max(14px,env(safe-area-inset-top))+64px)] left-3 rounded-full bg-destructive px-3 py-1 font-mono text-[11px] font-semibold text-destructive-foreground">
          DEV CLOCK OVERRIDE
        </div>
      )}
      <TrainDetailSheet run={selectedTrain} open={selectedTrain !== null} onOpenChange={open => !open && setSelectedTrain(null)} />
      {selectedStationId && <StationPopoverCard stationId={selectedStationId} onClose={() => setSelectedStationId(null)} />}
    </div>
  );
}

function MapLegend() {
  const counts = useLiveCounts();
  return (
    <div className="glass absolute bottom-[calc(env(safe-area-inset-bottom)+96px)] left-3 z-10 flex max-w-[calc(100%-96px)] flex-wrap items-center gap-x-3 gap-y-1 rounded-[20px] px-3.5 py-2.5 text-[12px] font-bold shadow-lg md:bottom-6 md:left-6">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className="live-dot" /> Live
      </span>
      {LINE_IDS.map(line => (
        <span key={line} className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: `var(--line-${line})`, boxShadow: `0 0 8px var(--line-${line})` }}
          />
          {network.lines[line].name}
          <span className="tnum font-mono font-normal text-muted-foreground">{counts[line]}</span>
        </span>
      ))}
    </div>
  );
}
