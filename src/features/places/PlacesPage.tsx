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
import { Bezel } from '@/components/Bezel.tsx';

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
  transport: <IconTrain size={16} stroke={1.75} />,
  mall: <IconBuildingStore size={16} stroke={1.75} />,
  hospital: <IconHeartPlus size={16} stroke={1.75} />,
  education: <IconSchool size={16} stroke={1.75} />,
  attraction: <IconStars size={16} stroke={1.75} />,
};

const CATEGORY_TONE: Record<CuratedPlace['category'], string> = {
  transport: 'var(--line-violet)',
  mall: 'var(--line-yellow)',
  hospital: 'var(--line-red)',
  education: 'var(--line-blue)',
  attraction: 'var(--live)',
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
    <div className="mx-auto grid w-full max-w-[1240px] gap-3.5 px-3.5 md:px-7 lg:grid-cols-12 lg:items-start">
      <div className="flex flex-col gap-3.5 lg:sticky lg:top-0 lg:col-span-5">
        <header className="rise px-1.5 pb-2">
          <span className="eyebrow">
            <IconMapPin size={11} /> Places
          </span>
          <h1 className="mt-4 font-display text-[clamp(2rem,7.6vw,3rem)] leading-[1.02] font-medium tracking-[-0.045em]">
            Go <span className="glow-text">somewhere.</span>
          </h1>
          <p className="mt-3 max-w-[38ch] text-[15px] text-muted-foreground">
            Search any place in Ahmedabad and we'll find the closest metro station.
          </p>
        </header>

        {/* Search bar — relative + z-20 so the suggestions float over the cards below. */}
        <div className="rise relative z-20" style={{ '--i': 1 } as React.CSSProperties}>
          <IconSearch size={18} stroke={1.75} className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder="Search any place in Ahmedabad…"
            className="surface h-14 w-full rounded-full pr-12 pl-12 text-[15px] font-medium outline-none transition-colors focus:border-primary/60 focus:bg-primary/6"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); clear(); }}
              aria-label="Clear search"
              className="absolute top-1/2 right-3 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-white/8 hover:text-foreground"
            >
              <IconX size={16} />
            </button>
          )}

          {showDropdown && (
            <div className="row-fade-in absolute top-[calc(100%+8px)] right-0 left-0 overflow-hidden rounded-[24px] border border-border-strong bg-popover p-1.5 shadow-2xl">
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
                  className="press flex w-full items-start gap-3 rounded-[18px] px-3.5 py-3 text-left hover:bg-white/5"
                >
                  <IconMapPin size={16} stroke={1.75} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 block text-[14px] font-bold">{item.display_name.split(',')[0]}</span>
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

        {result && (
          <Bezel key={result.name} className="rise">
            <p className="text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">Nearest station to</p>
            <p className="mt-1 font-display text-[17px] font-medium tracking-tight">{result.name}</p>

            <div className="surface mt-4 flex items-center gap-3 rounded-[20px] p-3.5">
              <span className="flex gap-1">
                {result.station.lines.map(line => (
                  <span
                    key={line}
                    className="h-9 w-2 rounded-full"
                    style={{ backgroundColor: `var(--line-${line})`, boxShadow: `0 0 14px var(--line-${line})` }}
                  />
                ))}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-[19px] font-medium tracking-tight">{result.station.name}</p>
                <p className="tnum mt-0.5 font-mono text-[12px] text-muted-foreground">
                  {(result.distanceMeters / 1000).toFixed(1)} km · ~{walkingMinutes(result.distanceMeters)} min walk
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link to={`/station/${result.station.id}`} className="pill-btn">
                Departures
                <span className="knob">
                  <IconChevronRight size={17} stroke={1.75} />
                </span>
              </Link>
              <a
                href={mapsDirectionsUrl(result.station.lat, result.station.lng, result.station.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="pill-btn ghost"
              >
                Walk there
                <span className="knob">
                  <IconRoute size={16} stroke={1.75} />
                </span>
              </a>
            </div>
          </Bezel>
        )}
      </div>

      {/* Curated places by category */}
      <div className="flex flex-col gap-3.5 lg:col-span-7">
        {CATEGORY_ORDER.map((category, i) => {
          const places = RESOLVED_PLACES.filter(p => p.category === category);
          const tone = CATEGORY_TONE[category];
          return (
            <Bezel key={category} className="rise" style={{ '--i': i + 2 } as React.CSSProperties}>
              <h2 className="mb-3.5 flex items-center gap-2.5 font-display text-[17px] font-medium tracking-tight">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ color: tone, backgroundColor: `color-mix(in srgb, ${tone} 15%, transparent)` }}
                >
                  {CATEGORY_ICON[category]}
                </span>
                {CATEGORY_LABELS[category]}
              </h2>
              <div className="flex flex-wrap gap-2">
                {places.map(place => (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => handleCuratedPick(place)}
                    className="press surface surface-hover rounded-full px-3.5 py-2 text-[13px] font-semibold"
                  >
                    {place.name}
                  </button>
                ))}
              </div>
            </Bezel>
          );
        })}
      </div>
    </div>
  );
}
