import { useCallback, useState } from 'react';

export interface CommuteConfig {
  homeStationId: string;
  workStationId: string;
}

const STORAGE_KEY = 'metro-tracker:commute';

function read(): CommuteConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CommuteConfig) : null;
  } catch {
    return null;
  }
}

export function useCommute() {
  const [commute, setCommute] = useState<CommuteConfig | null>(read);

  const save = useCallback((homeStationId: string, workStationId: string) => {
    const config: CommuteConfig = { homeStationId, workStationId };
    setCommute(config);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); } catch { /* quota */ }
  }, []);

  const clear = useCallback(() => {
    setCommute(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* quota */ }
  }, []);

  return { commute, save, clear };
}
