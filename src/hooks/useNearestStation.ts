import { useCallback, useEffect, useState } from 'react';
import { nearestStation } from '@/src/lib/metro/geo.ts';
import type { NetworkStation } from '@/src/lib/metro/types.ts';

interface State {
  status: 'idle' | 'locating' | 'ready' | 'error';
  station: NetworkStation | null;
  distanceMeters: number | null;
  errorMessage: string | null;
}

const IDLE: State = { status: 'idle', station: null, distanceMeters: null, errorMessage: null };

// Module-level cache — survives component unmount so navigating away and back
// restores the last known result without asking the user to re-locate.
let cache: State = IDLE;

export function useNearestStation() {
  const [state, setState] = useState<State>(() => cache);

  const set = useCallback((next: State) => {
    cache = next;
    setState(next);
  }, []);

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      set({ status: 'error', station: null, distanceMeters: null, errorMessage: 'Location is not available on this device.' });
      return;
    }
    set({ ...cache, status: 'locating', errorMessage: null });
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { station, distanceMeters } = nearestStation([pos.coords.latitude, pos.coords.longitude]);
        set({ status: 'ready', station, distanceMeters, errorMessage: null });
      },
      err => {
        set({ status: 'error', station: null, distanceMeters: null, errorMessage: err.message || 'Could not get your location.' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [set]);

  // If the user already granted permission in a previous visit this session,
  // silently re-locate on mount instead of showing the prompt again.
  useEffect(() => {
    if (cache.status !== 'idle') return;
    navigator.permissions?.query({ name: 'geolocation' as PermissionName })
      .then(r => { if (r.state === 'granted') locate(); })
      .catch(() => {});
  }, [locate]);

  return { ...state, locate };
}
