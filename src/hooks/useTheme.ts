import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark';

const STORAGE_KEY = 'metro-tracker:theme';

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function read(): ThemePreference {
  if (typeof window === 'undefined') return 'light';
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === 'light' || raw === 'dark') return raw;
  // No stored preference yet — pick a sensible default from the system.
  return systemPrefersDark() ? 'dark' : 'light';
}

function apply(pref: ThemePreference): void {
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(pref);
}

/** Read persisted preference on module load so the very first paint matches. */
if (typeof window !== 'undefined') {
  apply(read());
}

export function useTheme() {
  const [preference, setPreference] = useState<ThemePreference>(read);

  useEffect(() => {
    apply(preference);
    try {
      window.localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      // storage unavailable — theme still applied for the session
    }
  }, [preference]);

  const toggle = useCallback(() => {
    setPreference(prev => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  return { preference, setPreference, toggle };
}
