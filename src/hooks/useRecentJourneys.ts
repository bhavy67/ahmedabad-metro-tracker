import { useCallback, useEffect, useState } from 'react';

export interface RecentJourney {
  originId: string;
  destinationId: string;
}

const STORAGE_KEY = 'metro-tracker:recent-journeys';
const MAX = 3;

function read(): RecentJourney[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as RecentJourney[]) : [];
  } catch {
    return [];
  }
}

function write(journeys: RecentJourney[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(journeys));
  } catch { /* quota / private mode */ }
}

export function useRecentJourneys() {
  const [recents, setRecents] = useState<RecentJourney[]>(read);

  useEffect(() => { write(recents); }, [recents]);

  const add = useCallback((originId: string, destinationId: string) => {
    setRecents(prev => {
      // Remove any existing entry for the same pair, then prepend, then trim.
      const filtered = prev.filter(r => !(r.originId === originId && r.destinationId === destinationId));
      return [{ originId, destinationId }, ...filtered].slice(0, MAX);
    });
  }, []);

  return { recents, add };
}
