import { IconRefresh } from '@tabler/icons-react';
import { useAppUpdate } from '@/src/hooks/useAppUpdate.ts';

export function UpdateBanner() {
  const { needRefresh, update } = useAppUpdate();
  if (!needRefresh) return null;

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-primary/8 px-4 py-2.5">
      <p className="text-[13px] font-medium text-foreground">A new version is ready</p>
      <button
        type="button"
        onClick={update}
        className="press flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-[12px] font-semibold text-primary-foreground"
      >
        <IconRefresh size={13} stroke={2.5} />
        Update now
      </button>
    </div>
  );
}
