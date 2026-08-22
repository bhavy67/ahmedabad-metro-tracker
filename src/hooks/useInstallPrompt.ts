import { useCallback, useEffect, useState } from 'react';

type InstallStatus = 'installed' | 'ios' | 'ready' | 'unavailable';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as { MSStream?: unknown }).MSStream;
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const DISMISSED_KEY = 'pwa-install-dismissed';

export function useInstallPrompt() {
  const [status, setStatus] = useState<InstallStatus>(() => {
    if (isStandalone()) return 'installed';
    if (sessionStorage.getItem(DISMISSED_KEY)) return 'unavailable';
    if (isIos()) return 'ios';
    // In dev, pretend the prompt is ready so the button is always visible for styling/testing.
    if (import.meta.env.DEV) return 'ready';
    return 'unavailable';
  });
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || sessionStorage.getItem(DISMISSED_KEY)) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setStatus('ready');
    };
    const onInstalled = () => setStatus('installed');

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferred) {
      // Dev mode — no real prompt available, just log.
      if (import.meta.env.DEV) console.info('[PWA] Install prompt not available in dev mode. Build and serve production to test.');
      return;
    }
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === 'dismissed') {
      sessionStorage.setItem(DISMISSED_KEY, '1');
      setStatus('unavailable');
    }
  }, [deferred]);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setStatus('unavailable');
  }, []);

  return { status, install, dismiss };
}
