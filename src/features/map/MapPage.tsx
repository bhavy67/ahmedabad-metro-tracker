import { useEffect, useRef, useState } from 'react';
import { Map as MaplibreMap, Marker, NavigationControl, type StyleSpecification } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { IconLocationBolt } from '@tabler/icons-react';
import { buildLineFeatures, networkBounds } from '@/src/lib/metro/mapData.ts';
import { runningTrips, positionOf } from '@/src/lib/metro/live.ts';
import { currentEpochMs, istSecondsOfDay, istDayOfWeek } from '@/src/lib/metro/clock.ts';
import { isClockOverridden } from '@/src/hooks/useMetroClock.ts';
import { allStations, network } from '@/src/lib/metro/network.ts';
import type { TrainRun } from '@/src/lib/metro/types.ts';
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

function isDarkMode(): boolean {
  const root = document.documentElement;
  if (root.classList.contains('dark')) return true;
  if (root.classList.contains('light')) return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function basemapStyle(dark: boolean): StyleSpecification {
  const url = dark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  return {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles: [url.replace('{s}', 'a'), url.replace('{s}', 'b'), url.replace('{s}', 'c')],
        tileSize: 256,
        attribution: '© OpenStreetMap contributors © CARTO',
      },
    },
    layers: [{ id: 'basemap', type: 'raster', source: 'basemap' }],
  };
}

function stationMarkerEl(color: string, isInterchange: boolean): HTMLDivElement {
  const el = document.createElement('div');
  // Kept deliberately small — at real station spacing, anything much bigger
  // than this makes the whole network read as a dense strip of dots instead
  // of a line. Interchanges get one visual cue (a slightly larger dot with a
  // heavier ring), not two competing ones.
  const size = isInterchange ? 12 : 7;
  const ring = isInterchange ? 2.5 : 1.5;
  el.style.cssText = `
    width:${size}px; height:${size}px; border-radius:9999px; cursor:pointer;
    background:${color}; box-shadow: 0 0 0 ${ring}px #fff, 0 1px 2px rgba(0,0,0,.35);
  `;
  return el;
}

function trainMarkerEl(color: string): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'metro-train-marker';
  el.style.cssText = `width:18px; height:18px; cursor:pointer;`;
  el.innerHTML = `
    <span class="signal-ping" style="position:absolute; inset:0; opacity:.6; color:${color};"></span>
    <span style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
                 border-radius:9999px; background:${color}; border:2px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,.5);">
      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="rgba(255,255,255,.98)"
           stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" style="display:block;">
        <path d="M6 15l6-6 6 6"/>
      </svg>
    </span>
  `;
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

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
      style: basemapStyle(isDarkMode()),
      bounds: networkBounds(),
      fitBoundsOptions: { padding: 48 },
      attributionControl: { compact: true },
      renderWorldCopies: false,
      maxZoom: 18,
      minZoom: 9,
    });
    mapRef.current = map;
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right');

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
          return `<path d="${d}" fill="none" stroke="${f.properties.color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.95"/>`;
        })
        .join('');
      svg.innerHTML = paths;
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
      const el = stationMarkerEl(network.lines[station.lines[0]].color, station.isInterchange);
      el.addEventListener('click', () => setSelectedStationId(station.id));
      new Marker({ element: el }).setLngLat([station.lng, station.lat]).addTo(map);
    }

    map.on('move', scheduleSyncLineOverlay);
    map.on('resize', scheduleSyncLineOverlay);
    map.on('load', () => {
      syncLineOverlay();
      setReady(true);
    });

    // React to theme changes (auto + manual) by swapping the raster tiles.
    let currentDark = isDarkMode();
    const applyTheme = () => {
      const dark = isDarkMode();
      if (dark === currentDark) return;
      currentDark = dark;
      map.setStyle(basemapStyle(dark));
      map.once('styledata', () => {
        // Re-append the SVG overlay after style swap (getCanvasContainer is stable).
        map.getCanvasContainer().appendChild(svg);
        syncLineOverlay();
      });
    };
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', applyTheme);
    const observer = new MutationObserver(applyTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      mq.removeEventListener('change', applyTheme);
      observer.disconnect();
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
            const color = network.lines[run.line].color;
            const el = trainMarkerEl(color);
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
    if (map) map.fitBounds(networkBounds(), { padding: 48, duration: 700 });
  };

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Recenter FAB — large tap target, always visible in the safe spot above bottom sheet. */}
      <button
        type="button"
        onClick={recenter}
        aria-label="Recenter to network"
        className="press absolute bottom-4 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-lg"
      >
        <IconLocationBolt size={20} />
      </button>

      {isClockOverridden() && (
        <div className="pointer-events-none absolute left-3 top-3 rounded-md bg-destructive px-2 py-1 font-mono text-[11px] font-semibold text-destructive-foreground">
          DEV CLOCK OVERRIDE
        </div>
      )}
      <TrainDetailSheet run={selectedTrain} open={selectedTrain !== null} onOpenChange={open => !open && setSelectedTrain(null)} />
      {selectedStationId && <StationPopoverCard stationId={selectedStationId} onClose={() => setSelectedStationId(null)} />}
    </div>
  );
}
