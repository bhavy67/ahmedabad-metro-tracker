import { NavLink, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { NAV_ITEMS } from './nav.ts';

/**
 * Floating glass dock (mobile). The five tabs are equal-width grid columns, so
 * the active pill is a single element slid by `translateX(index * 100%)` —
 * pure CSS, no measuring.
 */
export function BottomTabBar({ onOpenLines }: { onOpenLines: () => void }) {
  const { pathname } = useLocation();
  const activeIndex = NAV_ITEMS.findIndex(item => item.match(pathname));

  return (
    <nav
      aria-label="Primary"
      className="glass fixed bottom-[calc(14px+env(safe-area-inset-bottom))] left-1/2 z-40 grid w-[min(440px,calc(100%-28px))] -translate-x-1/2 grid-cols-5 rounded-full p-1.5 shadow-lg md:hidden"
    >
      <span
        aria-hidden
        className={cn(
          'absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-12px)/5)] rounded-full bg-foreground transition-[transform,opacity] duration-500 ease-(--spring)',
          activeIndex < 0 && 'opacity-0'
        )}
        style={{ transform: `translateX(${Math.max(0, activeIndex) * 100}%)` }}
      />
      {NAV_ITEMS.map((item, i) => {
        const active = i === activeIndex;
        const Icon = item.icon;
        const inner = (
          <>
            <Icon size={21} stroke={1.6} />
            <span>{item.short}</span>
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
          <button key={item.label} type="button" onClick={onOpenLines} aria-haspopup="dialog" className={cls}>
            {inner}
          </button>
        );
      })}
    </nav>
  );
}
