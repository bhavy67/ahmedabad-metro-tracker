import { useCallback, useRef, useState } from 'react';

export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface State {
  results: NominatimResult[];
  status: 'idle' | 'loading' | 'done' | 'error';
}

// Rough bounding box around Ahmedabad to bias results locally
const VIEWBOX = '72.40,23.25,72.75,22.90';

export function useNominatim() {
  const [state, setState] = useState<State>({ results: [], status: 'idle' });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setState({ results: [], status: 'idle' });
      return;
    }

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setState(s => ({ ...s, status: 'loading' }));
      try {
        const params = new URLSearchParams({
          q: `${query}, Ahmedabad`,
          format: 'json',
          limit: '5',
          countrycodes: 'in',
          viewbox: VIEWBOX,
          bounded: '0',
        });
        const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
          headers: { 'Accept-Language': 'en', 'User-Agent': 'AhmedabadMetroTracker/1.0' },
          signal: abortRef.current.signal,
        });
        const data: NominatimResult[] = await res.json();
        setState({ results: data, status: 'done' });
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setState({ results: [], status: 'error' });
      }
    }, 400);
  }, []);

  const clear = useCallback(() => {
    debounceRef.current && clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    setState({ results: [], status: 'idle' });
  }, []);

  return { ...state, search, clear };
}
