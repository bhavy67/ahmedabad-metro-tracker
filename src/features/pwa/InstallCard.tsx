import { IconDownload, IconShare2, IconX } from '@tabler/icons-react';
import { useInstallPrompt } from '@/src/hooks/useInstallPrompt.ts';

export function InstallCard() {
  const { status, install, dismiss } = useInstallPrompt();

  if (status === 'installed' || status === 'unavailable') return null;

  return (
    <section className="px-4 pt-4">
      {status === 'ios' ? (
        <div className="relative rounded-2xl border border-border bg-card p-4 shadow-sm">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <IconX size={15} />
          </button>
          <div className="flex items-start gap-3 pr-6">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconShare2 size={18} />
            </span>
            <div>
              <p className="font-display text-[14px] font-semibold">Add to Home Screen</p>
              <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
                Tap <span className="font-semibold text-foreground">Share ↑</span> then{' '}
                <span className="font-semibold text-foreground">"Add to Home Screen"</span> for instant offline access.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
          >
            <IconX size={15} />
          </button>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <IconDownload size={18} />
          </span>
          <div className="min-w-0 flex-1 pr-6">
            <p className="font-display text-[14px] font-semibold">Install Ahmedabad Metro</p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">Offline access · faster · home screen shortcut</p>
          </div>
          <button
            type="button"
            onClick={install}
            className="press shrink-0 rounded-full bg-primary px-4 py-1.5 text-[13px] font-semibold text-primary-foreground"
          >
            Install
          </button>
        </div>
      )}
    </section>
  );
}
