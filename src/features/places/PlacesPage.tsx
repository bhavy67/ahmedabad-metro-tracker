import { useState } from 'react';
import { Link } from 'react-router';
import {
  IconSearch, IconX, IconMapPin, IconChevronRight,
  IconBuildingStore, IconHeartPlus, IconSchool, IconStars, IconTrain,
  IconLoader2, IconRoute,
} from '@tabler/icons-react';
import { nearestStation, walkingMinutes } from '@/src/lib/metro/geo.ts';
import { getStation } from '@/src/lib/metro/network.ts';
import { CURATED_PLACES, CATEGORY_LABELS, CATEGORY_ORDER, type CuratedPlace, type ResolvedPlace } from '@/src/lib/metro/places.ts';
import { useNominatim, type NominatimResult } from '@/src/hooks/useNominatim.ts';
import type { NetworkStation } from '@/src/lib/metro/types.ts';

// Pre-computed once at module load — curated places are static so no need to
// call nearestStation() on every tap.
const RESOLVED_PLACES: ResolvedPlace[] = CURATED_PLACES.map(p => {
  const { station, distanceMeters } = nearestStation([p.lat, p.lng]);
  return { ...p, stationId: station.id, distanceMeters };
});

interface PlaceResult {
  name: string;
  station: NetworkStation;
  distanceMeters: number;
}

function mapsDirectionsUrl(lat: number, lng: number, label: string): string {
  // On iOS opens Apple Maps; on Android/desktop opens Google Maps
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isIos) return `maps://?daddr=${lat},${lng}&dirflg=w`;
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_name=${encodeURIComponent(label)}&travelmode=walking`;
}

const CATEGORY_ICON: Record<CuratedPlace['category'], React.ReactNode> = {
  transport: <IconTrain size={14} stroke={2} />,
  mall: <IconBuildingStore size={14} stroke={2} />,
  hospital: <IconHeartPlus size={14} stroke={2} />,
  education: <IconSchool size={14} stroke={2} />,
  attraction: <IconStars size={14} stroke={2} />,
};

export function PlacesPage() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<PlaceResult | null>(null);
  const { results: nominatimResults, status, search, clear } = useNominatim();

  function handleQueryChange(val: string) {
    setQuery(val);
    setResult(null);
    if (!val.trim()) { clear(); return; }
    search(val);
  }

  function handleCuratedPick(resolved: ResolvedPlace) {
    const station = getStation(resolved.stationId)!;
    setResult({ name: resolved.name, station, distanceMeters: resolved.distanceMeters });
    setQuery('');
    clear();
  }

  function handleNominatimPick(item: NominatimResult) {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    const shortName = item.display_name.split(',')[0].trim();
    const { station, distanceMeters } = nearestStation([lat, lng]);
    setResult({ name: shortName, station, distanceMeters });
    setQuery('');
    clear();
  }

  const showDropdown = query.trim().length > 0 && (status === 'loading' || nominatimResults.length > 0);

  return (
    <div className="pb-8">
      <div className="border-b border-border bg-card px-4 pb-5 pt-4">
        <h1 className="mb-4 font-display text-[22px] font-semibold tracking-tight">Find nearest station</h1>

        {/* Search bar */}
        <div className="relative">
          <IconSearch size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search any place in Ahmedabad…"
            className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-10 text-[15px] outline-none focus:border-ring focus:ring-2 focus:ring-ring/20"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); clear(); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <IconX size={16} />
            </button>
          )}

          {/* Nominatim dropdown */}
          {showDropdown && (
            <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-10 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
              {status === 'loading' && (
                <div className="flex items-center gap-2 px-4 py-3 text-[13px] text-muted-foreground">
                  <IconLoader2 size={14} className="animate-spin" /> Searching…
                </div>
              )}
              {nominatimResults.map(item => (
                <button
                  key={item.place_id}
                  type="button"
                  onClick={() => handleNominatimPick(item)}
                  className="press flex w-full items-start gap-3 border-t border-border px-4 py-3 text-left first:border-t-0"
                >
                  <IconMapPin size={15} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14px] font-semibold text-foreground line-clamp-1">
                      {item.display_name.split(',')[0]}
                    </span>
                    <span className="block truncate text-[12px] text-muted-foreground">
                      {item.display_name.split(',').slice(1, 3).join(',')}
                    </span>
                  </span>
                </button>
              ))}
              {status === 'done' && nominatimResults.length === 0 && (
                <div className="px-4 py-3 text-[13px] text-muted-foreground">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6 px-4 pt-5">
        {/* Result card */}
        {result && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="bg-primary/8 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Nearest station to</p>
              <p className="mt-0.5 font-display text-[16px] font-semibold text-foreground">{result.name}</p>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                <IconTrain size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[17px] font-semibold">{result.station.name}</p>
                <div className="mt-0.5 flex items-center gap-2 text-[12px] text-muted-foreground">
                  <span>{(result.distanceMeters / 1000).toFixed(1)} km away</span>
                  <span>·</span>
                  <span>~{walkingMinutes(result.distanceMeters)} min walk</span>
                </div>
                <div className="mt-1 flex gap-1">
                  {result.station.lines.map(line => (
                    <span
                      key={line}
                      className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                      style={{ backgroundColor: `var(--line-${line})`, color: `var(--line-${line}-ink)` }}
                    >
                      {line}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <Link
                  to={`/station/${result.station.id}`}
                  className="press flex h-9 items-center justify-center gap-1.5 rounded-xl bg-accent px-3.5 text-[13px] font-medium text-foreground"
                >
                  Board <IconChevronRight size={14} />
                </Link>
                <a
                  href={mapsDirectionsUrl(result.station.lat, result.station.lng, result.station.name)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="press flex h-9 items-center justify-center gap-1.5 rounded-xl bg-primary/10 px-3.5 text-[13px] font-medium text-primary"
                >
                  <IconRoute size={14} /> Directions
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Curated places by category */}
        {CATEGORY_ORDER.map(category => {
          const places = RESOLVED_PLACES.filter(p => p.category === category);
          return (
            <div key={category}>
              <h2 className="mb-2 flex items-center gap-1.5 text-[13px] font-semibold text-muted-foreground">
                {CATEGORY_ICON[category]}
                {CATEGORY_LABELS[category]}
              </h2>
              <div className="flex flex-wrap gap-2">
                {places.map(place => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => handleCuratedPick(place)}
                    className="press rounded-full border border-border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground hover:bg-accent"
                  >
                    {place.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
