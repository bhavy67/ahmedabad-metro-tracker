import { IconWifiOff } from '@tabler/icons-react';
import { useOffline } from '@/src/hooks/useOffline.ts';

export function OfflineBanner() {
  const offline = useOffline();
  if (!offline) return null;

  return (
    <div className="flex shrink-0 items-center gap-2 bg-destructive/10 px-4 py-2.5 text-[13px] font-medium text-destructive">
      <IconWifiOff size={14} stroke={2} />
      Offline — schedule data is still available
    </div>
  );
}
