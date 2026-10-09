import { useMemo, useState } from 'react';
import { IconSearch, IconChevronRight, IconMapPin, IconFlag, IconX } from '@tabler/icons-react';
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { allStations } from '@/src/lib/metro/network.ts';
import type { NetworkStation } from '@/src/lib/metro/types.ts';

export function StationPicker({
  label,
  value,
  onChange,
  exclude,
  icon = 'from',
}: {
  label: string;
  value: NetworkStation | null;
  onChange: (station: NetworkStation) => void;
  exclude?: string;
  icon?: 'from' | 'to';
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allStations()
      .filter(s => s.id !== exclude)
      .filter(s => !q || s.name.toLowerCase().includes(q) || s.nameGu.includes(q) || s.nameHi.includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [query, exclude]);

  const Icon = icon === 'from' ? IconMapPin : IconFlag;

  return (
    <Drawer open={open} onOpenChange={open => { setOpen(open); if (!open) setQuery(''); }} showSwipeHandle>
      <DrawerTrigger className="press surface surface-hover flex w-full items-center gap-3 rounded-[20px] py-3 pr-3 pl-4 text-left">
        <span
          className={icon === 'from' ? 'h-2.5 w-2.5 shrink-0 rounded-full border-2 border-muted-foreground' : 'h-2.5 w-2.5 shrink-0 rounded-full bg-foreground'}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold tracking-[0.16em] text-muted-foreground uppercase">{label}</span>
          <span className={value ? 'block truncate text-[16px] font-bold' : 'block truncate text-[16px] font-semibold text-muted-foreground'}>
            {value ? value.name : 'Select a station'}
          </span>
        </span>
        <Icon size={17} stroke={1.75} className="shrink-0 text-muted-foreground" />
      </DrawerTrigger>

      <DrawerContent style={{ '--drawer-height': '85dvh' } as React.CSSProperties}>
        <DrawerHeader className="pb-3">
          <div className="flex items-center justify-between">
            <DrawerTitle>{label}</DrawerTitle>
            <DrawerClose render={<button type="button" aria-label="Close" className="press flex h-9 w-9 items-center justify-center rounded-full bg-white/6 text-muted-foreground hover:bg-white/10 hover:text-foreground" />}>
              <IconX size={18} />
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <div className="relative mb-3 shrink-0">
            <IconSearch size={17} stroke={1.75} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search stations…"
              className="surface h-12 w-full rounded-full pr-4 pl-11 text-[15px] outline-none transition-colors focus:border-primary/60 focus:bg-primary/6"
            />
          </div>
          <ul className="-mx-1 min-h-0 flex-1 overflow-y-auto">
            {results.map(station => (
              <li key={station.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(station);
                    setOpen(false);
                    setQuery('');
                  }}
                  className="press flex w-full items-center gap-3 rounded-[16px] px-3 py-3 text-left hover:bg-white/5"
                >
                  <span className="flex w-7 shrink-0 gap-1">
                    {station.lines.map(line => (
                      <span
                        key={line}
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: `var(--line-${line})`, boxShadow: `0 0 8px var(--line-${line})` }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold text-foreground">{station.name}</span>
                    {station.isInterchange && (
                      <span className="block text-[12px] text-muted-foreground">Interchange</span>
                    )}
                  </span>
                  <IconChevronRight size={16} stroke={1.75} className="text-muted-foreground" />
                </button>
              </li>
            ))}
            {results.length === 0 && (
              <li className="py-8 text-center text-[14px] text-muted-foreground">
                No stations match "{query}"
              </li>
            )}
          </ul>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
