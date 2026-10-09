import { NavLink, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './nav.ts';

const SPRING = { type: 'spring', stiffness: 420, damping: 36 } as const;

/** Floating glass dock (mobile). The active pill slides between tabs. */
export function BottomTabBar({ onOpenLines }: { onOpenLines: () => void }) {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="glass fixed bottom-[calc(14px+env(safe-area-inset-bottom))] left-1/2 z-40 grid w-[min(440px,calc(100%-28px))] -translate-x-1/2 grid-cols-5 gap-0.5 rounded-full p-1.5 shadow-lg md:hidden"
    >
      {NAV_ITEMS.map(item => {
        const active = item.match(pathname);
        const Icon = item.icon;
        const inner = (
          <>
            {active && (
              <motion.span layoutId="dock-pill" transition={SPRING} className="absolute inset-0 rounded-full bg-foreground" />
            )}
            <Icon size={21} stroke={1.6} className="relative" />
            <span className="relative">{item.short}</span>
          </>
        );
        const cls = cn(
          'press relative flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-full text-[10px] font-bold transition-colors duration-300',
          active ? 'text-background' : 'text-muted-foreground'
        );
        return item.to ? (
          <NavLink key={item.label} to={item.to} className={cls}>
            {inner}
          </NavLink>
        ) : (
          <button key={item.label} type="button" onClick={onOpenLines} aria-label="Open line picker" className={cls}>
            {inner}
          </button>
        );
      })}
    </nav>
  );
}
