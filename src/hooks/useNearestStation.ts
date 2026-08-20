import { useCallback, useState } from 'react';
import { nearestStation } from '@/src/lib/metro/geo.ts';
import type { NetworkStation } from '@/src/lib/metro/types.ts';

interface State {
  status: 'idle' | 'locating' | 'ready' | 'error';
  station: NetworkStation | null;
  distanceMeters: number | null;
  errorMessage: string | null;
}

/**
 * User-triggered geolocation lookup — never auto-requests permission on
 * mount. Call `locate()` from a button so the permission prompt is always
 * tied to an explicit action.
 */
export function useNearestStation() {
  const [state, setState] = useState<State>({ status: 'idle', station: null, distanceMeters: null, errorMessage: null });

  const locate = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setState({ status: 'error', station: null, distanceMeters: null, errorMessage: 'Location is not available on this device.' });
      return;
    }
    setState(s => ({ ...s, status: 'locating', errorMessage: null }));
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { station, distanceMeters } = nearestStation([pos.coords.latitude, pos.coords.longitude]);
        setState({ status: 'ready', station, distanceMeters, errorMessage: null });
      },
      err => {
        setState({ status: 'error', station: null, distanceMeters: null, errorMessage: err.message || 'Could not get your location.' });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  return { ...state, locate };
}
