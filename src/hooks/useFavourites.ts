import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'metro-tracker:favourites';

function read(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function useFavourites() {
  const [favourites, setFavourites] = useState<string[]>(read);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favourites));
    } catch {
      // Storage unavailable (private mode / quota) — favourites just won't persist.
    }
  }, [favourites]);

  const toggle = useCallback((stationId: string) => {
    setFavourites(prev => (prev.includes(stationId) ? prev.filter(id => id !== stationId) : [...prev, stationId]));
  }, []);

  const isFavourite = useCallback((stationId: string) => favourites.includes(stationId), [favourites]);

  return { favourites, toggle, isFavourite };
}
