import { useRegisterSW } from 'virtual:pwa-register/react';

export function useAppUpdate() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();
  return {
    needRefresh,
    update: () => updateServiceWorker(true),
  };
}
