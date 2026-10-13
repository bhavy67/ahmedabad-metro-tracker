import { useState } from 'react';
import { Link } from 'react-router';
import { IconTrash, IconLoader2, IconCircleCheck, IconCalendarEvent } from '@tabler/icons-react';
import { hardReset } from '@/src/lib/pwa/cacheBust.ts';
import { timetableInfo } from '@/src/lib/metro/network.ts';
import { PulseLogo } from './PulseLogo.tsx';

/**
 * Home page sign-off. Build stamps live in the "About live data" sheet; this
 * keeps only what a rider cares about, plus the self-serve cache reset —
 * "it still shows the old version" is the one PWA problem users can't fix
 * any other way.
 */
export function AppFooter() {
  const [clearing, setClearing] = useState(false);

  async function reloadFresh() {
    setClearing(true);
    await hardReset(); // navigates away; the spinner only covers the wipe
  }

  return (
    <footer className="flex flex-col gap-5 border-t border-border px-1.5 pt-8 pb-2 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="flex items-center gap-2.5">
          <PulseLogo size={24} />
          <span className="font-display text-[16px] font-semibold tracking-tight">
            Metro<span className="glow-text">Now</span>
          </span>
        </div>
        <p className="mt-2 max-w-[42ch] text-[13px] text-muted-foreground">
          Live Ahmedabad Metro, computed from the official GMRC timetable. An unofficial companion app.
        </p>
        <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <IconCircleCheck size={13} stroke={1.75} /> Works offline
          </span>
          <span className="inline-flex items-center gap-1.5">
            <IconCalendarEvent size={13} stroke={1.75} /> Timetable from {timetableInfo.effective}
          </span>
          <Link to="/privacy" className="underline-offset-4 hover:text-foreground hover:underline">
            Privacy
          </Link>
        </p>
      </div>

      <button
        type="button"
        onClick={reloadFresh}
        disabled={clearing}
        className="press surface surface-hover flex items-center gap-1.5 self-start rounded-full px-3.5 py-2 text-[12px] font-bold text-muted-foreground hover:text-foreground disabled:opacity-60 md:self-auto"
      >
        {clearing ? <IconLoader2 size={14} className="animate-spin" /> : <IconTrash size={14} stroke={1.75} />}
        {clearing ? 'Clearing…' : 'Clear cache & reload'}
      </button>
    </footer>
  );
}
