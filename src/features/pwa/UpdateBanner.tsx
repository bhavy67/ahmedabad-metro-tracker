import { IconRefresh } from '@tabler/icons-react';
import { useAppUpdate } from '@/src/hooks/useAppUpdate.ts';

export function UpdateBanner() {
  const { needRefresh, update } = useAppUpdate();
  if (!needRefresh) return null;

  return (
    <div className="glass page-enter flex items-center justify-between gap-3 rounded-full py-1.5 pr-1.5 pl-4 shadow-lg">
      <p className="text-[13px] font-semibold">A new version is ready</p>
      <button
        type="button"
        onClick={update}
        className="press flex items-center gap-1.5 rounded-full bg-foreground px-3.5 py-2 text-[12px] font-bold text-background"
      >
        <IconRefresh size={13} stroke={2.25} />
        Update
      </button>
    </div>
  );
}
