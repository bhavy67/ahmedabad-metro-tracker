import { useEffect, useRef, useState } from 'react';
import { Map as MaplibreMap, Marker, NavigationControl, AttributionControl, setWorkerUrl } from 'maplibre-gl';
// MapLibre 6 loads its tile worker as a separate module that the production
// build would otherwise never emit (the request falls through to index.html and
// the map never finishes loading). Bundle it as a real worker and point at it.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import 'maplibre-gl/dist/maplibre-gl.css';
import { IconFocusCentered } from '@tabler/icons-react';
import { buildLineFeatures, networkBounds } from '@/src/lib/metro/mapData.ts';
import { runningTrips, positionOf } from '@/src/lib/metro/live.ts';
import { currentEpochMs, istSecondsOfDay, istDayOfWeek, formatCountdown } from '@/src/lib/metro/clock.ts';
import { isClockOverridden } from '@/src/hooks/useMetroClock.ts';
import { allStations, LINE_IDS, network, requireStation } from '@/src/lib/metro/network.ts';
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

setWorkerUrl(maplibreWorkerUrl);

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

/**
 * Zoom at which every live train grows a persistent label. Below it the
 * network is small enough on screen that labels would overlap into mush, so
 * only the dots render and detail stays a tap away.
 */
const LABEL_MIN_ZOOM = 13;

interface TrainLabel {
  marker: Marker;
  el: HTMLDivElement;
  statusEl: HTMLElement;
  nextEl: HTMLElement;
  etaEl: HTMLElement;
  /** Last rendered text, so a 60fps tick only touches the DOM when it changed. */
  cache: string;
}

function trainLabelEl(line: LineId): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'metro-train-label';
  el.style.setProperty('--metro-line', `var(--line-${line})`);
  el.innerHTML = `
    <span class="metro-train-label-status"></span>
    <span class="metro-train-label-next"></span>
    <span class="metro-train-label-eta tnum"></span>
  `;
  return el;
}

/** The three lines of a train label: platform/running, next stop, ETA. */
function labelContent(run: TrainRun): { status: string; next: string; eta: string } {
  if (run.stopsRemaining === 0) {
    // Parked at the terminus — there is no next stop to count down to.
    return { status: 'At platform', next: `Terminus · ${requireStation(run.toStationId).name}`, eta: '—' };
  }
  return {
    status: run.status === 'dwelling' ? 'At platform' : 'Running',
    next: requireStation(run.toStationId).name,
    eta: `ETA ${formatCountdown(run.secondsToNextArrival)}`,
  };
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
  const trainLabelsRef = useRef<Map<string, TrainLabel>>(new Map());
  const labelsVisibleRef = useRef(false);
  const runsByKeyRef = useRef<Map<string, TrainRun>>(new Map());
  const selectedTrainRef = useRef<TrainRun | null>(null);
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

    // Persistent train labels are a zoom-level affordance: hidden while the
    // whole network is in view, shown once the camera is close enough for them
    // to sit apart from each other.
    const syncLabelVisibility = () => {
      const visible = map.getZoom() >= LABEL_MIN_ZOOM;
      if (visible === labelsVisibleRef.current) return;
      labelsVisibleRef.current = visible;
      for (const label of trainLabelsRef.current.values()) {
        label.el.style.display = visible ? '' : 'none';
      }
    };

    // OpenFreeMap's dark style references a few sprite images it doesn't ship
    // (e.g. "wood-pattern"); a transparent stand-in keeps the console clean.
    map.setMissingStyleImageResolver(id => {
      if (!map.hasImage(id)) map.addImage(id, { width: 1, height: 1, data: new Uint8Array(4) });
    });

    map.on('move', scheduleSyncLineOverlay);
    map.on('resize', scheduleSyncLineOverlay);
    map.on('zoom', syncLabelVisibility);
    map.on('load', () => {
      syncLineOverlay();
      syncLabelVisibility();
    });

    // Lines, stations and trains are DOM/SVG positioned through the map's own
    // projection, which is valid from construction — so they must not wait for
    // the basemap. Offline (style or tiles unreachable) the network still runs.
    syncLineOverlay();
    syncLabelVisibility();

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
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

          // The label rides in its own marker rather than inside the train
          // element: that one is rotated to the track bearing, and text that
          // spins with the train is unreadable.
          let label = trainLabelsRef.current.get(run.tripKey);
          if (!label) {
            const el = trainLabelEl(run.line);
            el.style.display = labelsVisibleRef.current ? '' : 'none';
            label = {
              marker: new Marker({ element: el, anchor: 'top', offset: [0, 15] })
                .setLngLat([pos.lng, pos.lat])
                .addTo(map),
              el,
              statusEl: el.querySelector('.metro-train-label-status') as HTMLElement,
              nextEl: el.querySelector('.metro-train-label-next') as HTMLElement,
              etaEl: el.querySelector('.metro-train-label-eta') as HTMLElement,
              cache: '',
            };
            trainLabelsRef.current.set(run.tripKey, label);
          } else {
            label.marker.setLngLat([pos.lng, pos.lat]);
          }

          // `!label.cache` covers a freshly created label: fill it even while
          // hidden so it never flashes empty the moment the user zooms in.
          if (labelsVisibleRef.current || !label.cache) {
            const { status, next, eta } = labelContent(run);
            const cache = `${status}|${next}|${eta}`;
            if (cache !== label.cache) {
              label.cache = cache;
              label.el.dataset.status = run.status;
              label.statusEl.textContent = status;
              label.nextEl.textContent = next;
              label.etaEl.textContent = eta;
            }
          }
        }
        for (const [tripKey, { marker }] of trainMarkersRef.current) {
          if (!seen.has(tripKey)) {
            marker.remove();
            trainMarkersRef.current.delete(tripKey);
          }
        }
        for (const [tripKey, label] of trainLabelsRef.current) {
          if (!seen.has(tripKey)) {
            label.marker.remove();
            trainLabelsRef.current.delete(tripKey);
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
  }, []); // runs after the map effect above in the same commit, so mapRef is set

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
