import { Link, NavLink, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { useMetroClock } from '@/src/hooks/useMetroClock.ts';
import { formatClock12 } from '@/src/lib/metro/clock.ts';
import { InstallButton } from '@/src/features/pwa/InstallButton.tsx';
import { cn } from '@/lib/utils';
import { LiveBadge } from './LiveBadge.tsx';
import { PulseLogo } from './PulseLogo.tsx';
import { NAV_ITEMS } from './nav.ts';

const SPRING = { type: 'spring', stiffness: 420, damping: 36 } as const;

/** Floating glass nav island — full links from md up, logo + clock + menu below. */
export function TopIsland({
  menuOpen,
  onToggleMenu,
  onOpenLines,
}: {
  menuOpen: boolean;
  onToggleMenu: () => void;
  onOpenLines: () => void;
}) {
  const { pathname } = useLocation();
  const { secondsOfDay } = useMetroClock();
  const { time, meridiem } = formatClock12(secondsOfDay);

  return (
    <header className="glass fixed top-[max(14px,env(safe-area-inset-top))] left-1/2 z-40 flex w-max max-w-[calc(100%-28px)] -translate-x-1/2 items-center gap-1 rounded-full p-1.5 shadow-lg">
      <Link to="/" className="flex shrink-0 items-center gap-2 py-0.5 pr-3 pl-1.5" aria-label="Pulse home">
        <PulseLogo size={28} />
        <span className="font-display text-[15px] font-semibold tracking-tight">Pulse</span>
      </Link>

      <nav aria-label="Primary" className="hidden items-center gap-0.5 md:flex">
        {NAV_ITEMS.map(item => {
          const active = item.match(pathname);
          const inner = (
            <>
              {active && (
                <motion.span layoutId="island-pill" transition={SPRING} className="absolute inset-0 rounded-full bg-white/10" />
              )}
              <span className="relative">{item.label}</span>
            </>
          );
          const cls = cn(
            'relative rounded-full px-3.5 py-2 text-[13px] font-semibold transition-colors duration-300 lg:px-4',
            active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
          );
          return item.to ? (
            <NavLink key={item.label} to={item.to} className={cls}>
              {inner}
            </NavLink>
          ) : (
            <button key={item.label} type="button" onClick={onOpenLines} className={cls}>
              {inner}
            </button>
          );
        })}
      </nav>

      <span className="tnum shrink-0 rounded-full bg-white/6 px-3 py-[7px] font-mono text-[13px]">
        {time}
        <span className="ml-1 text-[10px] text-muted-foreground">{meridiem}</span>
      </span>

      <div className="hidden items-center gap-1 md:flex">
        <LiveBadge />
        <InstallButton />
      </div>

      <button
        type="button"
        onClick={onToggleMenu}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={menuOpen}
        className="relative h-9 w-9 shrink-0 rounded-full bg-white/6 md:hidden"
      >
        <span
          className={cn(
            'absolute right-[11px] left-[11px] h-[1.5px] bg-foreground transition-all duration-500 ease-(--spring)',
            menuOpen ? 'top-[17px] rotate-45' : 'top-[14px]'
          )}
        />
        <span
          className={cn(
            'absolute right-[11px] left-[11px] h-[1.5px] bg-foreground transition-all duration-500 ease-(--spring)',
            menuOpen ? 'top-[17px] -rotate-45' : 'top-[20px]'
          )}
        />
      </button>
    </header>
  );
}
