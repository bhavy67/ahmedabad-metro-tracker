import { useState } from 'react';
import { IconTrash, IconLoader2 } from '@tabler/icons-react';
import { APP_VERSION, BUILD_ID, BUILD_TIME, CACHE_EPOCH, hardReset } from '@/src/lib/pwa/cacheBust.ts';

function buildDate(): string {
  const d = new Date(BUILD_TIME);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * The self-serve end of cache busting. "It still shows the old version" is the
 * one PWA complaint a user cannot act on without a button like this, and the
 * build stamp next to it is what turns a bug report into a diagnosable one.
 */
export function BuildFooter() {
  const [clearing, setClearing] = useState(false);

  async function clear() {
    setClearing(true);
    await hardReset(); // navigates away; the spinner only covers the wipe
  }

  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-1.5 pt-5 pb-2">
      <p className="tnum font-mono text-[11px] leading-relaxed text-muted-foreground">
        v{APP_VERSION} · build {BUILD_ID} · cache v{CACHE_EPOCH}
        <br />
        {buildDate()}
      </p>
      <button
        type="button"
        onClick={clear}
        disabled={clearing}
        className="press surface surface-hover flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-bold text-muted-foreground hover:text-foreground disabled:opacity-60"
      >
        {clearing ? <IconLoader2 size={14} className="animate-spin" /> : <IconTrash size={14} stroke={1.75} />}
        {clearing ? 'Clearing…' : 'Clear cache & reload'}
      </button>
    </footer>
  );
}
