import { IconWifiOff } from '@tabler/icons-react';
import { useOffline } from '@/src/hooks/useOffline.ts';

export function OfflineBanner() {
  const offline = useOffline();
  if (!offline) return null;

  return (
    <div className="glass page-enter flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13px] font-semibold shadow-lg">
      <IconWifiOff size={15} stroke={1.75} className="text-destructive" />
      Offline — schedule data still works
    </div>
  );
}
