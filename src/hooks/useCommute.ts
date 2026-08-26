import { useCallback, useState } from 'react';

/** `to-work` is home → work (exactly as configured); `to-home` is the reverse. */
export type CommuteDirection = 'to-work' | 'to-home';

export interface CommuteConfig {
  homeStationId: string;
  workStationId: string;
  /** The leg last shown on the home card. Defaults to the configured home → work. */
  direction: CommuteDirection;
}

const STORAGE_KEY = 'metro-tracker:commute';

function read(): CommuteConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CommuteConfig>;
    if (!parsed?.homeStationId || !parsed?.workStationId) return null;
    return {
      homeStationId: parsed.homeStationId,
      workStationId: parsed.workStationId,
      // Configs saved before direction was persisted fall back to home → work.
      direction: parsed.direction === 'to-home' ? 'to-home' : 'to-work',
    };
  } catch {
    return null;
  }
}

function write(config: CommuteConfig | null) {
  try {
    if (config) localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    else localStorage.removeItem(STORAGE_KEY);
  } catch { /* quota / private mode */ }
}

export function useCommute() {
  const [commute, setCommute] = useState<CommuteConfig | null>(read);

  /**
   * Saving always lands on `to-work`, so the card reads back the pair exactly
   * as it was just entered: home → work, not the reverse.
   */
  const save = useCallback((homeStationId: string, workStationId: string) => {
    const config: CommuteConfig = { homeStationId, workStationId, direction: 'to-work' };
    setCommute(config);
    write(config);
  }, []);

  const setDirection = useCallback((direction: CommuteDirection) => {
    setCommute(prev => {
      if (!prev || prev.direction === direction) return prev;
      const next = { ...prev, direction };
      write(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setCommute(null);
    write(null);
  }, []);

  return { commute, save, setDirection, clear };
}
