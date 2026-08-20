import { NavLink, useLocation } from 'react-router';
import { IconHome2, IconMapPin, IconRoute, IconMap2 } from '@tabler/icons-react';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/', label: 'Home', icon: IconHome2, match: (p: string) => p === '/' },
  { to: '/map', label: 'Live Map', icon: IconMap2, match: (p: string) => p.startsWith('/map') },
  { to: '/line/blue', label: 'Lines', icon: IconRoute, match: (p: string) => p.startsWith('/line') },
  { to: '/plan', label: 'Plan Trip', icon: IconMapPin, match: (p: string) => p.startsWith('/plan') || p.startsWith('/station') },
];

export function BottomTabBar() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Primary"
      className="grid shrink-0 grid-cols-4 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur supports-backdrop-filter:bg-card/80"
    >
      {TABS.map(tab => {
        const active = tab.match(pathname);
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={cn(
              'flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon size={22} stroke={active ? 2.25 : 1.75} />
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
