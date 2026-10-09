import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * How often to ask the browser to re-fetch sw.js. An installed PWA is resumed
 * far more often than it is cold-started, so without this a phone can sit on a
 * weeks-old build; the checks below cost one conditional request each.
 */
const UPDATE_POLL_MS = 15 * 60 * 1000;

// useRegisterSW runs per component, and StrictMode mounts twice — bind the
// window/document listeners once for the lifetime of the page.
let watching = false;

function watchForUpdates(registration: ServiceWorkerRegistration) {
  if (watching) return;
  watching = true;

  const check = () => { if (navigator.onLine) void registration.update(); };
  setInterval(check, UPDATE_POLL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') check();
  });
  window.addEventListener('online', check);
}

export function useAppUpdate() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) watchForUpdates(registration);
    },
  });

  return {
    needRefresh,
    update: () => updateServiceWorker(true),
  };
}
