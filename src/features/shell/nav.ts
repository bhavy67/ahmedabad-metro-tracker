import { IconCircleDot, IconMap2, IconRoute, IconMapPin, IconBuildingStore, type Icon } from '@tabler/icons-react';

export interface NavItem {
  /** Route to navigate to; absent for the Lines item, which opens the line picker. */
  to?: string;
  label: string;
  short: string;
  icon: Icon;
  match: (pathname: string) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Now', short: 'Now', icon: IconCircleDot, match: p => p === '/' },
  { to: '/map', label: 'Live map', short: 'Map', icon: IconMap2, match: p => p.startsWith('/map') },
  { label: 'Lines', short: 'Lines', icon: IconRoute, match: p => p.startsWith('/line') },
  { to: '/plan', label: 'Plan', short: 'Plan', icon: IconMapPin, match: p => p.startsWith('/plan') || p.startsWith('/station') },
  { to: '/places', label: 'Places', short: 'Places', icon: IconBuildingStore, match: p => p.startsWith('/places') },
];
